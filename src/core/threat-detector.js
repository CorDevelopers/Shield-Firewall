/**
 * Predictive Threat Detector for SHIELD.js
 * Advanced threat detection using request fingerprinting and pattern analysis
 * Implements machine learning-based threat prediction and blocking
 */

import logger from '../utils/logger.js';
import threatPatterns from '../utils/patterns.js';
import cryptoUtils from '../utils/crypto.js';

class PredictiveThreatDetector {
  constructor() {
    this.requestHistory = [];
    this.maxHistory = 1000;
    this.threatSignatures = new Map();
    this.requestFingerprints = new Map();
    this.blockedDomains = new Set();
    this.whitelistedDomains = new Set();
    this.threatThreshold = 75; // 0-100 scale
    this.learningEnabled = true;

    this.threatCategories = {
      xss: { weight: 90, patterns: threatPatterns.patterns.xss },
      injection: { weight: 85, patterns: threatPatterns.patterns.injection },
      csrf: { weight: 70, patterns: threatPatterns.patterns.csrf },
      cryptoMining: { weight: 95, patterns: threatPatterns.patterns.cryptoMining },
      fingerprinting: { weight: 60, patterns: threatPatterns.patterns.fingerprinting },
      keylogger: { weight: 80, patterns: threatPatterns.patterns.keylogger },
      clickjacking: { weight: 75, patterns: threatPatterns.patterns.clickjacking },
      sessionHijacking: { weight: 85, patterns: threatPatterns.patterns.sessionHijacking }
    };
  }

  /**
   * Analyze outgoing request for threats
   * @param {Request} request - Fetch request object
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeRequest(request) {
    const requestData = await this.extractRequestData(request);
    const fingerprint = await this.generateRequestFingerprint(requestData);
    const analysis = {
      fingerprint,
      timestamp: Date.now(),
      url: request.url,
      method: request.method,
      isThreat: false,
      score: 0,
      reasons: [],
      action: 'allow'
    };

    // Check against known threat signatures
    const signatureMatch = this.checkThreatSignatures(requestData);
    if (signatureMatch.isMatch) {
      analysis.score += signatureMatch.score;
      analysis.reasons.push(...signatureMatch.reasons);
    }

    // Check request fingerprint against history
    const fingerprintAnalysis = this.analyzeFingerprint(fingerprint);
    if (fingerprintAnalysis.suspicious) {
      analysis.score += fingerprintAnalysis.score;
      analysis.reasons.push(...fingerprintAnalysis.reasons);
    }

    // Domain-based checks
    const domainCheck = this.checkDomain(request.url);
    if (domainCheck.blocked) {
      analysis.score += 100;
      analysis.reasons.push('blocked_domain');
    }

    // Content analysis
    if (requestData.body) {
      const contentAnalysis = this.analyzeRequestContent(requestData.body);
      analysis.score += contentAnalysis.score;
      analysis.reasons.push(...contentAnalysis.reasons);
    }

    // Calculate final threat score
    analysis.isThreat = analysis.score >= this.threatThreshold;
    analysis.action = this.determineAction(analysis.score, analysis.reasons);

    // Store request for learning
    this.storeRequest(analysis);

    return analysis;
  }

  /**
   * Analyze incoming response for threats
   * @param {Response} response - Fetch response object
   * @param {string} requestUrl - Original request URL
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeResponse(response, requestUrl) {
    const responseData = await this.extractResponseData(response);
    const analysis = {
      timestamp: Date.now(),
      url: requestUrl,
      status: response.status,
      isThreat: false,
      score: 0,
      reasons: [],
      action: 'allow'
    };

    // Check response headers
    const headerAnalysis = this.analyzeResponseHeaders(responseData.headers);
    analysis.score += headerAnalysis.score;
    analysis.reasons.push(...headerAnalysis.reasons);

    // Check response content
    if (responseData.body) {
      const contentAnalysis = this.analyzeResponseContent(responseData.body, responseData.contentType);
      analysis.score += contentAnalysis.score;
      analysis.reasons.push(...contentAnalysis.reasons);
    }

    // Check for redirect chains
    if (response.redirected) {
      const redirectAnalysis = this.analyzeRedirectChain(response);
      analysis.score += redirectAnalysis.score;
      analysis.reasons.push(...redirectAnalysis.reasons);
    }

    analysis.isThreat = analysis.score >= this.threatThreshold;
    analysis.action = this.determineAction(analysis.score, analysis.reasons);

    return analysis;
  }

  /**
   * Extract data from request object
   * @param {Request} request - Request object
   * @returns {Promise<Object>} Request data
   */
  async extractRequestData(request) {
    const data = {
      url: request.url,
      method: request.method,
      headers: {},
      body: null
    };

    // Extract headers
    for (const [key, value] of request.headers) {
      data.headers[key.toLowerCase()] = value;
    }

    // Extract body if present
    if (request.body) {
      try {
        const clonedRequest = request.clone();
        data.body = await clonedRequest.text();
      } catch (error) {
        // Body might not be readable
      }
    }

    return data;
  }

