/**
 * Threat Dashboard UI for SHIELD.js
 * Floating visual interface for real-time threat monitoring and control
 */

import logger from '../utils/logger.js';

class ThreatDashboard {
  constructor(shield) {
    this.shield = shield;
    this.container = null;
    this.isVisible = false;
    this.isMinimized = false;
    this.stats = {
      threatsBlocked: 0,
      activeAlerts: 0,
      lastThreat: null,
      uptime: 0
    };
    this.uptimeInterval = null;
    this.startTime = Date.now();

    // Bind methods
    this.handleThreatDetected = this.handleThreatDetected.bind(this);
    this.handleStatsUpdate = this.handleStatsUpdate.bind(this);
  }

  /**
   * Initialize dashboard
   */
  initialize() {
    this.createDashboard();
    this.setupEventListeners();
    this.startUptimeCounter();
    logger.info('Threat dashboard initialized');
  }

  /**
   * Create dashboard HTML structure
   */
  createDashboard() {
    // Create main container
    this.container = document.createElement('div');
    this.container.id = 'shield-dashboard';
    this.container.setAttribute('data-shield', 'dashboard');

    // Add styles
    this.container.innerHTML = `
      <style>
        #shield-dashboard {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 350px;
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          border: 2px solid #0f3460;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #e0e0e0;
          z-index: 999999;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          overflow: hidden;
        }

        #shield-dashboard.minimized {
          height: 50px;
          width: 200px;
        }

        #shield-dashboard.hidden {
          display: none;
        }

        .dashboard-header {
          background: linear-gradient(90deg, #e74c3c, #c0392b);
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: move;
        }

        .dashboard-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: white;
        }

        .header-controls {
          display: flex;
          gap: 8px;
        }

        .control-btn {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .control-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .dashboard-content {
          padding: 16px;
          max-height: 400px;
          overflow-y: auto;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 12px;
          text-align: center;
        }

        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #4ade80;
          display: block;
        }

        .stat-label {
          font-size: 12px;
          color: #a0a0a0;
          margin-top: 4px;
        }

        .threat-list {
          margin-bottom: 16px;
        }

        .threat-item {
          background: rgba(231, 76, 60, 0.1);
          border-left: 3px solid #e74c3c;
          padding: 8px 12px;
          margin-bottom: 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        .threat-type {
          font-weight: bold;
          color: #e74c3c;
        }

        .threat-time {
          color: #a0a0a0;
          font-size: 11px;
        }

        .controls-section {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 16px;
        }

        .control-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .btn {
          padding: 8px 12px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #4ade80;
          color: white;
        }

        .btn-primary:hover {
          background: #22c55e;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #e0e0e0;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-danger:hover {
          background: #dc2626;
        }

        .status-indicator {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #4ade80;
          margin-right: 8px;
          animation: pulse 2s infinite;
        }

        .status-indicator.inactive {
          background: #a0a0a0;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        .protection-level {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid #3b82f6;
          border-radius: 6px;
          padding: 8px 12px;
          margin-bottom: 12px;
          text-align: center;
          font-size: 12px;
          color: #3b82f6;
        }

        .recent-activity {
          max-height: 150px;
          overflow-y: auto;
        }

        .activity-item {
          padding: 4px 8px;
          margin-bottom: 4px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          font-size: 11px;
        }

        .activity-time {
          color: #a0a0a0;
        }
      </style>

      <div class="dashboard-header" id="dashboard-header">
        <h3>
          <span class="status-indicator" id="status-indicator"></span>
          SHIELD.js Firewall
        </h3>
        <div class="header-controls">
          <button class="control-btn" id="minimize-btn" title="Minimize">−</button>
          <button class="control-btn" id="close-btn" title="Close">×</button>
        </div>
      </div>

      <div class="dashboard-content" id="dashboard-content">
        <div class="protection-level" id="protection-level">
          Protection Level: <span id="level-text">Balanced</span>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-value" id="threats-blocked">0</span>
            <div class="stat-label">Threats Blocked</div>
          </div>
          <div class="stat-card">
            <span class="stat-value" id="uptime">00:00:00</span>
            <div class="stat-label">Uptime</div>
          </div>
        </div>

        <div class="threat-list">
          <h4 style="margin: 0 0 8px 0; font-size: 14px;">Recent Threats</h4>
          <div id="recent-threats" class="recent-activity">
            <div class="activity-item">No recent threats detected</div>
          </div>
        </div>

        <div class="controls-section">
          <div class="control-buttons">
            <button class="btn btn-primary" id="scan-btn">Quick Scan</button>
            <button class="btn btn-secondary" id="config-btn">Settings</button>
            <button class="btn btn-secondary" id="logs-btn">View Logs</button>
            <button class="btn btn-danger" id="reset-btn">Reset</button>
          </div>
        </div>
      </div>
    `;

    // Add to DOM
    document.body.appendChild(this.container);

    // Setup drag functionality
    this.setupDragAndDrop();

    // Setup button handlers
    this.setupButtonHandlers();

    // Initially hide
    this.hide();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    document.addEventListener('shield:threat-detected', this.handleThreatDetected);
    document.addEventListener('shield:stats-update', this.handleStatsUpdate);
  }

