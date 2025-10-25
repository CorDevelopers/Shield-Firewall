/**
 * DOM Protection Layer for SHIELD.js
 * Real-time DOM monitoring, mutation detection, and XSS prevention
 * Implements comprehensive protection against DOM-based attacks
 */

import logger from '../utils/logger.js';
import threatPatterns from '../utils/patterns.js';

class DOMProtectionLayer {
  constructor() {
    this.observer = null;
    this.isActive = false;
    this.protectedElements = new WeakMap();
    this.domSnapshots = [];
    this.maxSnapshots = 50;
    this.sanitizationRules = {
      script: 'remove',
      iframe: 'restrict',
      object: 'remove',
      embed: 'remove',
      form: 'sanitize',
      input: 'sanitize',
      textarea: 'sanitize',
      a: 'sanitize'
    };

    this.dangerousAttributes = [
      'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout',
      'onkeydown', 'onkeyup', 'onkeypress', 'onsubmit', 'onchange',
      'onfocus', 'onblur', 'oninput', 'onanimationstart', 'onanimationend',
      'ontransitionend', 'src', 'href', 'action', 'formaction'
    ];

    this.allowedSchemes = ['http:', 'https:', 'mailto:', 'tel:'];
  }

  /**
   * Initialize DOM protection
   */
  initialize() {
    this.setupMutationObserver();
    this.setupEventListeners();
    this.createInitialSnapshot();
    this.isActive = true;

    logger.info('DOM Protection Layer initialized');
  }

