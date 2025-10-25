/**
 * Configuration Manager for SHIELD.js
 * Manages protection levels, rules, and user preferences
 * Provides centralized configuration with validation and persistence
 */

import logger from '../utils/logger.js';
import storage from '../utils/storage.js';

class ConfigManager {
  constructor() {
    this.config = this.getDefaultConfig();
    this.listeners = new Map();
    this.validationRules = this.getValidationRules();
    this.isInitialized = false;
  }

  /**
   * Get default configuration
   * @returns {Object} Default config
   */
  getDefaultConfig() {
    return {
      // Protection levels
      protectionLevel: 'balanced', // 'minimal', 'balanced', 'strict', 'paranoid'

      // Core features
      features: {
        domProtection: true,
        networkInterception: true,
        behaviorLearning: true,
        threatDetection: true,
        autoRecovery: true,
        logging: true
      },

      // Threat detection settings
      threatDetection: {
        enabled: true,
        sensitivity: 0.7, // 0-1 scale
        blockThreshold: 0.8,
        learningRate: 0.1,
        falsePositiveThreshold: 0.3
      },

      // Network settings
      network: {
        enabled: true,
        rateLimitMax: 100,
        rateLimitWindow: 60000, // 1 minute
        cacheEnabled: true,
        cacheMaxAge: 300000, // 5 minutes
        blockedDomains: [],
        allowedDomains: []
      },

      // DOM protection settings
      dom: {
        enabled: true,
        mutationMonitoring: true,
        xssPrevention: true,
        injectionPrevention: true,
        quarantineEnabled: true,
        sanitizeContent: true
      },

      // Behavior learning settings
      behavior: {
        enabled: true,
        profileSize: 1000,
        anomalyThreshold: 0.75,
        learningEnabled: true,
        botDetection: true
      },

      // Recovery settings
      recovery: {
        enabled: true,
        autoRecovery: true,
        maxSnapshots: 10,
        snapshotInterval: 5000,
        recoveryTimeout: 30000,
        quarantineEnabled: true
      },

      // Logging settings
      logging: {
        enabled: true,
        level: 'info', // 'debug', 'info', 'warn', 'error'
        persistLogs: true,
        maxLogAge: 604800000, // 7 days
        maxLogs: 10000
      },

      // UI settings
      ui: {
        enabled: true,
        dashboard: true,
        notifications: true,
        theme: 'auto', // 'light', 'dark', 'auto'
        position: 'bottom-right', // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
        opacity: 0.9
      },

      // Privacy settings
      privacy: {
        dataRetention: 2592000000, // 30 days
        anonymizeLogs: true,
        shareStats: false,
        telemetry: false
      },

      // Advanced settings
      advanced: {
        webWorkers: true,
        indexedDB: true,
        cryptoAPI: true,
        mutationObserver: true,
        performanceMonitoring: true
      }
    };
  }

  /**
   * Get validation rules
   * @returns {Object} Validation rules
   */
  getValidationRules() {
    return {
      protectionLevel: {
        type: 'string',
        enum: ['minimal', 'balanced', 'strict', 'paranoid']
      },
      'threatDetection.sensitivity': {
        type: 'number',
        min: 0,
        max: 1
      },
      'threatDetection.blockThreshold': {
        type: 'number',
        min: 0,
        max: 1
      },
      'network.rateLimitMax': {
        type: 'number',
        min: 1,
        max: 10000
      },
      'network.rateLimitWindow': {
        type: 'number',
        min: 1000,
        max: 3600000 // 1 hour
      },
      'behavior.profileSize': {
        type: 'number',
        min: 100,
        max: 10000
      },
      'recovery.maxSnapshots': {
        type: 'number',
        min: 1,
        max: 50
      },
      'logging.level': {
        type: 'string',
        enum: ['debug', 'info', 'warn', 'error']
      },
      'ui.opacity': {
        type: 'number',
        min: 0.1,
        max: 1
      }
    };
  }