  /**
   * Setup drag and drop functionality
   */
  setupDragAndDrop() {
    const header = this.container.querySelector('#dashboard-header');
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = this.container.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;

      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      const newLeft = startLeft + deltaX;
      const newTop = startTop + deltaY;

      // Keep within viewport bounds
      const maxLeft = window.innerWidth - this.container.offsetWidth;
      const maxTop = window.innerHeight - (this.isMinimized ? 50 : 200);

      this.container.style.left = Math.max(0, Math.min(newLeft, maxLeft)) + 'px';
      this.container.style.top = Math.max(0, Math.min(newTop, maxTop)) + 'px';
      this.container.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      document.body.style.userSelect = '';
    });
  }

  /**
   * Setup button handlers
   */
  setupButtonHandlers() {
    // Minimize button
    this.container.querySelector('#minimize-btn').addEventListener('click', () => {
      this.toggleMinimize();
    });

    // Close button
    this.container.querySelector('#close-btn').addEventListener('click', () => {
      this.hide();
    });

    // Scan button
    this.container.querySelector('#scan-btn').addEventListener('click', async () => {
      try {
        const results = await this.shield.scan();
        this.showNotification('Scan completed', 'success');
        logger.info('Manual scan completed', results);
      } catch (error) {
        this.showNotification('Scan failed: ' + error.message, 'error');
      }
    });

    // Config button
    this.container.querySelector('#config-btn').addEventListener('click', () => {
      this.showConfigDialog();
    });

    // Logs button
    this.container.querySelector('#logs-btn').addEventListener('click', () => {
      this.showLogsDialog();
    });

    // Reset button
    this.container.querySelector('#reset-btn').addEventListener('click', async () => {
      if (confirm('Are you sure you want to reset SHIELD? This will clear all data.')) {
        try {
          await this.shield.reset();
          this.showNotification('SHIELD reset successfully', 'success');
        } catch (error) {
          this.showNotification('Reset failed: ' + error.message, 'error');
        }
      }
    });
  }

  /**
   * Handle threat detection events
   * @param {Event} event - Threat event
   */
  handleThreatDetected(event) {
    const { threatType, severity, details } = event.detail;

    this.stats.threatsBlocked++;
    this.stats.lastThreat = {
      type: threatType,
      severity,
      timestamp: Date.now(),
      details
    };

    this.updateStats();
    this.addThreatToList(threatType, severity, details);
  }

  /**
   * Handle stats update events
   * @param {Event} event - Stats event
   */
  handleStatsUpdate(event) {
    Object.assign(this.stats, event.detail);
    this.updateStats();
  }

  /**
   * Update dashboard statistics
   */
  updateStats() {
    const threatsEl = this.container.querySelector('#threats-blocked');
    const uptimeEl = this.container.querySelector('#uptime');
    const statusEl = this.container.querySelector('#status-indicator');
    const levelEl = this.container.querySelector('#level-text');

    if (threatsEl) threatsEl.textContent = this.stats.threatsBlocked;
    if (uptimeEl) uptimeEl.textContent = this.formatUptime();
    if (statusEl) {
      statusEl.classList.toggle('inactive', !this.shield.isActive);
    }
    if (levelEl && this.shield.config) {
      levelEl.textContent = this.shield.config.get('protectionLevel');
    }
  }

  /**
   * Add threat to recent threats list
   * @param {string} type - Threat type
   * @param {number} severity - Threat severity
   * @param {Object} details - Threat details
   */
  addThreatToList(type, severity, details) {
    const threatsContainer = this.container.querySelector('#recent-threats');

    if (threatsContainer) {
      const threatItem = document.createElement('div');
      threatItem.className = 'threat-item';
      threatItem.innerHTML = `
        <div class="threat-type">${type.toUpperCase()}</div>
        <div class="threat-time">${new Date().toLocaleTimeString()}</div>
      `;

      // Insert at top
      threatsContainer.insertBefore(threatItem, threatsContainer.firstChild);

      // Limit to 5 recent threats
      while (threatsContainer.children.length > 5) {
        threatsContainer.removeChild(threatsContainer.lastChild);
      }
    }
  }

  /**
   * Format uptime display
   * @returns {string} Formatted uptime
   */
  formatUptime() {
    const elapsed = Date.now() - this.startTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Start uptime counter
   */
  startUptimeCounter() {
    this.uptimeInterval = setInterval(() => {
      this.updateStats();
    }, 1000);
  }

  /**
   * Show dashboard
   */
  show() {
    if (this.container) {
      this.container.classList.remove('hidden');
      this.isVisible = true;
      this.updateStats();
    }
  }

  /**
   * Hide dashboard
   */
  hide() {
    if (this.container) {
      this.container.classList.add('hidden');
      this.isVisible = false;
    }
  }

  /**
   * Toggle minimized state
   */
  toggleMinimize() {
    if (this.container) {
      this.isMinimized = !this.isMinimized;
      this.container.classList.toggle('minimized', this.isMinimized);

      const content = this.container.querySelector('#dashboard-content');
      if (content) {
        content.style.display = this.isMinimized ? 'none' : 'block';
      }

      const btn = this.container.querySelector('#minimize-btn');
      if (btn) {
        btn.textContent = this.isMinimized ? '+' : '−';
      }
    }
  }

  /**
   * Show notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type
   */
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.setAttribute('data-shield', 'notification');
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#4ade80' : '#3b82f6'};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 1000000;
      font-size: 14px;
      max-width: 300px;
      animation: slideIn 0.3s ease;
    `;

    notification.innerHTML = `
      <style>
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      </style>
      ${message}
    `;

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  /**
   * Show configuration dialog
   */
  showConfigDialog() {
    const config = this.shield.getConfig();
    if (!config) return;

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
      <div style="background: #1a1a2e; border-radius: 12px; padding: 24px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
        <h3 style="margin: 0 0 20px 0; color: #e0e0e0;">SHIELD Configuration</h3>

        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; color: #e0e0e0; font-size: 14px;">Protection Level:</label>
          <select id="protection-level" style="width: 100%; padding: 8px; background: #16213e; border: 1px solid #0f3460; border-radius: 6px; color: #e0e0e0;">
            <option value="minimal">Minimal</option>
            <option value="balanced">Balanced</option>
            <option value="strict">Strict</option>
            <option value="paranoid">Paranoid</option>
          </select>
        </div>

        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 12px 0; color: #e0e0e0; font-size: 16px;">Features:</h4>
          ${Object.keys(config.features).map(feature => `
            <label style="display: block; margin-bottom: 8px; color: #a0a0a0; font-size: 14px;">
              <input type="checkbox" id="feature-${feature}" ${config.features[feature] ? 'checked' : ''}>
              ${feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </label>
          `).join('')}
        </div>

        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button id="config-cancel" class="btn btn-secondary" style="padding: 10px 20px;">Cancel</button>
          <button id="config-save" class="btn btn-primary" style="padding: 10px 20px;">Save</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    // Set current protection level
    const levelSelect = dialog.querySelector('#protection-level');
    levelSelect.value = config.protectionLevel;

    // Setup event handlers
    dialog.querySelector('#config-cancel').addEventListener('click', () => {
      document.body.removeChild(dialog);
    });

    dialog.querySelector('#config-save').addEventListener('click', async () => {
      try {
        const newConfig = {
          protectionLevel: levelSelect.value
        };

        // Collect feature toggles
        Object.keys(config.features).forEach(feature => {
          const checkbox = dialog.querySelector(`#feature-${feature}`);
          newConfig[`features.${feature}`] = checkbox.checked;
        });

        const success = await this.shield.configure(newConfig);
        if (success) {
          this.showNotification('Configuration saved', 'success');
          document.body.removeChild(dialog);
        } else {
          this.showNotification('Failed to save configuration', 'error');
        }
      } catch (error) {
        this.showNotification('Configuration error: ' + error.message, 'error');
      }
    });
  }

  /**
   * Show logs dialog
   */
  showLogsDialog() {
    // This would show recent logs - simplified for now
    this.showNotification('Logs feature coming soon', 'info');
  }

  /**
   * Get dashboard statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      visible: this.isVisible,
      minimized: this.isMinimized,
      threatsBlocked: this.stats.threatsBlocked,
      uptime: Date.now() - this.startTime,
      lastThreat: this.stats.lastThreat
    };
  }

  /**
   * Destroy dashboard
   */
  destroy() {
    if (this.uptimeInterval) {
      clearInterval(this.uptimeInterval);
    }

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    document.removeEventListener('shield:threat-detected', this.handleThreatDetected);
    document.removeEventListener('shield:stats-update', this.handleStatsUpdate);
  }
}

export default ThreatDashboard;