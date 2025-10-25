/**
 * Alerts System for SHIELD.js
 * Toast notifications and alert management with severity levels and persistence
 */

import logger from '../utils/logger.js';
import storage from '../utils/storage.js';

class AlertsSystem {
  constructor() {
    this.alerts = new Map();
    this.alertHistory = [];
    this.maxHistory = 100;
    this.container = null;
    this.isEnabled = true;
    this.defaultDuration = 5000; // 5 seconds
    this.maxVisibleAlerts = 5;

    // Alert types and their configurations
    this.alertTypes = {
      threat: {
        icon: '[THREAT]',
        color: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: '#ef4444',
        duration: 8000,
        sound: true
      },
      warning: {
        icon: '[WARNING]',
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.1)',
        borderColor: '#f59e0b',
        duration: 6000,
        sound: false
      },
      info: {
        icon: '[INFO]',
        color: '#3b82f6',
        bgColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: '#3b82f6',
        duration: 4000,
        sound: false
      },
      success: {
        icon: '[SUCCESS]',
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: '#10b981',
        duration: 3000,
        sound: false
      }
    };

    // Bind methods
    this.handleThreatDetected = this.handleThreatDetected.bind(this);
    this.handleRecoveryEvent = this.handleRecoveryEvent.bind(this);
  }

  /**
   * Initialize alerts system
   */
  initialize() {
    this.createContainer();
    this.setupEventListeners();
    this.loadAlertHistory();
    logger.info('Alerts system initialized');
  }

  /**
   * Create alerts container
   */
  createContainer() {
    this.container = document.createElement('div');
    this.container.id = 'shield-alerts-container';
    this.container.setAttribute('data-shield', 'alerts');

    // Add styles
    this.container.innerHTML = `
      <style>
        #shield-alerts-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 999998;
          pointer-events: none;
          max-width: 400px;
        }

        .shield-alert {
          background: rgba(26, 26, 46, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          pointer-events: auto;
          transform: translateX(100%);
          opacity: 0;
          transition: all 0.3s ease;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #e0e0e0;
          position: relative;
          overflow: hidden;
        }

        .shield-alert.show {
          transform: translateX(0);
          opacity: 1;
        }

        .shield-alert.hide {
          transform: translateX(100%);
          opacity: 0;
        }

        .alert-header {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }

        .alert-icon {
          font-size: 18px;
          margin-right: 8px;
        }

        .alert-title {
          font-weight: 600;
          font-size: 14px;
          flex: 1;
        }

        .alert-close {
          background: none;
          border: none;
          color: #a0a0a0;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: color 0.2s;
        }

        .alert-close:hover {
          color: #e0e0e0;
        }

        .alert-message {
          font-size: 13px;
          line-height: 1.4;
          margin-bottom: 8px;
        }

        .alert-details {
          font-size: 12px;
          color: #a0a0a0;
          background: rgba(255, 255, 255, 0.05);
          padding: 8px;
          border-radius: 4px;
          margin-top: 8px;
        }

        .alert-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          background: currentColor;
          border-radius: 0 0 4px 4px;
          animation: progress linear forwards;
        }

        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }

        .alert-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .alert-btn {
          padding: 6px 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.05);
          color: #e0e0e0;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }

        .alert-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .alert-btn.primary {
          background: currentColor;
          color: #1a1a2e;
          border-color: currentColor;
        }

        .alert-sound-indicator {
          position: absolute;
          top: 8px;
          right: 40px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #f59e0b;
          animation: sound-pulse 1s infinite;
        }

        @keyframes sound-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }

        /* Responsive adjustments */
        @media (max-width: 480px) {
          #shield-alerts-container {
            left: 10px;
            right: 10px;
            max-width: none;
          }

          .shield-alert {
            margin-bottom: 8px;
          }
        }
      </style>
    `;

    document.body.appendChild(this.container);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    document.addEventListener('shield:threat-detected', this.handleThreatDetected);
    document.addEventListener('shield:recovery', this.handleRecoveryEvent);
  }

  /**
   * Show alert
   * @param {string} type - Alert type
   * @param {string} title - Alert title
   * @param {string} message - Alert message
   * @param {Object} options - Additional options
   * @returns {string} Alert ID
   */
  show(type, title, message, options = {}) {
    if (!this.isEnabled) return null;

    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const config = this.alertTypes[type] || this.alertTypes.info;

    const alert = {
      id: alertId,
      type,
      title,
      message,
      timestamp: Date.now(),
      config,
      options: {
        duration: options.duration || config.duration,
        persistent: options.persistent || false,
        actions: options.actions || [],
        details: options.details || null,
        sound: options.sound !== undefined ? options.sound : config.sound,
        ...options
      }
    };

    // Create alert element
    const alertElement = this.createAlertElement(alert);
    this.container.appendChild(alertElement);

    // Store alert
    this.alerts.set(alertId, { ...alert, element: alertElement });

    // Add to history
    this.addToHistory(alert);

    // Animate in
    setTimeout(() => {
      alertElement.classList.add('show');
    }, 10);

    // Play sound if enabled
    if (alert.options.sound) {
      this.playAlertSound(type);
    }

    // Auto dismiss if not persistent
    if (!alert.options.persistent) {
      this.scheduleDismiss(alertId, alert.options.duration);
    }

    // Limit visible alerts
    this.limitVisibleAlerts();

    logger.debug('Alert shown', { alertId, type, title });
    return alertId;
  }

  /**
   * Create alert DOM element
   * @param {Object} alert - Alert data
   * @returns {HTMLElement} Alert element
   */
  createAlertElement(alert) {
    const element = document.createElement('div');
    element.className = 'shield-alert';
    element.style.borderColor = alert.config.borderColor;
    element.style.color = alert.config.color;

    element.innerHTML = `
      <div class="alert-header">
        <span class="alert-icon">${alert.config.icon}</span>
        <span class="alert-title">${alert.title}</span>
        <button class="alert-close" title="Close">×</button>
      </div>
      <div class="alert-message">${alert.message}</div>
      ${alert.options.details ? `<div class="alert-details">${alert.options.details}</div>` : ''}
      ${alert.options.actions.length > 0 ? `
        <div class="alert-actions">
          ${alert.options.actions.map(action => `
            <button class="alert-btn ${action.primary ? 'primary' : ''}" data-action="${action.id}">
              ${action.label}
            </button>
          `).join('')}
        </div>
      ` : ''}
      ${alert.options.sound ? '<div class="alert-sound-indicator"></div>' : ''}
      <div class="alert-progress" style="animation-duration: ${alert.options.duration}ms;"></div>
    `;

    // Setup event handlers
    const closeBtn = element.querySelector('.alert-close');
    closeBtn.addEventListener('click', () => this.dismiss(alert.id));

    // Setup action buttons
    alert.options.actions.forEach(action => {
      const btn = element.querySelector(`[data-action="${action.id}"]`);
      if (btn) {
        btn.addEventListener('click', () => {
          if (action.callback) action.callback();
          if (action.dismiss !== false) this.dismiss(alert.id);
        });
      }
    });

    return element;
  }

  /**
   * Dismiss alert
   * @param {string} alertId - Alert ID
   */
  dismiss(alertId) {
    const alert = this.alerts.get(alertId);
    if (!alert) return;

    const element = alert.element;
    element.classList.add('hide');

    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      this.alerts.delete(alertId);
    }, 300);

    logger.debug('Alert dismissed', { alertId });
  }

  /**
   * Schedule alert dismissal
   * @param {string} alertId - Alert ID
   * @param {number} delay - Delay in milliseconds
   */
  scheduleDismiss(alertId, delay) {
    setTimeout(() => {
      if (this.alerts.has(alertId)) {
        this.dismiss(alertId);
      }
    }, delay);
  }

  /**
   * Limit visible alerts
   */
  limitVisibleAlerts() {
    const visibleAlerts = Array.from(this.alerts.values())
      .filter(alert => alert.element && alert.element.classList.contains('show'))
      .sort((a, b) => a.timestamp - b.timestamp);

    if (visibleAlerts.length > this.maxVisibleAlerts) {
      const toDismiss = visibleAlerts.slice(0, visibleAlerts.length - this.maxVisibleAlerts);
      toDismiss.forEach(alert => this.dismiss(alert.id));
    }
  }

  /**
   * Handle threat detection events
   * @param {Event} event - Threat event
   */
  handleThreatDetected(event) {
    const { threatType, severity, details } = event.detail;

    let alertType = 'info';
    let title = 'Threat Detected';
    let message = `A ${threatType} threat has been detected and blocked.`;

    if (severity >= 8) {
      alertType = 'threat';
      title = 'High Severity Threat Blocked';
      message = `Critical ${threatType} threat detected and neutralized.`;
    } else if (severity >= 6) {
      alertType = 'warning';
      title = 'Medium Threat Blocked';
    }

    const alertDetails = details ? JSON.stringify(details, null, 2) : null;

    this.show(alertType, title, message, {
      details: alertDetails,
      actions: [
        {
          id: 'view-details',
          label: 'View Details',
          callback: () => this.showThreatDetails(threatType, severity, details)
        }
      ]
    });
  }

  /**
   * Handle recovery events
   * @param {Event} event - Recovery event
   */
  handleRecoveryEvent(event) {
    const { timestamp } = event.detail;

    this.show('success', 'Auto-Recovery Completed', 'SHIELD has successfully recovered from a security incident.', {
      actions: [
        {
          id: 'view-snapshots',
          label: 'View Snapshots',
          callback: () => this.showRecoveryOptions()
        }
      ]
    });
  }

  /**
   * Show threat details dialog
   * @param {string} threatType - Threat type
   * @param {number} severity - Threat severity
   * @param {Object} details - Threat details
   */
  showThreatDetails(threatType, severity, details) {
    const dialog = this.createDialog('Threat Details', `
      <div style="font-family: monospace; background: #16213e; padding: 12px; border-radius: 4px; margin: 12px 0;">
        <div><strong>Type:</strong> ${threatType}</div>
        <div><strong>Severity:</strong> ${severity}/10</div>
        <div><strong>Timestamp:</strong> ${new Date().toLocaleString()}</div>
        ${details ? `<div><strong>Details:</strong></div><pre>${JSON.stringify(details, null, 2)}</pre>` : ''}
      </div>
    `);

    document.body.appendChild(dialog);
  }

  /**
   * Show recovery options dialog
   */
  showRecoveryOptions() {
    // This would integrate with recovery engine - simplified for now
    this.show('info', 'Recovery Options', 'Recovery management features available in dashboard.', {
      persistent: true,
      actions: [
        {
          id: 'dismiss',
          label: 'OK',
          primary: true
        }
      ]
    });
  }

  /**
   * Create generic dialog
   * @param {string} title - Dialog title
   * @param {string} content - Dialog content
   * @returns {HTMLElement} Dialog element
   */
  createDialog(title, content) {
    const dialog = document.createElement('div');
    dialog.setAttribute('data-shield', 'dialog');
    dialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000001;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;

    dialog.innerHTML = `
      <div style="background: #1a1a2e; border-radius: 12px; padding: 24px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
        <h3 style="margin: 0 0 20px 0; color: #e0e0e0;">${title}</h3>
        <div style="color: #e0e0e0;">${content}</div>
        <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
          <button id="dialog-close" style="padding: 8px 16px; background: #4ade80; color: white; border: none; border-radius: 6px; cursor: pointer;">Close</button>
        </div>
      </div>
    `;

    dialog.querySelector('#dialog-close').addEventListener('click', () => {
      document.body.removeChild(dialog);
    });

    return dialog;
  }

  /**
   * Play alert sound
   * @param {string} type - Alert type
   */
  playAlertSound(type) {
    try {
      // Create audio context for alert sounds
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Different frequencies for different alert types
      const frequencies = {
        threat: 800,
        warning: 600,
        info: 400,
        success: 500
      };

      oscillator.frequency.setValueAtTime(frequencies[type] || 400, this.audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.3);

    } catch (error) {
      // Silently fail if audio is not available
      logger.debug('Could not play alert sound', { error: error.message });
    }
  }

  /**
   * Add alert to history
   * @param {Object} alert - Alert data
   */
  addToHistory(alert) {
    this.alertHistory.push({
      id: alert.id,
      type: alert.type,
      title: alert.title,
      message: alert.message,
      timestamp: alert.timestamp,
      dismissed: false
    });

    // Maintain history limit
    if (this.alertHistory.length > this.maxHistory) {
      this.alertHistory.shift();
    }

    // Save to storage
    this.saveAlertHistory();
  }

  /**
   * Load alert history from storage
   */
  async loadAlertHistory() {
    try {
      const history = await storage.getAlertHistory();
      if (history) {
        this.alertHistory = history;
        logger.debug('Alert history loaded', { count: history.length });
      }
    } catch (error) {
      logger.debug('Could not load alert history', { error: error.message });
    }
  }

  /**
   * Save alert history to storage
   */
  async saveAlertHistory() {
    try {
      await storage.saveAlertHistory(this.alertHistory);
    } catch (error) {
      logger.debug('Could not save alert history', { error: error.message });
    }
  }

  /**
   * Get alerts statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const now = Date.now();
    const last24h = now - 86400000;

    const recentAlerts = this.alertHistory.filter(alert => alert.timestamp > last24h);
    const threatAlerts = recentAlerts.filter(alert => alert.type === 'threat');

    return {
      total: this.alertHistory.length,
      visible: this.alerts.size,
      recent24h: recentAlerts.length,
      threats24h: threatAlerts.length,
      enabled: this.isEnabled,
      maxHistory: this.maxHistory,
      maxVisible: this.maxVisibleAlerts
    };
  }

  /**
   * Get alert history
   * @param {number} limit - Maximum number of alerts to return
   * @returns {Array} Alert history
   */
  getHistory(limit = 50) {
    return this.alertHistory
      .slice(-limit)
      .reverse()
      .map(alert => ({
        ...alert,
        timeAgo: this.getTimeAgo(alert.timestamp)
      }));
  }

  /**
   * Get time ago string
   * @param {number} timestamp - Timestamp
   * @returns {string} Time ago string
   */
  getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  /**
   * Clear all alerts
   */
  clearAll() {
    Array.from(this.alerts.keys()).forEach(alertId => {
      this.dismiss(alertId);
    });
  }

  /**
   * Enable/disable alerts
   * @param {boolean} enabled - Whether to enable alerts
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.clearAll();
    }
    logger.info('Alerts system ' + (enabled ? 'enabled' : 'disabled'));
  }

  /**
   * Configure alerts system
   * @param {Object} config - Configuration options
   */
  configure(config) {
    if (config.maxHistory !== undefined) {
      this.maxHistory = config.maxHistory;
    }
    if (config.maxVisibleAlerts !== undefined) {
      this.maxVisibleAlerts = config.maxVisibleAlerts;
    }
    if (config.defaultDuration !== undefined) {
      this.defaultDuration = config.defaultDuration;
    }
    if (config.enabled !== undefined) {
      this.setEnabled(config.enabled);
    }

    logger.info('Alerts system configured', config);
  }

  /**
   * Destroy alerts system
   */
  destroy() {
    this.clearAll();

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    document.removeEventListener('shield:threat-detected', this.handleThreatDetected);
    document.removeEventListener('shield:recovery', this.handleRecoveryEvent);

    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

export default AlertsSystem;