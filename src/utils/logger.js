/**
 * Logging system for SHIELD.js
 * Provides structured logging with different levels and storage integration
 */

import storageManager from './storage.js';

class Logger {
  constructor() {
    this.levels = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3,
      CRITICAL: 4
    };

    this.levelNames = Object.keys(this.levels);
    this.currentLevel = this.levels.INFO;
    this.maxLogsInMemory = 1000;
    this.logs = [];
    this.listeners = new Set();
  }

  /**
   * Set the minimum log level
   * @param {string} level - Log level (DEBUG, INFO, WARN, ERROR, CRITICAL)
   */
  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this.currentLevel = this.levels[level];
    }
  }

  /**
   * Add a log listener
   * @param {Function} listener - Listener function
   */
  addListener(listener) {
    this.listeners.add(listener);
  }

  /**
   * Remove a log listener
   * @param {Function} listener - Listener function
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }

  /**
   * Create a log entry
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   * @param {Error} error - Error object
   * @returns {Object} Log entry
   */
  createLogEntry(level, message, data = {}, error = null) {
    const entry = {
      id: this.generateId(),
      timestamp: Date.now(),
      level,
      message,
      data,
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId()
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    return entry;
  }

  /**
   * Log a message
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   * @param {Error} error - Error object
   */
  async log(level, message, data = {}, error = null) {
    if (this.levels[level] < this.currentLevel) {
      return;
    }

    const entry = this.createLogEntry(level, message, data, error);

    // Add to memory buffer
    this.logs.push(entry);
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs.shift();
    }

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(entry);
      } catch (err) {
        console.error('Log listener error:', err);
      }
    });

    // Persist threat-related logs
    if (level === 'WARN' || level === 'ERROR' || level === 'CRITICAL') {
      try {
        await storageManager.logThreat({
          type: data.type || 'general',
          severity: level.toLowerCase(),
          details: data,
          action: data.action || 'logged',
          url: entry.url
        });
      } catch (err) {
        console.error('Failed to persist threat log:', err);
      }
    }

    // Console output for development
    this.consoleOutput(entry);
  }

  /**
   * Debug level log
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  debug(message, data = {}) {
    this.log('DEBUG', message, data);
  }

  /**
   * Info level log
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  info(message, data = {}) {
    this.log('INFO', message, data);
  }

  /**
   * Warning level log
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  warn(message, data = {}) {
    this.log('WARN', message, data);
  }

  /**
   * Error level log
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   * @param {Error} error - Error object
   */
  error(message, data = {}, error = null) {
    this.log('ERROR', message, data, error);
  }

  /**
   * Critical level log
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   * @param {Error} error - Error object
   */
  critical(message, data = {}, error = null) {
    this.log('CRITICAL', message, data, error);
  }

  /**
   * Log a threat detection
   * @param {string} type - Threat type
   * @param {Object} details - Threat details
   * @param {string} action - Action taken
   */
  threatDetected(type, details = {}, action = 'blocked') {
    this.warn(`Threat detected: ${type}`, {
      type,
      ...details,
      action
    });
  }

  /**
   * Log a security event
   * @param {string} event - Event type
   * @param {Object} details - Event details
   */
  securityEvent(event, details = {}) {
    this.info(`Security event: ${event}`, {
      event,
      ...details
    });
  }

  /**
   * Log performance metrics
   * @param {string} metric - Metric name
   * @param {number} value - Metric value
   * @param {string} unit - Unit of measurement
   */
  performance(metric, value, unit = 'ms') {
    this.debug(`Performance: ${metric}`, {
      metric,
      value,
      unit
    });
  }

  /**
   * Get recent logs
   * @param {number} limit - Maximum number of logs to return
   * @param {string} level - Minimum level to include
   * @returns {Array} Array of log entries
   */
  getRecentLogs(limit = 100, level = 'DEBUG') {
    const minLevel = this.levels[level] || 0;
    return this.logs
      .filter(entry => this.levels[entry.level] >= minLevel)
      .slice(-limit);
  }

  /**
   * Get logs from storage
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of stored log entries
   */
  async getStoredLogs(filters = {}) {
    try {
      return await storageManager.getThreatLogs(filters);
    } catch (error) {
      console.error('Failed to retrieve stored logs:', error);
      return [];
    }
  }

  /**
   * Export logs to JSON
   * @param {number} limit - Maximum number of logs to export
   * @returns {string} JSON string of logs
   */
  exportLogs(limit = 1000) {
    const logs = this.getRecentLogs(limit);
    return JSON.stringify({
      exportDate: Date.now(),
      logs
    }, null, 2);
  }

  /**
   * Clear memory logs
   */
  clearMemoryLogs() {
    this.logs = [];
  }

  /**
   * Generate unique ID for log entries
   * @returns {string} Unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Get or create session ID
   * @returns {string} Session ID
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('shield_session_id');
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem('shield_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Console output for development
   * @param {Object} entry - Log entry
   */
  consoleOutput(entry) {
    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[SHIELD ${timestamp}]`;

    const message = `${prefix} ${entry.level}: ${entry.message}`;

    switch (entry.level) {
    case 'DEBUG':
      console.debug(message, entry.data);
      break;
    case 'INFO':
      console.info(message, entry.data);
      break;
    case 'WARN':
      console.warn(message, entry.data);
      break;
    case 'ERROR':
    case 'CRITICAL':
      console.error(message, entry.data, entry.error);
      break;
    }
  }

  /**
   * Get log statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {},
      recentErrors: 0,
      recentWarnings: 0
    };

    this.levelNames.forEach(level => {
      stats.byLevel[level] = 0;
    });

    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    this.logs.forEach(entry => {
      stats.byLevel[entry.level]++;

      if (entry.timestamp > oneHourAgo) {
        if (entry.level === 'ERROR' || entry.level === 'CRITICAL') {
          stats.recentErrors++;
        } else if (entry.level === 'WARN') {
          stats.recentWarnings++;
        }
      }
    });

    return stats;
  }
}

// Export singleton instance
const logger = new Logger();
export default logger;