  /**
   * Initialize configuration manager
   */
  async initialize() {
    try {
      // Load saved configuration
      const savedConfig = await storage.getConfiguration();
      if (savedConfig) {
        this.config = this.mergeConfigs(this.config, savedConfig);
        logger.debug('Configuration loaded from storage');
      }

      // Validate configuration
      const validationResult = this.validateConfig(this.config);
      if (!validationResult.valid) {
        logger.warn('Invalid configuration loaded, using defaults for invalid fields', {
          errors: validationResult.errors
        });
        // Reset invalid fields to defaults
        this.config = this.mergeConfigs(this.config, this.getDefaultConfig());
      }

      this.isInitialized = true;
      logger.info('Configuration manager initialized');

    } catch (error) {
      logger.error('Failed to initialize configuration', { error: error.message });
      // Use defaults if loading fails
      this.isInitialized = true;
    }
  }

  /**
   * Merge two configurations
   * @param {Object} base - Base configuration
   * @param {Object} override - Override configuration
   * @returns {Object} Merged configuration
   */
  mergeConfigs(base, override) {
    const result = { ...base };

    Object.keys(override).forEach(key => {
      if (typeof override[key] === 'object' && override[key] !== null &&
          typeof base[key] === 'object' && base[key] !== null) {
        result[key] = this.mergeConfigs(base[key], override[key]);
      } else {
        result[key] = override[key];
      }
    });

    return result;
  }

  /**
   * Validate configuration
   * @param {Object} config - Configuration to validate
   * @returns {Object} Validation result
   */
  validateConfig(config) {
    const errors = [];
    const result = { valid: true, errors };

    // Flatten config for validation
    const flatConfig = this.flattenConfig(config);

    Object.keys(this.validationRules).forEach(path => {
      const rule = this.validationRules[path];
      const value = this.getNestedValue(flatConfig, path);

      if (value !== undefined) {
        const error = this.validateValue(value, rule);
        if (error) {
          errors.push({ path, error });
          result.valid = false;
        }
      }
    });

    return result;
  }

  /**
   * Flatten nested configuration
   * @param {Object} obj - Object to flatten
   * @param {string} prefix - Path prefix
   * @returns {Object} Flattened object
   */
  flattenConfig(obj, prefix = '') {
    const result = {};

    Object.keys(obj).forEach(key => {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(result, this.flattenConfig(obj[key], newKey));
      } else {
        result[newKey] = obj[key];
      }
    });

