/**
 * Auto-Recovery Engine for SHIELD.js
 * Provides automatic recovery from attacks with DOM snapshots and rollback
 * Implements quarantine zones and safe state restoration
 */

import logger from '../utils/logger.js';
import storage from '../utils/storage.js';

class RecoveryEngine {
  constructor(domProtector) {
    this.domProtector = domProtector;
    this.snapshots = new Map();
    this.quarantineZones = new Map();
    this.recoveryHistory = [];
    this.maxSnapshots = 10;
    this.maxHistory = 50;
    this.autoRecoveryEnabled = true;
    this.recoveryTimeout = 30000; // 30 seconds
    this.snapshotInterval = 5000; // 5 seconds
    this.snapshotTimer = null;
  }

  /**
   * Initialize recovery engine
   */
  initialize() {
    this.startPeriodicSnapshots();
    this.setupMutationRecovery();
    logger.info('Recovery Engine initialized');
  }

  /**
   * Start periodic DOM snapshots
   */
  startPeriodicSnapshots() {
    this.snapshotTimer = setInterval(() => {
      this.createSnapshot('periodic');
    }, this.snapshotInterval);
  }

  /**
   * Create a DOM snapshot
   * @param {string} reason - Reason for snapshot
   * @returns {string} Snapshot ID
   */
  createSnapshot(reason = 'manual') {
    try {
      const snapshotId = `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const snapshot = {
        id: snapshotId,
        timestamp: Date.now(),
        reason,
        dom: this.serializeDOM(),
        forms: this.serializeForms(),
        scripts: this.serializeScripts(),
        styles: this.serializeStyles(),
        url: window.location.href,
        userAgent: navigator.userAgent
      };

      this.snapshots.set(snapshotId, snapshot);

      // Maintain max snapshots limit
      if (this.snapshots.size > this.maxSnapshots) {
        const oldestKey = this.snapshots.keys().next().value;
        this.snapshots.delete(oldestKey);
      }

      logger.debug('DOM snapshot created', { snapshotId, reason });
      return snapshotId;

    } catch (error) {
      logger.error('Failed to create snapshot', { error: error.message });
      return null;
    }
  }

  /**
   * Serialize current DOM state
   * @returns {string} Serialized DOM
   */
  serializeDOM() {
    // Create a deep clone of the document
    const clone = document.cloneNode(true);

    // Remove SHIELD elements to avoid conflicts
    const shieldElements = clone.querySelectorAll('[data-shield]');
    shieldElements.forEach(el => el.remove());

    // Remove scripts and styles that might cause issues
    const scripts = clone.querySelectorAll('script');
    scripts.forEach(script => script.remove());

    const styles = clone.querySelectorAll('style');
    styles.forEach(style => style.remove());

    return clone.documentElement.outerHTML;
  }

  /**
   * Serialize form data
   * @returns {Object} Form data
   */
  serializeForms() {
    const forms = {};
    const formElements = document.querySelectorAll('form');

    formElements.forEach((form, index) => {
      const formId = form.id || form.name || `form_${index}`;
      const formData = new FormData(form);

      forms[formId] = {};
      for (const [key, value] of formData.entries()) {
        forms[formId][key] = value;
      }
    });

    return forms;
  }

  /**
   * Serialize script states
   * @returns {Array} Script information
   */
  serializeScripts() {
    const scripts = [];
    const scriptElements = document.querySelectorAll('script');

    scriptElements.forEach(script => {
      scripts.push({
        src: script.src,
        type: script.type,
        async: script.async,
        defer: script.defer,
        integrity: script.integrity
      });
    });

    return scripts;
  }

  /**
   * Serialize style states
   * @returns {Array} Style information
   */
  serializeStyles() {
    const styles = [];
    const styleElements = document.querySelectorAll('style, link[rel="stylesheet"]');

    styleElements.forEach(style => {
      if (style.tagName === 'STYLE') {
        styles.push({
          type: 'inline',
          content: style.textContent
        });
      } else {
        styles.push({
          type: 'link',
          href: style.href,
          media: style.media,
          integrity: style.integrity
        });
      }
    });

    return styles;
  }

  /**
   * Restore from snapshot
   * @param {string} snapshotId - Snapshot ID to restore
   * @param {string} reason - Reason for recovery
   * @returns {boolean} Success status
   */
  async restoreFromSnapshot(snapshotId, reason = 'manual') {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) {
      logger.error('Snapshot not found', { snapshotId });
      return false;
    }

    try {
      logger.info('Starting recovery from snapshot', { snapshotId, reason });

      // Create recovery record
      const recoveryRecord = {
        timestamp: Date.now(),
        snapshotId,
        reason,
        originalUrl: window.location.href,
        success: false
      };

      // Perform recovery
      await this.performRecovery(snapshot);

      recoveryRecord.success = true;
      this.recoveryHistory.push(recoveryRecord);

      // Maintain history limit
      if (this.recoveryHistory.length > this.maxHistory) {
        this.recoveryHistory.shift();
      }

      // Store recovery history
      await storage.storeRecoveryHistory(this.recoveryHistory);

      logger.info('Recovery completed successfully', { snapshotId });
      return true;

    } catch (error) {
      logger.error('Recovery failed', { snapshotId, error: error.message });

      // Log failed recovery
      const failedRecord = {
        timestamp: Date.now(),
        snapshotId,
        reason,
        error: error.message,
        success: false
      };
      this.recoveryHistory.push(failedRecord);

      return false;
    }
  }

  /**
   * Perform the actual recovery
   * @param {Object} snapshot - Snapshot data
   */
  async performRecovery(snapshot) {
    // Disable DOM protection temporarily
    this.domProtector.pause();

    try {
      // Clear current DOM
      document.documentElement.innerHTML = '';

      // Restore DOM structure
      document.documentElement.innerHTML = snapshot.dom;

      // Restore form data
      this.restoreForms(snapshot.forms);

      // Restore scripts
      await this.restoreScripts(snapshot.scripts);

      // Restore styles
      await this.restoreStyles(snapshot.styles);

      // Reinitialize SHIELD components
      this.reinitializeShield();

      logger.info('DOM recovery completed');

    } finally {
      // Re-enable DOM protection
      this.domProtector.resume();
    }
  }

  /**
   * Restore form data
   * @param {Object} forms - Form data to restore
   */
  restoreForms(forms) {
    Object.keys(forms).forEach(formId => {
      const form = document.getElementById(formId) ||
                   document.querySelector(`form[name="${formId}"]`) ||
                   document.querySelector(`form[data-form-id="${formId}"]`);

      if (form) {
        const formData = forms[formId];
        Object.keys(formData).forEach(key => {
          const input = form.querySelector(`[name="${key}"]`);
          if (input) {
            input.value = formData[key];
          }
        });
      }
    });
  }

  /**
   * Restore scripts
   * @param {Array} scripts - Script data to restore
   */
  async restoreScripts(scripts) {
    const scriptPromises = scripts.map(scriptData => {
      return new Promise((resolve, reject) => {
        if (scriptData.src) {
          // External script
          const script = document.createElement('script');
          script.src = scriptData.src;
          script.type = scriptData.type || 'text/javascript';
          script.async = scriptData.async || false;
          script.defer = scriptData.defer || false;
          if (scriptData.integrity) {
            script.integrity = scriptData.integrity;
          }

          script.onload = resolve;
          script.onerror = reject;

          document.head.appendChild(script);
        } else {
          // Inline script - skip for security
          resolve();
        }
      });
    });

    await Promise.allSettled(scriptPromises);
  }

  /**
   * Restore styles
   * @param {Array} styles - Style data to restore
   */
  async restoreStyles(styles) {
    const stylePromises = styles.map(styleData => {
      return new Promise((resolve) => {
        if (styleData.type === 'link') {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = styleData.href;
          if (styleData.media) {
            link.media = styleData.media;
          }
          if (styleData.integrity) {
            link.integrity = styleData.integrity;
          }

          link.onload = resolve;
          link.onerror = resolve; // Don't fail on style load errors

          document.head.appendChild(link);
        } else {
          // Inline style
          const style = document.createElement('style');
          style.textContent = styleData.content;
          document.head.appendChild(style);
          resolve();
        }
      });
    });

    await Promise.allSettled(stylePromises);
  }

  /**
   * Reinitialize SHIELD components after recovery
   */
  reinitializeShield() {
    // Dispatch custom event for other components to reinitialize
    const recoveryEvent = new CustomEvent('shield:recovery', {
      detail: { timestamp: Date.now() }
    });
    document.dispatchEvent(recoveryEvent);
  }

  /**
   * Setup automatic recovery on mutations
   */
  setupMutationRecovery() {
    // Listen for DOM protection alerts
    document.addEventListener('shield:threat-detected', (event) => {
      const { threatType, severity } = event.detail;

      if (severity >= 8 && this.autoRecoveryEnabled) {
        this.triggerAutoRecovery(threatType);
      }
    });
  }

  /**
   * Trigger automatic recovery
   * @param {string} threatType - Type of threat detected
   */
  async triggerAutoRecovery(threatType) {
    logger.warn('Auto-recovery triggered', { threatType });

    // Get the most recent snapshot
    const snapshots = Array.from(this.snapshots.values())
      .sort((a, b) => b.timestamp - a.timestamp);

    if (snapshots.length === 0) {
      logger.error('No snapshots available for auto-recovery');
      return;
    }

    const latestSnapshot = snapshots[0];

    // Attempt recovery with timeout
    const recoveryPromise = this.restoreFromSnapshot(latestSnapshot.id, `auto_${threatType}`);

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Recovery timeout')), this.recoveryTimeout);
    });

    try {
      await Promise.race([recoveryPromise, timeoutPromise]);
      logger.info('Auto-recovery successful', { threatType });
    } catch (error) {
      logger.error('Auto-recovery failed', { threatType, error: error.message });
      // Could implement fallback recovery strategies here
    }
  }

  /**
   * Create quarantine zone for suspicious elements
   * @param {Element} element - Element to quarantine
   * @param {string} reason - Reason for quarantine
   * @returns {string} Quarantine ID
   */
  quarantineElement(element, reason = 'suspicious') {
    const quarantineId = `quarantine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create quarantine container
    const quarantineContainer = document.createElement('div');
    quarantineContainer.setAttribute('data-shield-quarantine', quarantineId);
    quarantineContainer.style.display = 'none';
    quarantineContainer.style.position = 'absolute';
    quarantineContainer.style.left = '-9999px';

    // Move element to quarantine
    const clonedElement = element.cloneNode(true);
    quarantineContainer.appendChild(clonedElement);
    document.body.appendChild(quarantineContainer);

    // Remove original element
    element.remove();

    // Store quarantine info
    this.quarantineZones.set(quarantineId, {
      id: quarantineId,
      timestamp: Date.now(),
      reason,
      originalElement: clonedElement,
      container: quarantineContainer
    });

    logger.warn('Element quarantined', { quarantineId, reason });
    return quarantineId;
  }

  /**
   * Restore element from quarantine
   * @param {string} quarantineId - Quarantine ID
   * @param {Element} targetParent - Parent element to restore to
   * @returns {boolean} Success status
   */
  restoreFromQuarantine(quarantineId, targetParent = document.body) {
    const quarantineInfo = this.quarantineZones.get(quarantineId);
    if (!quarantineInfo) {
      logger.error('Quarantine zone not found', { quarantineId });
      return false;
    }

    try {
      // Restore element
      const restoredElement = quarantineInfo.originalElement.cloneNode(true);
      targetParent.appendChild(restoredElement);

      // Remove quarantine container
      quarantineInfo.container.remove();

      // Remove from quarantine zones
      this.quarantineZones.delete(quarantineId);

      logger.info('Element restored from quarantine', { quarantineId });
      return true;

    } catch (error) {
      logger.error('Failed to restore from quarantine', { quarantineId, error: error.message });
      return false;
    }
  }

  /**
   * Get recovery statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const successfulRecoveries = this.recoveryHistory.filter(r => r.success).length;
    const failedRecoveries = this.recoveryHistory.filter(r => !r.success).length;

    return {
      snapshots: this.snapshots.size,
      maxSnapshots: this.maxSnapshots,
      quarantineZones: this.quarantineZones.size,
      totalRecoveries: this.recoveryHistory.length,
      successfulRecoveries,
      failedRecoveries,
      autoRecoveryEnabled: this.autoRecoveryEnabled,
      snapshotInterval: this.snapshotInterval,
      recoveryTimeout: this.recoveryTimeout
    };
  }

  /**
   * Get list of available snapshots
   * @returns {Array} Snapshot list
   */
  getSnapshots() {
    return Array.from(this.snapshots.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(snapshot => ({
        id: snapshot.id,
        timestamp: snapshot.timestamp,
        reason: snapshot.reason,
        url: snapshot.url
      }));
  }

  /**
   * Get recovery history
   * @returns {Array} Recovery history
   */
  getRecoveryHistory() {
    return [...this.recoveryHistory]
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Clear old snapshots
   * @param {number} maxAge - Maximum age in milliseconds
   */
  clearOldSnapshots(maxAge = 3600000) { // 1 hour default
    const cutoff = Date.now() - maxAge;
    let cleared = 0;

    for (const [id, snapshot] of this.snapshots) {
      if (snapshot.timestamp < cutoff) {
        this.snapshots.delete(id);
        cleared++;
      }
    }

    if (cleared > 0) {
      logger.info('Old snapshots cleared', { cleared });
    }
  }

  /**
   * Configure recovery settings
   * @param {Object} config - Configuration options
   */
  configure(config) {
    if (config.maxSnapshots !== undefined) {
      this.maxSnapshots = config.maxSnapshots;
    }
    if (config.maxHistory !== undefined) {
      this.maxHistory = config.maxHistory;
    }
    if (config.autoRecoveryEnabled !== undefined) {
      this.autoRecoveryEnabled = config.autoRecoveryEnabled;
    }
    if (config.recoveryTimeout !== undefined) {
      this.recoveryTimeout = config.recoveryTimeout;
    }
    if (config.snapshotInterval !== undefined) {
      this.snapshotInterval = config.snapshotInterval;
      // Restart timer with new interval
      if (this.snapshotTimer) {
        clearInterval(this.snapshotTimer);
        this.startPeriodicSnapshots();
      }
    }

    logger.info('Recovery engine configured', config);
  }

  /**
   * Load recovery history from storage
   */
  async loadRecoveryHistory() {
    try {
      const history = await storage.getRecoveryHistory();
      if (history) {
        this.recoveryHistory = history;
        logger.debug('Recovery history loaded', { count: history.length });
      }
    } catch (error) {
      logger.error('Failed to load recovery history', { error: error.message });
    }
  }

  /**
   * Destroy recovery engine
   */
  destroy() {
    if (this.snapshotTimer) {
      clearInterval(this.snapshotTimer);
    }
    this.snapshots.clear();
    this.quarantineZones.clear();
    this.recoveryHistory = [];
  }
}

export default RecoveryEngine;