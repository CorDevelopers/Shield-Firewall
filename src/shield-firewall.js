/**
 * SHIELD.js - Revolutionary AI-Powered Client-Side Web Application Firewall
 * Zero-knowledge architecture with behavioral AI learning and predictive threat blocking
 *
 * Main ShieldFirewall class that orchestrates all protection components
 */

import logger from '../utils/logger.js';
import storage from '../utils/storage.js';
import crypto from '../utils/crypto.js';
import patterns from '../utils/patterns.js';

import BehaviorEngine from './core/behavior-engine.js';
import DOMProtector from './core/dom-protector.js';
import ThreatDetector from './core/threat-detector.js';
import NetworkInterceptor from './core/network-interceptor.js';
import RecoveryEngine from './core/recovery-engine.js';
import ConfigManager from './core/config-manager.js';

class ShieldFirewall {
  constructor(options = {}) {
    // Core components
    this.config = null;
    this.behaviorEngine = null;
    this.domProtector = null;
    this.threatDetector = null;
    this.networkInterceptor = null;
    this.recoveryEngine = null;

    // State management
    this.isInitialized = false;
    this.isActive = false;
    this.initializationPromise = null;

    // Performance monitoring
    this.performanceMetrics = {
      initializationTime: 0,
      threatsBlocked: 0,
      falsePositives: 0,
      recoveryCount: 0
    };

    // Options
    this.options = {
      autoStart: true,
      debug: false,
      ...options
    };

    // Bind methods
    this.handleThreatDetected = this.handleThreatDetected.bind(this);
    this.handleConfigChange = this.handleConfigChange.bind(this);
  }

  /**
   * Initialize SHIELD firewall
   * @param {Object} config - Initial configuration
   * @returns {Promise<boolean>} Initialization success
   */
  async initialize(config = {}) {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    const startTime = performance.now();

    this.initializationPromise = this._initialize(config);

    try {
      const success = await this.initializationPromise;
      this.performanceMetrics.initializationTime = performance.now() - startTime;

      if (success && this.options.autoStart) {
        await this.start();
      }

      return success;
    } catch (error) {
      logger.error('SHIELD initialization failed', { error: error.message });
      return false;
    }
  }

  /**
   * Internal initialization
   * @param {Object} config - Initial configuration
   * @returns {Promise<boolean>} Success status
   */
  async _initialize(config) {
    try {
      logger.info('Initializing SHIELD.js firewall...');

      // Initialize configuration manager first
      this.config = new ConfigManager();
      await this.config.initialize();

      // Apply initial config overrides
      if (Object.keys(config).length > 0) {
        await this.config.update(config);
      }

      // Initialize core components
      await this.initializeComponents();

      // Setup event listeners
      this.setupEventListeners();

      // Load performance metrics
      await this.loadMetrics();

      this.isInitialized = true;
      logger.info('SHIELD.js firewall initialized successfully', {
        version: '1.0.0',
        protectionLevel: this.config.get('protectionLevel')
      });

      return true;

    } catch (error) {
      logger.error('SHIELD initialization error', { error: error.message });
      return false;
    }
  }