  /**
   * Extract data from response object
   * @param {Response} response - Response object
   * @returns {Promise<Object>} Response data
   */
  async extractResponseData(response) {
    const data = {
      status: response.status,
      statusText: response.statusText,
      headers: {},
      body: null,
      contentType: null
    };

    // Extract headers
    for (const [key, value] of response.headers) {
      data.headers[key.toLowerCase()] = value;
    }

    data.contentType = data.headers['content-type'];

    // Extract body for analysis (limit size)
    if (response.body && this.shouldAnalyzeResponseBody(data.contentType)) {
      try {
        const clonedResponse = response.clone();
        const bodyText = await clonedResponse.text();
        // Limit body analysis to first 50KB
        data.body = bodyText.substring(0, 51200);
      } catch (error) {
        // Body might not be readable
      }
    }

    return data;
  }

  /**
   * Generate cryptographic fingerprint of request
   * @param {Object} requestData - Request data
   * @returns {Promise<string>} Request fingerprint
   */
  async generateRequestFingerprint(requestData) {
    const fingerprintData = {
      url: requestData.url,
      method: requestData.method,
      headers: this.normalizeHeaders(requestData.headers),
      bodyHash: requestData.body ? await cryptoUtils.hash(requestData.body) : null
    };

    const fingerprintString = JSON.stringify(fingerprintData, Object.keys(fingerprintData).sort());
    return await cryptoUtils.hash(fingerprintString);
  }

  /**
   * Normalize headers for fingerprinting
   * @param {Object} headers - Request headers
   * @returns {Object} Normalized headers
   */
  normalizeHeaders(headers) {
    const normalized = {};
    const importantHeaders = ['accept', 'accept-language', 'user-agent', 'referer'];

    for (const header of importantHeaders) {
      if (headers[header]) {
        normalized[header] = headers[header];
      }
    }

    return normalized;
  }

  /**
   * Check request against known threat signatures
   * @param {Object} requestData - Request data
   * @returns {Object} Signature match result
   */
  checkThreatSignatures(requestData) {
    const result = {
      isMatch: false,
      score: 0,
      reasons: []
    };

    // Check URL patterns
    const urlThreats = threatPatterns.detectCategoryThreats(requestData.url, 'general');
    if (urlThreats.length > 0) {
      result.isMatch = true;
      result.score += Math.max(...urlThreats.map(t => t.score));
      result.reasons.push('suspicious_url_pattern');
    }

    // Check headers for suspicious patterns
    for (const [key, value] of Object.entries(requestData.headers)) {
      const headerThreats = threatPatterns.analyzeContent(value);
      if (headerThreats.riskLevel !== 'none') {
        result.isMatch = true;
        result.score += headerThreats.maxScore;
        result.reasons.push(`suspicious_header: ${key}`);
      }
    }

    // Check body content
    if (requestData.body) {
      const bodyAnalysis = threatPatterns.analyzeContent(requestData.body);
      if (bodyAnalysis.riskLevel !== 'none') {
        result.isMatch = true;
        result.score += bodyAnalysis.maxScore;
        result.reasons.push('suspicious_request_body');
      }
    }

    return result;
  }