  /**
   * Setup MutationObserver for DOM monitoring
   */
  setupMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      this.handleMutations(mutations);
    });

    this.observer.observe(document, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true,
      characterData: true,
      characterDataOldValue: true
    });
  }

  /**
   * Setup global event listeners for additional protection
   */
  setupEventListeners() {
    // Prevent dangerous script execution
    document.addEventListener('beforescriptexecute', (event) => {
      this.handleScriptExecution(event);
    }, true);

    // Monitor form submissions
    document.addEventListener('submit', (event) => {
      this.handleFormSubmission(event);
    }, true);

    // Monitor input changes
    document.addEventListener('input', (event) => {
      this.handleInputChange(event);
    }, true);

    // Prevent dangerous navigation
    document.addEventListener('click', (event) => {
      this.handleLinkClick(event);
    }, true);
  }

  /**
   * Handle DOM mutations
   * @param {MutationRecord[]} mutations - DOM mutations
   */
  handleMutations(mutations) {
    const suspiciousMutations = [];

    for (const mutation of mutations) {
      const analysis = this.analyzeMutation(mutation);

      if (analysis.suspicious) {
        suspiciousMutations.push({
          mutation,
          analysis,
          timestamp: Date.now()
        });
      }
    }

    if (suspiciousMutations.length > 0) {
      this.handleSuspiciousMutations(suspiciousMutations);
    }
  }

  /**
   * Analyze a single mutation for suspicious activity
   * @param {MutationRecord} mutation - DOM mutation
   * @returns {Object} Analysis result
   */
  analyzeMutation(mutation) {
    const result = {
      suspicious: false,
      severity: 'low',
      reasons: [],
      action: 'allow'
    };

    switch (mutation.type) {
    case 'childList':
      result.suspicious = this.analyzeChildListMutation(mutation, result);
      break;

    case 'attributes':
      result.suspicious = this.analyzeAttributeMutation(mutation, result);
      break;

    case 'characterData':
      result.suspicious = this.analyzeCharacterDataMutation(mutation, result);
      break;
    }

    // Determine action based on severity
    if (result.suspicious) {
      if (result.severity === 'critical') {
        result.action = 'block';
      } else if (result.severity === 'high') {
        result.action = 'quarantine';
      } else {
        result.action = 'monitor';
      }
    }

    return result;
  }

  /**
   * Analyze child list mutations
   * @param {MutationRecord} mutation - Child list mutation
   * @param {Object} result - Analysis result
   * @returns {boolean} Is suspicious
   */
  analyzeChildListMutation(mutation, result) {
    let isSuspicious = false;

    // Check added nodes
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node;

        // Check for dangerous elements
        if (this.isDangerousElement(element)) {
          result.reasons.push(`dangerous_element_added: ${element.tagName}`);
          result.severity = 'critical';
          isSuspicious = true;
        }

        // Check for script content
        if (element.tagName === 'SCRIPT') {
          const scriptContent = element.textContent || element.innerHTML;
          if (scriptContent && this.containsMaliciousCode(scriptContent)) {
            result.reasons.push('malicious_script_injected');
            result.severity = 'critical';
            isSuspicious = true;
          }
        }

        // Check for inline event handlers
        const eventHandlers = this.getEventHandlers(element);
        if (eventHandlers.length > 0) {
          result.reasons.push('inline_event_handlers_detected');
          result.severity = 'high';
          isSuspicious = true;
        }

        // Check for suspicious attributes
        const dangerousAttrs = this.getDangerousAttributes(element);
        if (dangerousAttrs.length > 0) {
          result.reasons.push(`dangerous_attributes: ${dangerousAttrs.join(', ')}`);
          result.severity = 'high';
          isSuspicious = true;
        }
      }
    });

    return isSuspicious;
  }

  /**
   * Analyze attribute mutations
   * @param {MutationRecord} mutation - Attribute mutation
   * @param {Object} result - Analysis result
   * @returns {boolean} Is suspicious
   */
  analyzeAttributeMutation(mutation, result) {
    const element = mutation.target;
    const attributeName = mutation.attributeName;
    const newValue = element.getAttribute(attributeName);
    const oldValue = mutation.oldValue;

    let isSuspicious = false;

    // Check for dangerous attributes
    if (this.dangerousAttributes.includes(attributeName)) {
      if (newValue && this.containsMaliciousCode(newValue)) {
        result.reasons.push(`dangerous_attribute_modified: ${attributeName}`);
        result.severity = 'high';
        isSuspicious = true;
      }
    }

    // Check for href/src modifications
    if (['href', 'src', 'action', 'formaction'].includes(attributeName)) {
      if (newValue && !this.isSafeUrl(newValue)) {
        result.reasons.push(`unsafe_url_in_attribute: ${attributeName}`);
        result.severity = 'critical';
        isSuspicious = true;
      }
    }

    // Check for style injection
    if (attributeName === 'style') {
      if (newValue && this.containsStyleInjection(newValue)) {
        result.reasons.push('style_injection_detected');
        result.severity = 'medium';
        isSuspicious = true;
      }
    }

    return isSuspicious;
  }

  /**
   * Analyze character data mutations
   * @param {MutationRecord} mutation - Character data mutation
   * @param {Object} result - Analysis result
   * @returns {boolean} Is suspicious
   */
  analyzeCharacterDataMutation(mutation, result) {
    const newValue = mutation.target.textContent;
    const oldValue = mutation.oldValue;

    if (newValue && this.containsMaliciousCode(newValue)) {
      result.reasons.push('malicious_content_injected');
      result.severity = 'high';
      return true;
    }

    return false;
  }

  /**
   * Handle suspicious mutations
   * @param {Array} suspiciousMutations - Suspicious mutations
   */
  handleSuspiciousMutations(suspiciousMutations) {
    for (const { mutation, analysis } of suspiciousMutations) {
      logger.threatDetected('dom_manipulation', {
        type: mutation.type,
        severity: analysis.severity,
        reasons: analysis.reasons,
        element: mutation.target.tagName,
        action: analysis.action
      });

      switch (analysis.action) {
      case 'block':
        this.blockMutation(mutation);
        break;

      case 'quarantine':
        this.quarantineElement(mutation.target);
        break;

      case 'monitor':
        // Just log for monitoring
        break;
      }
    }
  }

  /**
   * Block a dangerous mutation
   * @param {MutationRecord} mutation - Mutation to block
   */
  blockMutation(mutation) {
    try {
      // Revert the mutation
      switch (mutation.type) {
      case 'childList':
        mutation.addedNodes.forEach(node => {
          if (node.parentNode) {
            node.parentNode.removeChild(node);
          }
        });
        break;

      case 'attributes':
        if (mutation.oldValue !== null) {
          mutation.target.setAttribute(mutation.attributeName, mutation.oldValue);
        } else {
          mutation.target.removeAttribute(mutation.attributeName);
        }
        break;

      case 'characterData':
        mutation.target.textContent = mutation.oldValue || '';
        break;
      }

      logger.securityEvent('mutation_blocked', {
        type: mutation.type,
        element: mutation.target.tagName
      });
    } catch (error) {
      logger.error('Failed to block mutation', { error: error.message });
    }
  }

  /**
   * Quarantine a suspicious element
   * @param {Element} element - Element to quarantine
   */
  quarantineElement(element) {
    try {
      // Create quarantine container
      const quarantineDiv = document.createElement('div');
      quarantineDiv.className = 'shield-quarantine';
      quarantineDiv.style.cssText = `
        display: none !important;
        visibility: hidden !important;
        position: absolute !important;
        left: -9999px !important;
      `;

      // Move element to quarantine
      const parent = element.parentNode;
      if (parent) {
        parent.insertBefore(quarantineDiv, element);
        quarantineDiv.appendChild(element);
      }

      // Mark as quarantined
      this.protectedElements.set(element, {
        quarantined: true,
        originalParent: parent,
        timestamp: Date.now()
      });

      logger.securityEvent('element_quarantined', {
        element: element.tagName,
        id: element.id,
        class: element.className
      });
    } catch (error) {
      logger.error('Failed to quarantine element', { error: error.message });
    }
  }

  /**
   * Handle script execution attempts
   * @param {Event} event - Script execution event
   */
  handleScriptExecution(event) {
    const script = event.target;

    if (this.containsMaliciousCode(script.textContent || script.innerHTML)) {
      event.preventDefault();
      logger.threatDetected('script_execution_blocked', {
        script: script.src || 'inline',
        content: script.textContent?.substring(0, 100)
      });
    }
  }

  /**
   * Handle form submissions
   * @param {Event} event - Form submission event
   */
  handleFormSubmission(event) {
    const form = event.target;
    const inputs = form.querySelectorAll('input, textarea, select');

    for (const input of inputs) {
      if (this.containsInjectionAttempt(input.value)) {
        event.preventDefault();
        logger.threatDetected('form_injection_blocked', {
          input: input.name || input.id,
          type: input.type
        });
        return;
      }
    }
  }

  /**
   * Handle input changes
   * @param {Event} event - Input change event
   */
  handleInputChange(event) {
    const input = event.target;

    if (['text', 'password', 'email', 'search', 'url'].includes(input.type)) {
      if (this.containsInjectionAttempt(input.value)) {
        // Clear the malicious input
        input.value = input.value.replace(/[<>'"&]/g, '');
        logger.threatDetected('input_sanitized', {
          input: input.name || input.id,
          type: input.type
        });
      }
    }
  }

  /**
   * Handle link clicks
   * @param {Event} event - Click event
   */
  handleLinkClick(event) {
    const link = event.target.closest('a');

    if (link && link.href) {
      if (!this.isSafeUrl(link.href)) {
        event.preventDefault();
        logger.threatDetected('unsafe_link_blocked', {
          href: link.href,
          text: link.textContent?.substring(0, 50)
        });
      }
    }
  }

  /**
   * Check if element is dangerous
   * @param {Element} element - Element to check
   * @returns {boolean} Is dangerous
   */
  isDangerousElement(element) {
    const dangerousTags = ['SCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'APPLET', 'META'];
    return dangerousTags.includes(element.tagName);
  }

  /**
   * Check if content contains malicious code
   * @param {string} content - Content to check
   * @returns {boolean} Contains malicious code
   */
  containsMaliciousCode(content) {
    if (!content) return false;

    const analysis = threatPatterns.analyzeContent(content);
    return analysis.riskLevel !== 'none';
  }

  /**
   * Check if content contains injection attempts
   * @param {string} content - Content to check
   * @returns {boolean} Contains injection
   */
  containsInjectionAttempt(content) {
    if (!content) return false;

    const injectionThreats = threatPatterns.detectCategoryThreats(content, 'injection');
    return injectionThreats.length > 0;
  }

  /**
   * Check if content contains style injection
   * @param {string} content - Content to check
   * @returns {boolean} Contains style injection
   */
  containsStyleInjection(content) {
    if (!content) return false;

    // Check for expression() or javascript: in styles
    return /expression\s*\(|javascript:/i.test(content);
  }

  /**
   * Check if URL is safe
   * @param {string} url - URL to check
   * @returns {boolean} Is safe
   */
  isSafeUrl(url) {
    try {
      const urlObj = new URL(url, window.location.origin);

      // Check scheme
      if (!this.allowedSchemes.includes(urlObj.protocol)) {
        return false;
      }

      // Check for suspicious patterns
      const suspiciousPatterns = [
        /javascript:/i,
        /data:text/i,
        /vbscript:/i
      ];

      return !suspiciousPatterns.some(pattern => pattern.test(url));
    } catch {
      return false;
    }
  }

  /**
   * Get event handlers from element
   * @param {Element} element - Element to check
   * @returns {Array} Event handlers
   */
  getEventHandlers(element) {
    const handlers = [];

    for (const attr of element.attributes) {
      if (attr.name.startsWith('on')) {
        handlers.push(attr.name);
      }
    }

    return handlers;
  }

  /**
   * Get dangerous attributes from element
   * @param {Element} element - Element to check
   * @returns {Array} Dangerous attributes
   */
  getDangerousAttributes(element) {
    const dangerous = [];

    for (const attr of element.attributes) {
      if (this.dangerousAttributes.includes(attr.name)) {
        dangerous.push(attr.name);
      }
    }

    return dangerous;
  }

  /**
   * Sanitize HTML content
   * @param {string} html - HTML to sanitize
   * @returns {string} Sanitized HTML
   */
  sanitizeHTML(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Remove dangerous elements
    const dangerousElements = tempDiv.querySelectorAll('script, iframe, object, embed, applet, meta');
    dangerousElements.forEach(el => el.remove());

    // Remove dangerous attributes
    const allElements = tempDiv.querySelectorAll('*');
    allElements.forEach(el => {
      for (const attr of el.attributes) {
        if (this.dangerousAttributes.includes(attr.name)) {
          el.removeAttribute(attr.name);
        }
      }
    });

    return tempDiv.innerHTML;
  }

  /**
   * Create DOM snapshot for rollback
   */
  createSnapshot() {
    const snapshot = {
      timestamp: Date.now(),
      html: document.documentElement.outerHTML,
      url: window.location.href
    };

    this.domSnapshots.push(snapshot);

    if (this.domSnapshots.length > this.maxSnapshots) {
      this.domSnapshots.shift();
    }
  }

  /**
   * Create initial snapshot
   */
  createInitialSnapshot() {
    this.createSnapshot();
  }

  /**
   * Rollback to previous snapshot
   * @param {number} index - Snapshot index (default: last)
   * @returns {boolean} Success status
   */
  rollbackToSnapshot(index = -1) {
    const snapshot = this.domSnapshots[index];

    if (!snapshot) {
      logger.error('No snapshot available for rollback');
      return false;
    }

    try {
      document.documentElement.innerHTML = snapshot.html;
      logger.securityEvent('dom_rollback_performed', {
        timestamp: snapshot.timestamp,
        url: snapshot.url
      });
      return true;
    } catch (error) {
      logger.error('DOM rollback failed', { error: error.message });
      return false;
    }
  }

  /**
   * Get protection statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      active: this.isActive,
      quarantinedElements: Array.from(this.protectedElements.values()).filter(p => p.quarantined).length,
      snapshots: this.domSnapshots.length,
      observerActive: !!this.observer
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    this.protectedElements = new WeakMap();
    this.domSnapshots = [];
    this.isActive = false;
  }
}

export default DOMProtectionLayer;