  /**
   * Initialize all protection components
   */
  async initializeComponents() {
    const config = this.config.getConfig();

    // Initialize behavior engine
    if (config.features.behaviorLearning) {
      this.behaviorEngine = new BehaviorEngine();
      await this.behaviorEngine.initialize();
    }

    // Initialize threat detector
    if (config.features.threatDetection) {
      this.threatDetector = new ThreatDetector();
      await this.threatDetector.initialize();
    }

    // Initialize DOM protector
    if (config.features.domProtection) {
      this.domProtector = new DOMProtector(this.threatDetector);
      await this.domProtector.initialize();
    }

    // Initialize network interceptor
    if (config.features.networkInterception) {
      this.networkInterceptor = new NetworkInterceptor(this.threatDetector);
      this.networkInterceptor.initialize();
    }

    // Initialize recovery engine
    if (config.features.autoRecovery) {
      this.recoveryEngine = new RecoveryEngine(this.domProtector);
      await this.recoveryEngine.initialize();
      await this.recoveryEngine.loadRecoveryHistory();
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for threat detections
    document.addEventListener('shield:threat-detected', this.handleThreatDetected);

    // Listen for configuration changes
    this.config.addListener('*', this.handleConfigChange);

    // Listen for recovery events
    document.addEventListener('shield:recovery', (event) => {
      this.performanceMetrics.recoveryCount++;
      logger.info('Recovery event triggered', event.detail);
    });
  }

  /**
   * Handle threat detection events
   * @param {Event} event - Threat detection event
   */
  handleThreatDetected(event) {
    const { threatType, severity, details } = event.detail;
    this.performanceMetrics.threatsBlocked++;

    logger.threatDetected(threatType, {
      severity,
      details,
      timestamp: Date.now()
    });

    // Trigger recovery if severity is high
    if (severity >= 8 && this.recoveryEngine && this.config.get('recovery.autoRecovery')) {
      this.recoveryEngine.triggerAutoRecovery(threatType);
    }
  }

  /**
   * Handle configuration changes
   * @param {string} path - Configuration path
   * @param {*} value - New value
   */
  handleConfigChange(path, value) {
    logger.debug('Configuration changed', { path, value });

    // Handle component-specific config changes
    if (path.startsWith('features.')) {
      this.handleFeatureToggle(path, value);
    } else if (path.startsWith('threatDetection.')) {
      this.updateThreatDetection(path, value);
    } else if (path.startsWith('network.')) {
      this.updateNetworkConfig(path, value);
    } else if (path.startsWith('behavior.')) {
      this.updateBehaviorConfig(path, value);
    } else if (path.startsWith('recovery.')) {
      this.updateRecoveryConfig(path, value);
    }
  }

  /**
   * Handle feature toggles
   * @param {string} path - Feature path
   * @param {boolean} enabled - Feature enabled status
   */
  handleFeatureToggle(path, enabled) {
    const feature = path.split('.')[1];

    switch (feature) {
    case 'behaviorLearning':
      if (enabled && !this.behaviorEngine) {
        this.behaviorEngine = new BehaviorEngine();
        this.behaviorEngine.initialize();
      } else if (!enabled && this.behaviorEngine) {
        this.behaviorEngine.destroy();
        this.behaviorEngine = null;
      }
      break;

    case 'domProtection':
      if (enabled && !this.domProtector) {
        this.domProtector = new DOMProtector(this.threatDetector);
        this.domProtector.initialize();
      } else if (!enabled && this.domProtector) {
        this.domProtector.destroy();
        this.domProtector = null;
      }
      break;

    case 'networkInterception':
      if (enabled && !this.networkInterceptor) {
        this.networkInterceptor = new NetworkInterceptor(this.threatDetector);
        this.networkInterceptor.initialize();
      } else if (!enabled && this.networkInterceptor) {
        this.networkInterceptor.destroy();
        this.networkInterceptor = null;
      }
      break;

    case 'autoRecovery':
      if (enabled && !this.recoveryEngine) {
        this.recoveryEngine = new RecoveryEngine(this.domProtector);
        this.recoveryEngine.initialize();
      } else if (!enabled && this.recoveryEngine) {
        this.recoveryEngine.destroy();
        this.recoveryEngine = null;
      }
      break;
    }
  }

  /**
   * Update threat detection configuration
   * @param {string} path - Config path
   * @param {*} value - New value
   */
  updateThreatDetection(path, value) {
    if (this.threatDetector) {
      const configKey = path.split('.')[1];
      this.threatDetector.configure({ [configKey]: value });
    }
  }

  /**
   * Update network configuration
   * @param {string} path - Config path
   * @param {*} value - New value
   */
  updateNetworkConfig(path, value) {
    if (this.networkInterceptor) {
      const configKey = path.split('.')[1];

      if (configKey === 'rateLimitMax' || configKey === 'rateLimitWindow') {
        const max = this.config.get('network.rateLimitMax');
        const window = this.config.get('network.rateLimitWindow');
        this.networkInterceptor.setRateLimit(max, window);
      }
    }
  }

  /**
   * Update behavior configuration
   * @param {string} path - Config path
   * @param {*} value - New value
   */
  updateBehaviorConfig(path, value) {
    if (this.behaviorEngine) {
      const configKey = path.split('.')[1];
      this.behaviorEngine.configure({ [configKey]: value });
    }
  }

  /**
   * Update recovery configuration
   * @param {string} path - Config path
   * @param {*} value - New value
   */
  updateRecoveryConfig(path, value) {
    if (this.recoveryEngine) {
      const configKey = path.split('.')[1];
      this.recoveryEngine.configure({ [configKey]: value });
    }
  }

  /**
   * Start SHIELD protection
   * @returns {Promise<boolean>} Start success
   */
  async start() {
    if (!this.isInitialized) {
      logger.error('SHIELD must be initialized before starting');
      return false;
    }

    if (this.isActive) {
      logger.warn('SHIELD is already active');
      return true;
    }

    try {
      logger.info('Starting SHIELD protection...');

      // Start all components
      const promises = [];

      if (this.behaviorEngine) {
        promises.push(this.behaviorEngine.start());
      }

      if (this.domProtector) {
        promises.push(this.domProtector.start());
      }

      if (this.networkInterceptor) {
        // Network interceptor is already active when initialized
      }

      if (this.recoveryEngine) {
        // Recovery engine is already active when initialized
      }

      await Promise.allSettled(promises);

      this.isActive = true;
      logger.info('SHIELD protection started successfully');

      // Dispatch start event
      document.dispatchEvent(new CustomEvent('shield:started', {
        detail: { timestamp: Date.now() }
      }));

      return true;

    } catch (error) {
      logger.error('Failed to start SHIELD protection', { error: error.message });
      return false;
    }
  }

  /**
   * Stop SHIELD protection
   * @returns {Promise<boolean>} Stop success
   */
  async stop() {
    if (!this.isActive) {
      logger.warn('SHIELD is not active');
      return true;
    }

    try {
      logger.info('Stopping SHIELD protection...');

      // Stop all components
      const promises = [];

      if (this.behaviorEngine) {
        promises.push(this.behaviorEngine.stop());
      }

      if (this.domProtector) {
        promises.push(this.domProtector.stop());
      }

      await Promise.allSettled(promises);

      this.isActive = false;
      logger.info('SHIELD protection stopped');

      // Dispatch stop event
      document.dispatchEvent(new CustomEvent('shield:stopped', {
        detail: { timestamp: Date.now() }
      }));

      return true;

    } catch (error) {
      logger.error('Failed to stop SHIELD protection', { error: error.message });
      return false;
    }
  }

  /**
   * Get SHIELD status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      active: this.isActive,
      version: '1.0.0',
      protectionLevel: this.config ? this.config.get('protectionLevel') : null,
      components: {
        behaviorEngine: !!this.behaviorEngine,
        domProtector: !!this.domProtector,
        threatDetector: !!this.threatDetector,
        networkInterceptor: !!this.networkInterceptor,
        recoveryEngine: !!this.recoveryEngine,
        configManager: !!this.config
      },
      performance: this.performanceMetrics
    };
  }

  /**
   * Get comprehensive statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const stats = {
      shield: this.getStatus(),
      components: {}
    };

    // Collect component stats
    if (this.behaviorEngine) {
      stats.components.behaviorEngine = this.behaviorEngine.getStats();
    }

    if (this.domProtector) {
      stats.components.domProtector = this.domProtector.getStats();
    }

    if (this.threatDetector) {
      stats.components.threatDetector = this.threatDetector.getStats();
    }

    if (this.networkInterceptor) {
      stats.components.networkInterceptor = this.networkInterceptor.getStats();
    }

    if (this.recoveryEngine) {
      stats.components.recoveryEngine = this.recoveryEngine.getStats();
    }

    if (this.config) {
      stats.components.configManager = this.config.getStats();
    }

    return stats;
  }

  /**
   * Manually trigger threat scan
   * @returns {Promise<Object>} Scan results
   */
  async scan() {
    if (!this.isActive) {
      throw new Error('SHIELD is not active');
    }

    logger.info('Manual threat scan initiated');

    const results = {
      timestamp: Date.now(),
      components: {}
    };

    // Scan with each component
    const promises = [];

    if (this.domProtector) {
      promises.push(
        this.domProtector.scan().then(result => {
          results.components.dom = result;
        })
      );
    }

    if (this.threatDetector) {
      promises.push(
        this.threatDetector.scan().then(result => {
          results.components.threats = result;
        })
      );
    }

    if (this.behaviorEngine) {
      promises.push(
        this.behaviorEngine.analyzeCurrentBehavior().then(result => {
          results.components.behavior = result;
        })
      );
    }

    await Promise.allSettled(promises);

    logger.info('Manual threat scan completed', results);
    return results;
  }

  /**
   * Create recovery snapshot
   * @param {string} reason - Reason for snapshot
   * @returns {string|null} Snapshot ID
   */
  createSnapshot(reason = 'manual') {
    if (this.recoveryEngine) {
      return this.recoveryEngine.createSnapshot(reason);
    }
    return null;
  }

  /**
   * Restore from snapshot
   * @param {string} snapshotId - Snapshot ID
   * @param {string} reason - Reason for recovery
   * @returns {Promise<boolean>} Success status
   */
  async restoreFromSnapshot(snapshotId, reason = 'manual') {
    if (this.recoveryEngine) {
      return await this.recoveryEngine.restoreFromSnapshot(snapshotId, reason);
    }
    return false;
  }

  /**
   * Get available snapshots
   * @returns {Array} Snapshot list
   */
  getSnapshots() {
    if (this.recoveryEngine) {
      return this.recoveryEngine.getSnapshots();
    }
    return [];
  }

  /**
   * Configure SHIELD
   * @param {Object} config - Configuration updates
   * @returns {Promise<boolean>} Success status
   */
  async configure(config) {
    if (!this.config) {
      return false;
    }
    return await this.config.update(config);
  }

  /**
   * Get configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    if (!this.config) {
      return null;
    }
    return this.config.getConfig();
  }

  /**
   * Set protection level
   * @param {string} level - Protection level
   * @returns {Promise<boolean>} Success status
   */
  async setProtectionLevel(level) {
    if (!this.config) {
      return false;
    }
    return await this.config.setProtectionLevel(level);
  }

  /**
   * Export configuration
   * @returns {string} JSON configuration
   */
  exportConfig() {
    if (!this.config) {
      return null;
    }
    return this.config.export();
  }

  /**
   * Import configuration
   * @param {string} configJson - JSON configuration
   * @returns {Promise<boolean>} Success status
   */
  async importConfig(configJson) {
    if (!this.config) {
      return false;
    }
    return await this.config.import(configJson);
  }

  /**
   * Clear all data and reset
   * @returns {Promise<boolean>} Success status
   */
  async reset() {
    try {
      logger.info('Resetting SHIELD...');

      // Stop protection
      await this.stop();

      // Clear storage
      await storage.clearAll();

      // Reset configuration
      if (this.config) {
        await this.config.reset();
      }

      // Destroy components
      this.destroyComponents();

      // Reset state
      this.isInitialized = false;
      this.isActive = false;
      this.initializationPromise = null;
      this.performanceMetrics = {
        initializationTime: 0,
        threatsBlocked: 0,
        falsePositives: 0,
        recoveryCount: 0
      };

      logger.info('SHIELD reset completed');
      return true;

    } catch (error) {
      logger.error('SHIELD reset failed', { error: error.message });
      return false;
    }
  }

  /**
   * Destroy components
   */
  destroyComponents() {
    if (this.behaviorEngine) {
      this.behaviorEngine.destroy();
      this.behaviorEngine = null;
    }

    if (this.domProtector) {
      this.domProtector.destroy();
      this.domProtector = null;
    }

    if (this.threatDetector) {
      this.threatDetector.destroy();
      this.threatDetector = null;
    }

    if (this.networkInterceptor) {
      this.networkInterceptor.destroy();
      this.networkInterceptor = null;
    }

    if (this.recoveryEngine) {
      this.recoveryEngine.destroy();
      this.recoveryEngine = null;
    }

    if (this.config) {
      this.config.destroy();
      this.config = null;
    }
  }

  /**
   * Load performance metrics
   */
  async loadMetrics() {
    try {
      const metrics = await storage.getPerformanceMetrics();
      if (metrics) {
        this.performanceMetrics = { ...this.performanceMetrics, ...metrics };
      }
    } catch (error) {
      logger.debug('Could not load performance metrics', { error: error.message });
    }
  }

  /**
   * Save performance metrics
   */
  async saveMetrics() {
    try {
      await storage.savePerformanceMetrics(this.performanceMetrics);
    } catch (error) {
      logger.debug('Could not save performance metrics', { error: error.message });
    }
  }

  /**
   * Destroy SHIELD instance
   */
  async destroy() {
    try {
      // Save final metrics
      await this.saveMetrics();

      // Stop protection
      await this.stop();

      // Remove event listeners
      document.removeEventListener('shield:threat-detected', this.handleThreatDetected);

      // Destroy components
      this.destroyComponents();

      logger.info('SHIELD destroyed');

    } catch (error) {
      logger.error('Error during SHIELD destruction', { error: error.message });
    }
  }
}

// Export singleton instance
const shield = new ShieldFirewall();

// Export class for custom instances
export { ShieldFirewall };

// Export default singleton
export default shield;