  /**
   * Analyze request fingerprint against history
   * @param {string} fingerprint - Request fingerprint
   * @returns {Object} Fingerprint analysis
   */
  analyzeFingerprint(fingerprint) {
    const result = {
      suspicious: false,
      score: 0,
      reasons: []
    };

    const existing = this.requestFingerprints.get(fingerprint);
    if (existing) {
      existing.count++;
      existing.lastSeen = Date.now();

      // Check for rapid repeated requests (potential DoS)
      const timeSinceFirst = Date.now() - existing.firstSeen;
      const requestRate = existing.count / (timeSinceFirst / 1000); // requests per second

      if (requestRate > 10) { // More than 10 requests per second
        result.suspicious = true;
        result.score += 60;
        result.reasons.push('high_request_frequency');
      }

      // Check for exact duplicates in short time
      const recentDuplicates = existing.timestamps.filter(
        t => Date.now() - t < 1000
      ).length;

      if (recentDuplicates > 3) {
        result.suspicious = true;
        result.score += 40;
        result.reasons.push('rapid_request_duplicates');
      }
    } else {
      // New fingerprint
      this.requestFingerprints.set(fingerprint, {
        count: 1,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        timestamps: [Date.now()]
      });
    }

    return result;
  }

  /**
   * Check if domain is blocked or whitelisted
   * @param {string} url - URL to check
   * @returns {Object} Domain check result
   */
  checkDomain(url) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      if (this.blockedDomains.has(domain)) {
        return { blocked: true, reason: 'blocked_domain' };
      }

      if (this.whitelistedDomains.has(domain)) {
        return { blocked: false, whitelisted: true };
      }

