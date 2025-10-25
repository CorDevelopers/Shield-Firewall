/**
 * Network Request Interceptor for SHIELD.js
 * Intercepts and analyzes all network requests (fetch and XMLHttpRequest)
 * Provides comprehensive request/response monitoring and blocking
 */

import logger from '../utils/logger.js';

class NetworkInterceptor {
  constructor(threatDetector) {
    this.threatDetector = threatDetector;
    this.originalFetch = window.fetch;
    this.originalXMLHttpRequest = window.XMLHttpRequest;
    this.isActive = false;
    this.requestQueue = new Map();
    this.requestId = 0;

    // Rate limiting
    this.requestCounts = new Map();
    this.rateLimitWindow = 60000; // 1 minute
    this.rateLimitMax = 100; // Max requests per window

    // Request caching
    this.responseCache = new Map();
    this.cacheMaxAge = 300000; // 5 minutes
  }

  /**
   * Initialize network interception
   */
  initialize() {
    this.interceptFetch();
    this.interceptXMLHttpRequest();
    this.isActive = true;

    logger.info('Network Interceptor initialized');
  }

  /**
   * Intercept fetch requests
   */
  interceptFetch() {
    window.fetch = async (input, init = {}) => {
      const requestId = ++this.requestId;
      const request = new Request(input, init);

      // Pre-request analysis
      const preAnalysis = await this.analyzeOutgoingRequest(request, requestId);

      if (preAnalysis.action === 'block') {
        logger.threatDetected('request_blocked', {
          type: 'fetch',
          url: request.url,
          method: request.method,
          reasons: preAnalysis.reasons,
          score: preAnalysis.score
        });

        // Return blocked response
        return new Response(
          JSON.stringify({ error: 'Request blocked by SHIELD', code: 'BLOCKED' }),
          {
            status: 403,
            statusText: 'Forbidden',
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Check rate limiting
      if (this.isRateLimited(request.url)) {
        logger.threatDetected('rate_limit_exceeded', {
          url: request.url,
          method: request.method
        });

        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded', code: 'RATE_LIMITED' }),
          {
            status: 429,
            statusText: 'Too Many Requests',
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Check cache
      const cacheKey = await this.generateCacheKey(request);
      const cachedResponse = this.getCachedResponse(cacheKey);
      if (cachedResponse && this.isCacheValid(cachedResponse)) {
        logger.debug('Serving cached response', { url: request.url });
        return cachedResponse.response.clone();
      }

      // Store request info
      this.requestQueue.set(requestId, {
        request,
        startTime: Date.now(),
        cacheKey
      });

      try {
        // Make the actual request
        const response = await this.originalFetch(request);

        // Post-request analysis
        const postAnalysis = await this.analyzeIncomingResponse(response, request.url, requestId);

        if (postAnalysis.action === 'block') {
          logger.threatDetected('response_blocked', {
            type: 'fetch',
            url: request.url,
            status: response.status,
            reasons: postAnalysis.reasons,
            score: postAnalysis.score
          });

          return new Response(
            JSON.stringify({ error: 'Response blocked by SHIELD', code: 'BLOCKED' }),
            {
              status: 403,
              statusText: 'Forbidden',
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }

        // Clone response for caching and analysis
        const responseClone = response.clone();

        // Cache successful responses
        if (response.ok && this.shouldCache(request)) {
          this.cacheResponse(cacheKey, responseClone);
        }

        // Log successful request
        this.logRequest(requestId, request, response, 'success');

        return response;

      } catch (error) {
        // Log failed request
        this.logRequest(requestId, request, null, 'error', error);
        throw error;
      } finally {
        // Cleanup
        this.requestQueue.delete(requestId);
      }
    };
  }

  /**
   * Intercept XMLHttpRequest
   */
  interceptXMLHttpRequest() {
    const self = this;
    const OriginalXHR = this.originalXMLHttpRequest;

    window.XMLHttpRequest = function() {
      const xhr = new OriginalXHR();
      const requestId = ++self.requestId;

      // Store original methods
      const originalOpen = xhr.open;
      const originalSend = xhr.send;
      const originalSetRequestHeader = xhr.setRequestHeader;

      const requestData = {
        method: null,
        url: null,
        headers: {},
        body: null
      };

      // Override open
      xhr.open = function(method, url, async = true, user = null, password = null) {
        requestData.method = method;
        requestData.url = url;

        // Check for suspicious URLs
        if (self.isSuspiciousUrl(url)) {
          logger.threatDetected('suspicious_xhr_url', {
            url,
            method
          });
        }

        return originalOpen.call(this, method, url, async, user, password);
      };

      // Override setRequestHeader
      xhr.setRequestHeader = function(header, value) {
        requestData.headers[header.toLowerCase()] = value;
        return originalSetRequestHeader.call(this, header, value);
      };

      // Override send
      xhr.send = function(body) {
        requestData.body = body;

        // Create a Request-like object for analysis
        const fakeRequest = {
          url: requestData.url,
          method: requestData.method,
          headers: new Headers(requestData.headers),
          body: body
        };

        // Analyze request
        self.analyzeOutgoingRequest(fakeRequest, requestId).then(analysis => {
          if (analysis.action === 'block') {
            logger.threatDetected('xhr_request_blocked', {
              url: requestData.url,
              method: requestData.method,
              reasons: analysis.reasons,
              score: analysis.score
            });

            // Abort the request
            xhr.abort();
            return;
          }

          // Check rate limiting
          if (self.isRateLimited(requestData.url)) {
            logger.threatDetected('xhr_rate_limit_exceeded', {
              url: requestData.url,
              method: requestData.method
            });
            xhr.abort();
            return;
          }

          // Proceed with request
          self.requestQueue.set(requestId, {
            request: fakeRequest,
            startTime: Date.now(),
            xhr: true
          });

          // Setup response monitoring
          self.setupXHRResponseMonitoring(xhr, requestId);

          originalSend.call(this, body);
        }).catch(error => {
          logger.error('XHR request analysis failed', { error: error.message });
          originalSend.call(this, body);
        });
      };

      return xhr;
    };

    // Copy prototype
    window.XMLHttpRequest.prototype = OriginalXHR.prototype;
  }

  /**
   * Setup XHR response monitoring
   * @param {XMLHttpRequest} xhr - XHR object
   * @param {number} requestId - Request ID
   */
  setupXHRResponseMonitoring(xhr, requestId) {
    const originalOnLoad = xhr.onload;
    const originalOnError = xhr.onerror;

    xhr.onload = function(event) {
      const requestInfo = this.interceptor.requestQueue.get(requestId);
      if (requestInfo) {
        // Create fake response object
        const fakeResponse = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: this.parseXHRHeaders(xhr),
          url: xhr.responseURL,
          body: xhr.responseText
        };

        // Analyze response
        this.interceptor.analyzeIncomingResponse(fakeResponse, requestInfo.request.url, requestId)
          .then(analysis => {
            if (analysis.action === 'block') {
              logger.threatDetected('xhr_response_blocked', {
                url: requestInfo.request.url,
                status: xhr.status,
                reasons: analysis.reasons,
                score: analysis.score
              });

              // Clear response
              xhr.responseText = '';
              xhr.responseXML = null;
              xhr.status = 403;
              xhr.statusText = 'Forbidden';
            } else {
              // Log successful request
              this.interceptor.logRequest(requestId, requestInfo.request, fakeResponse, 'success');
            }
          });
      }

      // Call original onload
      if (originalOnLoad) {
        originalOnLoad.call(this, event);
      }
    }.bind({ interceptor: this });

    xhr.onerror = function(event) {
      const requestInfo = this.interceptor.requestQueue.get(requestId);
      if (requestInfo) {
        this.interceptor.logRequest(requestId, requestInfo.request, null, 'error');
      }

      // Call original onerror
      if (originalOnError) {
        originalOnError.call(this, event);
      }
    }.bind({ interceptor: this });
  }

  /**
   * Parse XHR response headers
   * @param {XMLHttpRequest} xhr - XHR object
   * @returns {Object} Parsed headers
   */
  parseXHRHeaders(xhr) {
    const headers = {};
    const headerString = xhr.getAllResponseHeaders();

    if (headerString) {
      const headerLines = headerString.split('\n');
      for (const line of headerLines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const name = line.substring(0, colonIndex).trim().toLowerCase();
          const value = line.substring(colonIndex + 1).trim();
          headers[name] = value;
        }
      }
    }

    return headers;
  }

  /**
   * Analyze outgoing request
   * @param {Request} request - Request object
   * @param {number} requestId - Request ID
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeOutgoingRequest(request, requestId) {
    try {
      return await this.threatDetector.analyzeRequest(request);
    } catch (error) {
      logger.error('Request analysis failed', { error: error.message, requestId });
      return { action: 'allow', score: 0, reasons: [] };
    }
  }

  /**
   * Analyze incoming response
   * @param {Response|Object} response - Response object
   * @param {string} requestUrl - Original request URL
   * @param {number} requestId - Request ID
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeIncomingResponse(response, requestUrl, requestId) {
    try {
      return await this.threatDetector.analyzeResponse(response, requestUrl);
    } catch (error) {
      logger.error('Response analysis failed', { error: error.message, requestId });
      return { action: 'allow', score: 0, reasons: [] };
    }
  }

  /**
   * Check if URL is suspicious
   * @param {string} url - URL to check
   * @returns {boolean} Is suspicious
   */
  isSuspiciousUrl(url) {
    try {
      const urlObj = new URL(url);

      // Check for suspicious schemes
      const suspiciousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:'];
      if (suspiciousSchemes.includes(urlObj.protocol)) {
        return true;
      }

      // Check for very long URLs
      if (url.length > 2048) {
        return true;
      }

      // Check for suspicious characters
      const suspiciousChars = /[<>'"&\\]/;
      if (suspiciousChars.test(url)) {
        return true;
      }

      return false;
    } catch {
      return true; // Invalid URLs are suspicious
    }
  }

  /**
   * Check rate limiting
   * @param {string} url - Request URL
   * @returns {boolean} Is rate limited
   */
  isRateLimited(url) {
    try {
      const domain = new URL(url).hostname;
      const now = Date.now();
      const windowStart = now - this.rateLimitWindow;

      if (!this.requestCounts.has(domain)) {
        this.requestCounts.set(domain, []);
      }

      const requests = this.requestCounts.get(domain);

      // Remove old requests
      const recentRequests = requests.filter(time => time > windowStart);
      recentRequests.push(now);

      this.requestCounts.set(domain, recentRequests);

      return recentRequests.length > this.rateLimitMax;
    } catch {
      return false;
    }
  }

  /**
   * Generate cache key for request
   * @param {Request} request - Request object
   * @returns {Promise<string>} Cache key
   */
  async generateCacheKey(request) {
    const keyData = {
      url: request.url,
      method: request.method,
      headers: {}
    };

    // Include important headers
    const cacheHeaders = ['accept', 'accept-language', 'user-agent'];
    for (const header of cacheHeaders) {
      const value = request.headers.get(header);
      if (value) {
        keyData.headers[header] = value;
      }
    }

    const keyString = JSON.stringify(keyData);
    return await crypto.subtle.digest('SHA-256', new TextEncoder().encode(keyString))
      .then(hash => Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(''));
  }

  /**
   * Check if request should be cached
   * @param {Request} request - Request object
   * @returns {boolean} Should cache
   */
  shouldCache(request) {
    // Only cache GET requests
    if (request.method !== 'GET') return false;

    // Don't cache sensitive URLs
    const sensitivePatterns = [/\/api\//, /\/auth\//, /\/user\//, /\?/, /#/];
    if (sensitivePatterns.some(pattern => pattern.test(request.url))) {
      return false;
    }

    return true;
  }

  /**
   * Cache response
   * @param {string} key - Cache key
   * @param {Response} response - Response to cache
   */
  cacheResponse(key, response) {
    this.responseCache.set(key, {
      response: response.clone(),
      timestamp: Date.now()
    });

    // Limit cache size
    if (this.responseCache.size > 100) {
      const oldestKey = this.responseCache.keys().next().value;
      this.responseCache.delete(oldestKey);
    }
  }

  /**
   * Get cached response
   * @param {string} key - Cache key
   * @returns {Object|null} Cached response
   */
  getCachedResponse(key) {
    return this.responseCache.get(key) || null;
  }

  /**
   * Check if cached response is still valid
   * @param {Object} cached - Cached response data
   * @returns {boolean} Is valid
   */
  isCacheValid(cached) {
    return (Date.now() - cached.timestamp) < this.cacheMaxAge;
  }

  /**
   * Log completed request
   * @param {number} requestId - Request ID
   * @param {Request} request - Request object
   * @param {Response} response - Response object
   * @param {string} status - Request status
   * @param {Error} error - Error object
   */
  logRequest(requestId, request, response, status, error = null) {
    const duration = Date.now() - this.requestQueue.get(requestId)?.startTime;

    const logData = {
      requestId,
      url: request.url,
      method: request.method,
      status,
      duration
    };

    if (response) {
      logData.responseStatus = response.status;
      logData.contentType = response.headers?.get('content-type');
    }

    if (error) {
      logData.error = error.message;
    }

    logger.performance('network_request', duration, 'ms');
    logger.debug('Network request completed', logData);
  }

  /**
   * Get network statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const domains = Array.from(this.requestCounts.keys());
    const totalRequests = domains.reduce((sum, domain) =>
      sum + this.requestCounts.get(domain).length, 0);

    return {
      active: this.isActive,
      queuedRequests: this.requestQueue.size,
      cachedResponses: this.responseCache.size,
      monitoredDomains: domains.length,
      totalRequests,
      rateLimitWindow: this.rateLimitWindow,
      rateLimitMax: this.rateLimitMax
    };
  }

  /**
   * Clear caches and counters
   */
  clearCaches() {
    this.requestCounts.clear();
    this.responseCache.clear();
    this.requestQueue.clear();
    logger.info('Network interceptor caches cleared');
  }

  /**
   * Set rate limiting parameters
   * @param {number} maxRequests - Max requests per window
   * @param {number} windowMs - Window size in milliseconds
   */
  setRateLimit(maxRequests, windowMs) {
    this.rateLimitMax = maxRequests;
    this.rateLimitWindow = windowMs;
    logger.info('Rate limiting updated', { maxRequests, windowMs });
  }

  /**
   * Restore original network functions
   */
  destroy() {
    window.fetch = this.originalFetch;
    window.XMLHttpRequest = this.originalXMLHttpRequest;
    this.clearCaches();
    this.isActive = false;
  }
}

export default NetworkInterceptor;