    return result;
  }

  /**
   * Get nested value from flattened config
   * @param {Object} flatConfig - Flattened configuration
   * @param {string} path - Dot-separated path
   * @returns {*} Value at path
   */
  getNestedValue(flatConfig, path) {
    return flatConfig[path];
  }

  /**
   * Validate a single value
   * @param {*} value - Value to validate
   * @param {Object} rule - Validation rule
   * @returns {string|null} Error message or null
   */
  validateValue(value, rule) {
    switch (rule.type) {
    case 'string':
      if (typeof value !== 'string') {
        return 'Must be a string';
      }
      if (rule.enum && !rule.enum.includes(value)) {
        return `Must be one of: ${rule.enum.join(', ')}`;
      }
      break;

    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        return 'Must be a number';
      }
      if (rule.min !== undefined && value < rule.min) {
        return `Must be at least ${rule.min}`;
      }
      if (rule.max !== undefined && value > rule.max) {
        return `Must be at most ${rule.max}`;
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        return 'Must be a boolean';
      }
      break;

    default:
      return 'Unknown validation type';
    }

    return null;
  }

  /**
   * Get current configuration
   * @returns {Object} Current config
   */
  getConfig() {
    return JSON.parse(JSON.stringify(this.config)); // Deep clone
  }

  /**
   * Get configuration value
   * @param {string} path - Dot-separated path
   * @param {*} defaultValue - Default value if not found
   * @returns {*} Configuration value
   */
  get(path, defaultValue = undefined) {
    const keys = path.split('.');
    let current = this.config;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }

    return current;
  }

  /**
   * Set configuration value
   * @param {string} path - Dot-separated path
   * @param {*} value - Value to set
   * @returns {boolean} Success status
   */
  async set(path, value) {
    if (!this.isInitialized) {
      logger.warn('Configuration manager not initialized');
      return false;
    }

    try {
      // Validate the change
      const testConfig = JSON.parse(JSON.stringify(this.config));
      this.setNestedValue(testConfig, path, value);

      const validation = this.validateConfig(testConfig);
      if (!validation.valid) {
        logger.error('Invalid configuration value', {
          path,
          value,
          errors: validation.errors
        });
        return false;
      }

      // Apply the change
      this.setNestedValue(this.config, path, value);

      // Save to storage
      await storage.saveConfiguration(this.config);

      // Notify listeners
      this.notifyListeners(path, value);

      logger.debug('Configuration updated', { path, value });
      return true;

    } catch (error) {
      logger.error('Failed to set configuration', { path, value, error: error.message });
      return false;
    }
  }

  /**
   * Set nested value in object
   * @param {Object} obj - Object to modify
   * @param {string} path - Dot-separated path
   * @param {*} value - Value to set
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Update multiple configuration values
   * @param {Object} updates - Object with path-value pairs
   * @returns {boolean} Success status
   */
  async update(updates) {
    if (!this.isInitialized) {
      logger.warn('Configuration manager not initialized');
      return false;
    }

    try {
      // Create test config with all updates
      const testConfig = JSON.parse(JSON.stringify(this.config));

      Object.keys(updates).forEach(path => {
        this.setNestedValue(testConfig, path, updates[path]);
      });

      // Validate all changes
      const validation = this.validateConfig(testConfig);
      if (!validation.valid) {
        logger.error('Invalid configuration updates', {
          updates,
          errors: validation.errors
        });
        return false;
      }

      // Apply all changes
      Object.keys(updates).forEach(path => {
        this.setNestedValue(this.config, path, updates[path]);
        this.notifyListeners(path, updates[path]);
      });

      // Save to storage
      await storage.saveConfiguration(this.config);

      logger.debug('Configuration batch updated', { updates });
      return true;

    } catch (error) {
      logger.error('Failed to update configuration', { updates, error: error.message });
      return false;
    }
  }

  /**
   * Reset configuration to defaults
   * @param {string} section - Section to reset (optional)
   * @returns {boolean} Success status
   */
  async reset(section = null) {
    try {
      if (section) {
        // Reset specific section
        const defaults = this.getDefaultConfig();
        if (section in defaults) {
          this.config[section] = JSON.parse(JSON.stringify(defaults[section]));
          await storage.saveConfiguration(this.config);
          logger.info('Configuration section reset', { section });
        } else {
          logger.error('Invalid configuration section', { section });
          return false;
        }
      } else {
        // Reset entire config
        this.config = this.getDefaultConfig();
        await storage.saveConfiguration(this.config);
        logger.info('Configuration reset to defaults');
      }

      return true;

    } catch (error) {
      logger.error('Failed to reset configuration', { error: error.message });
      return false;
    }
  }

  /**
   * Set protection level preset
   * @param {string} level - Protection level
   * @returns {boolean} Success status
   */
  async setProtectionLevel(level) {
    const presets = {
      minimal: {
        'threatDetection.sensitivity': 0.3,
        'threatDetection.blockThreshold': 0.9,
        'network.rateLimitMax': 200,
        'behavior.anomalyThreshold': 0.9,
        'recovery.autoRecovery': false,
        'logging.level': 'warn'
      },
      balanced: {
        'threatDetection.sensitivity': 0.7,
        'threatDetection.blockThreshold': 0.8,
        'network.rateLimitMax': 100,
        'behavior.anomalyThreshold': 0.75,
        'recovery.autoRecovery': true,
        'logging.level': 'info'
      },
      strict: {
        'threatDetection.sensitivity': 0.8,
        'threatDetection.blockThreshold': 0.7,
        'network.rateLimitMax': 50,
        'behavior.anomalyThreshold': 0.6,
        'recovery.autoRecovery': true,
        'logging.level': 'info'
      },
      paranoid: {
        'threatDetection.sensitivity': 0.95,
        'threatDetection.blockThreshold': 0.5,
        'network.rateLimitMax': 20,
        'behavior.anomalyThreshold': 0.4,
        'recovery.autoRecovery': true,
        'logging.level': 'debug'
      }
    };

    if (!(level in presets)) {
      logger.error('Invalid protection level', { level });
      return false;
    }

    const updates = { protectionLevel: level, ...presets[level] };
    return await this.update(updates);
  }

  /**
   * Add configuration change listener
   * @param {string} path - Configuration path to listen for
   * @param {Function} callback - Callback function
   * @returns {string} Listener ID
   */
  addListener(path, callback) {
    const listenerId = `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Map());
    }

    this.listeners.get(path).set(listenerId, callback);
    return listenerId;
  }

  /**
   * Remove configuration change listener
   * @param {string} path - Configuration path
   * @param {string} listenerId - Listener ID
   */
  removeListener(path, listenerId) {
    const pathListeners = this.listeners.get(path);
    if (pathListeners) {
      pathListeners.delete(listenerId);
      if (pathListeners.size === 0) {
        this.listeners.delete(path);
      }
    }
  }

  /**
   * Notify listeners of configuration change
   * @param {string} path - Changed path
   * @param {*} value - New value
   */
  notifyListeners(path, value) {
    // Notify exact path listeners
    const exactListeners = this.listeners.get(path);
    if (exactListeners) {
      exactListeners.forEach(callback => {
        try {
          callback(path, value);
        } catch (error) {
          logger.error('Configuration listener error', { path, error: error.message });
        }
      });
    }

    // Notify wildcard listeners (parent paths)
    const pathParts = path.split('.');
    for (let i = pathParts.length - 1; i > 0; i--) {
      const parentPath = pathParts.slice(0, i).join('.');
      const parentListeners = this.listeners.get(`${parentPath}.*`);
      if (parentListeners) {
        parentListeners.forEach(callback => {
          try {
            callback(path, value);
          } catch (error) {
            logger.error('Configuration listener error', { path, error: error.message });
          }
        });
      }
    }
  }

  /**
   * Export configuration
   * @returns {string} JSON string of configuration
   */
  export() {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration
   * @param {string} configJson - JSON string of configuration
   * @returns {boolean} Success status
   */
  async import(configJson) {
    try {
      const importedConfig = JSON.parse(configJson);

      // Validate imported config
      const validation = this.validateConfig(importedConfig);
      if (!validation.valid) {
        logger.error('Invalid imported configuration', { errors: validation.errors });
        return false;
      }

      // Merge with current config
      this.config = this.mergeConfigs(this.getDefaultConfig(), importedConfig);

      // Save to storage
      await storage.saveConfiguration(this.config);

      logger.info('Configuration imported successfully');
      return true;

    } catch (error) {
      logger.error('Failed to import configuration', { error: error.message });
      return false;
    }
  }

  /**
   * Get configuration statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      initialized: this.isInitialized,
      protectionLevel: this.config.protectionLevel,
      listeners: Array.from(this.listeners.keys()).length,
      features: Object.keys(this.config.features).filter(key => this.config.features[key]).length,
      totalFeatures: Object.keys(this.config.features).length
    };
  }

  /**
   * Destroy configuration manager
   */
  destroy() {
    this.listeners.clear();
    this.isInitialized = false;
  }
}

export default ConfigManager;