      return { blocked: false };
    } catch {
      return { blocked: true, reason: 'invalid_url' };
    }
  }

  /**
   * Analyze request content for threats
   * @param {string} content - Request content
   * @returns {Object} Content analysis
   */
  analyzeRequestContent(content) {
    const analysis = threatPatterns.analyzeContent(content);
    return {
      score: analysis.maxScore,
      reasons: analysis.threats.map(t => `${t.category}: ${t.pattern}`)
    };
  }

  /**
   * Analyze response headers for security issues
   * @param {Object} headers - Response headers
   * @returns {Object} Header analysis
   */
  analyzeResponseHeaders(headers) {
    const result = {
      score: 0,
      reasons: []
    };

    // Check for missing security headers
    const securityHeaders = [
      'content-security-policy',
      'x-frame-options',
      'x-content-type-options',
      'strict-transport-security'
    ];

    for (const header of securityHeaders) {
      if (!headers[header]) {
        result.score += 10;
        result.reasons.push(`missing_security_header: ${header}`);
      }
    }

    // Check for suspicious headers
    if (headers['x-powered-by']) {
      result.score += 5;
      result.reasons.push('information_disclosure_header');
    }

    return result;
  }

  /**
   * Analyze response content for threats
   * @param {string} content - Response content
   * @param {string} contentType - Content type
   * @returns {Object} Content analysis
   */
  analyzeResponseContent(content, contentType) {
    const result = {
      score: 0,
      reasons: []
    };

    // Only analyze HTML and JavaScript content
    if (contentType && (contentType.includes('html') || contentType.includes('javascript'))) {
      const analysis = threatPatterns.analyzeContent(content);
      result.score = analysis.maxScore;
      result.reasons = analysis.threats.map(t => `${t.category}: ${t.pattern}`);
    }

    return result;
  }

  /**
   * Analyze redirect chain for potential phishing
   * @param {Response} response - Response object
   * @returns {Object} Redirect analysis
   */
  analyzeRedirectChain(response) {
    const result = {
      score: 0,
      reasons: []
    };

    // Check for too many redirects
    if (response.redirected && response.url !== response.url) {
      try {
        const originalUrl = new URL(response.url);
        const finalUrl = new URL(response.url);

        // Check for domain changes in redirects
        if (originalUrl.hostname !== finalUrl.hostname) {
          result.score += 30;
          result.reasons.push('cross_domain_redirect');
        }
      } catch (error) {
        result.score += 20;
        result.reasons.push('suspicious_redirect_pattern');
      }
    }

    return result;
  }

  /**
   * Determine action based on score and reasons
   * @param {number} score - Threat score
   * @param {Array} reasons - Threat reasons
   * @returns {string} Action to take
   */
  determineAction(score, reasons) {
    if (score >= 90 || reasons.includes('blocked_domain')) {
      return 'block';
    } else if (score >= 75) {
      return 'quarantine';
    } else if (score >= 50) {
      return 'monitor';
    }

    return 'allow';
  }

  /**
   * Store request for learning and analysis
   * @param {Object} analysis - Request analysis
   */
  storeRequest(analysis) {
    this.requestHistory.push(analysis);

    if (this.requestHistory.length > this.maxHistory) {
      this.requestHistory.shift();
    }

    // Update learning if enabled
    if (this.learningEnabled && analysis.isThreat) {
      this.updateThreatSignatures(analysis);
    }
  }

  /**
   * Update threat signatures based on detected threats
   * @param {Object} analysis - Threat analysis
   */
  updateThreatSignatures(analysis) {
    const signature = {
      fingerprint: analysis.fingerprint,
      score: analysis.score,
      reasons: analysis.reasons,
      url: analysis.url,
      learnedAt: Date.now()
    };

    this.threatSignatures.set(analysis.fingerprint, signature);
  }

  /**
   * Add domain to blacklist
   * @param {string} domain - Domain to block
   */
  addToBlacklist(domain) {
    this.blockedDomains.add(domain);
    logger.securityEvent('domain_blacklisted', { domain });
  }

  /**
   * Add domain to whitelist
   * @param {string} domain - Domain to whitelist
   */
  addToWhitelist(domain) {
    this.whitelistedDomains.add(domain);
    logger.securityEvent('domain_whitelisted', { domain });
  }

  /**
   * Remove domain from blacklist
   * @param {string} domain - Domain to remove
   */
  removeFromBlacklist(domain) {
    this.blockedDomains.delete(domain);
    logger.securityEvent('domain_removed_from_blacklist', { domain });
  }

  /**
   * Remove domain from whitelist
   * @param {string} domain - Domain to remove
   */
  removeFromWhitelist(domain) {
    this.whitelistedDomains.delete(domain);
    logger.securityEvent('domain_removed_from_whitelist', { domain });
  }

  /**
   * Set threat detection threshold
   * @param {number} threshold - New threshold (0-100)
   */
  setThreshold(threshold) {
    this.threatThreshold = Math.max(0, Math.min(100, threshold));
    logger.info('Threat threshold updated', { threshold: this.threatThreshold });
  }

  /**
   * Enable or disable learning
   * @param {boolean} enabled - Learning enabled
   */
  setLearning(enabled) {
    this.learningEnabled = enabled;
    logger.info('Learning ' + (enabled ? 'enabled' : 'disabled'));
  }

  /**
   * Get detection statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const recentRequests = this.requestHistory.slice(-100);
    const threats = recentRequests.filter(r => r.isThreat);

    return {
      totalRequests: this.requestHistory.length,
      recentThreats: threats.length,
      threatRate: recentRequests.length > 0 ? (threats.length / recentRequests.length) * 100 : 0,
      blockedDomains: this.blockedDomains.size,
      whitelistedDomains: this.whitelistedDomains.size,
      uniqueFingerprints: this.requestFingerprints.size,
      threatSignatures: this.threatSignatures.size,
      threshold: this.threatThreshold,
      learningEnabled: this.learningEnabled
    };
  }

  /**
   * Clear stored data
   */
  clearData() {
    this.requestHistory = [];
    this.requestFingerprints.clear();
    this.threatSignatures.clear();
    logger.info('Threat detector data cleared');
  }

  /**
   * Check if response body should be analyzed
   * @param {string} contentType - Content type
   * @returns {boolean} Should analyze
   */
  shouldAnalyzeResponseBody(contentType) {
    if (!contentType) return false;

    const analyzableTypes = [
      'text/html',
      'text/javascript',
      'application/javascript',
      'application/x-javascript',
      'text/plain'
    ];

    return analyzableTypes.some(type => contentType.includes(type));
  }
}

export default PredictiveThreatDetector;