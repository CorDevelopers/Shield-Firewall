# Advanced Configuration Examples

This guide covers advanced configuration scenarios and real-world implementation examples for Core Developer.

## Custom Threat Detection Patterns

### Advanced Pattern Matching

```javascript
const shield = new ShieldFirewall();

// Configure with custom regex patterns
await shield.configure({
  protectionLevel: 'strict',
  threatDetection: {
    sensitivity: 0.9,
    customPatterns: [
      // XSS patterns
      '<script[^>]*>.*?</script>',
      'javascript:',
      'on\\w+\\s*=',
      'eval\\(',
      'document\\.cookie',

      // SQL injection patterns
      '(\\b(union|select|insert|update|delete|drop|create|alter)\\b)',
      '(\\bor\\b.*=.*\\bor\\b)',
      '(\\band\\b.*=.*\\band\\b)',

      // Directory traversal
      '\\.\\./',
      '\\.\\.',
      '%2e%2e%2f',

      // Command injection
      '[;&|`$()]',
      'system\\(',
      'exec\\(',

      // File inclusion
      'include\\(',
      'require\\(',
      'file_get_contents',

      // Exclusion patterns (start with !)
      '!legitimate-script.js',
      '!trusted-domain.com',
      '!myapp.com'
    ]
  }
});

await shield.initialize();
await shield.start();
```

### Dynamic Pattern Updates

```javascript
class DynamicThreatManager {
  constructor(shield) {
    this.shield = shield;
    this.patterns = new Set();
    this.loadPatternsFromAPI();
  }

  async loadPatternsFromAPI() {
    try {
      const response = await fetch('/api/threat-patterns');
      const data = await response.json();

      // Update patterns dynamically
      await this.shield.configure({
        threatDetection: {
          customPatterns: Array.from(this.patterns).concat(data.patterns)
        }
      });

      console.log('Threat patterns updated from API');
    } catch (error) {
      console.error('Failed to load threat patterns:', error);
    }
  }

  addPattern(pattern) {
    this.patterns.add(pattern);
    this.updateConfiguration();
  }

  removePattern(pattern) {
    this.patterns.delete(pattern);
    this.updateConfiguration();
  }

  async updateConfiguration() {
    await this.shield.configure({
      threatDetection: {
        customPatterns: Array.from(this.patterns)
      }
    });
  }
}

// Usage
const threatManager = new DynamicThreatManager(shield);
threatManager.addPattern('malicious-payload');
```

## Multi-Layer Protection Strategy

### Enterprise Configuration

```javascript
const enterpriseConfig = {
  protectionLevel: 'maximum',
  features: {
    domProtection: true,
    networkInterception: true,
    behaviorAnalysis: true,
    predictiveDetection: true,
    autoRecovery: true,
    realTimeMonitoring: true
  },
  threatDetection: {
    sensitivity: 0.95,
    customPatterns: [
      // Enterprise-specific patterns
      'internal-api.*token',
      'admin.*session',
      'confidential.*data',
      'financial.*records'
    ]
  },
  logging: {
    level: 'detailed',
    maxEntries: 10000
  }
};

const shield = new ShieldFirewall({
  debug: false,
  logLevel: 'info'
});

await shield.configure(enterpriseConfig);
await shield.initialize();
await shield.start();
```

### CDN and Third-Party Integration

```javascript
// Configuration for CDN-protected applications
const cdnConfig = {
  protectionLevel: 'strict',
  features: {
    domProtection: true,
    networkInterception: false, // Disable for CDN compatibility
    behaviorAnalysis: true,
    predictiveDetection: true,
    autoRecovery: true,
    realTimeMonitoring: true
  },
  threatDetection: {
    sensitivity: 0.8,
    customPatterns: [
      // CDN-specific patterns
      'cdn.*malicious',
      'external.*script',
      '!cdn.jsdelivr.net',
      '!ajax.googleapis.com'
    ]
  }
};
```

## Framework-Specific Configurations

### React Applications

```javascript
import React, { useEffect, useRef } from 'react';
import { ShieldFirewall } from 'shield-firewall';

function App() {
  const shieldRef = useRef(null);

  useEffect(() => {
    const initShield = async () => {
      const shield = new ShieldFirewall();

      await shield.configure({
        protectionLevel: 'strict',
        features: {
          domProtection: true,
          networkInterception: true,
          behaviorAnalysis: true,
          predictiveDetection: true,
          autoRecovery: true,
          realTimeMonitoring: true
        },
        threatDetection: {
          sensitivity: 0.85,
          customPatterns: [
            // React-specific patterns
            'dangerouslySetInnerHTML',
            'eval',
            'Function',
            // Component injection attempts
            '<script.*react',
            'ReactDOM.*render.*script'
          ]
        }
      });

      await shield.initialize();
      await shield.start();

      shieldRef.current = shield;

      // Listen for React-specific threats
      document.addEventListener('shield:threat-detected', (event) => {
        const threat = event.detail;
        if (threat.type === 'xss' && threat.source?.includes('react')) {
          console.warn('React XSS attempt detected:', threat);
        }
      });
    };

    initShield();

    return () => {
      if (shieldRef.current) {
        shieldRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="App">
      <h1>Protected React Application</h1>
      {/* Your app content */}
    </div>
  );
}

export default App;
```

### Vue.js Applications

```javascript
import Vue from 'vue';
import { ShieldFirewall } from 'shield-firewall';

Vue.mixin({
  created() {
    if (!window.shieldInitialized) {
      this.initShield();
      window.shieldInitialized = true;
    }
  },
  methods: {
    async initShield() {
      const shield = new ShieldFirewall();

      await shield.configure({
        protectionLevel: 'strict',
        features: {
          domProtection: true,
          networkInterception: true,
          behaviorAnalysis: true,
          predictiveDetection: true,
          autoRecovery: true,
          realTimeMonitoring: true
        },
        threatDetection: {
          sensitivity: 0.85,
          customPatterns: [
            // Vue-specific patterns
            'v-html.*script',
            'new Function',
            '$compile.*script',
            // Template injection
            '{{.*script.*}}',
            'v-bind:html'
          ]
        }
      });

      await shield.initialize();
      await shield.start();

      // Vue-specific event handling
      document.addEventListener('shield:threat-detected', (event) => {
        const threat = event.detail;
        if (threat.type === 'xss' && threat.source?.includes('vue')) {
          this.$emit('security-threat', threat);
        }
      });
    }
  }
});
```

### Angular Applications

```javascript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ShieldFirewall } from 'shield-firewall';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <h1>Protected Angular Application</h1>
      <router-outlet></router-outlet>
    </div>
  `
})
export class AppComponent implements OnInit, OnDestroy {
  private shield: ShieldFirewall | null = null;

  async ngOnInit() {
    this.shield = new ShieldFirewall();

    await this.shield.configure({
      protectionLevel: 'strict',
      features: {
        domProtection: true,
        networkInterception: true,
        behaviorAnalysis: true,
        predictiveDetection: true,
        autoRecovery: true,
        realTimeMonitoring: true
      },
      threatDetection: {
        sensitivity: 0.85,
        customPatterns: [
          // Angular-specific patterns
          'innerHTML.*script',
          'bypassSecurityTrustHtml',
          'DomSanitizer.*bypass',
          // Template injection
          '{{.*script.*}}',
          '\\[innerHTML\\]'
        ]
      }
    });

    await this.shield.initialize();
    await this.shield.start();

    // Angular-specific threat handling
    document.addEventListener('shield:threat-detected', (event) => {
      const threat = event.detail;
      if (threat.type === 'xss' && threat.source?.includes('angular')) {
        console.warn('Angular XSS attempt:', threat);
        // Trigger Angular security measures
      }
    });
  }

  ngOnDestroy() {
    if (this.shield) {
      this.shield.stop();
    }
  }
}
```

## E-commerce Protection

### Payment Form Protection

```javascript
class PaymentProtector {
  constructor() {
    this.shield = new ShieldFirewall();
    this.initProtection();
  }

  async initProtection() {
    await this.shield.configure({
      protectionLevel: 'maximum',
      features: {
        domProtection: true,
        networkInterception: true,
        behaviorAnalysis: true,
        predictiveDetection: true,
        autoRecovery: true,
        realTimeMonitoring: true
      },
      threatDetection: {
        sensitivity: 0.95,
        customPatterns: [
          // Payment-specific threats
          'card.*number',
          'cvv.*code',
          'payment.*data',
          'stripe.*token',
          'paypal.*secret',
          // Form manipulation
          'onchange.*card',
          'onsubmit.*payment'
        ]
      },
      logging: {
        level: 'detailed',
        maxEntries: 2000
      }
    });

    await this.shield.initialize();
    await this.shield.start();

    this.setupPaymentMonitoring();
  }

  setupPaymentMonitoring() {
    // Monitor payment forms specifically
    const paymentForms = document.querySelectorAll('form[action*="payment"], form[action*="checkout"]');

    paymentForms.forEach(form => {
      form.addEventListener('submit', (e) => {
        if (this.detectPaymentThreats(form)) {
          e.preventDefault();
          this.handlePaymentThreat();
        }
      });
    });
  }

  detectPaymentThreats(form) {
    // Check for suspicious patterns in payment data
    const inputs = form.querySelectorAll('input[type="text"], input[type="password"]');
    for (const input of inputs) {
      if (this.shield.validateContent(input.value) === false) {
        return true;
      }
    }
    return false;
  }

  handlePaymentThreat() {
    alert('Payment security threat detected. Please try again.');
    // Log to security system
    this.logSecurityEvent('payment_threat_detected');
  }

  logSecurityEvent(event) {
    // Send to security monitoring system
    fetch('/api/security-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, timestamp: new Date() })
    });
  }
}

// Initialize payment protection
const paymentProtector = new PaymentProtector();
```

## API Gateway Protection

### REST API Protection

```javascript
class APIProtector {
  constructor(apiBaseUrl) {
    this.apiBaseUrl = apiBaseUrl;
    this.shield = new ShieldFirewall();
    this.requestQueue = [];
    this.initProtection();
  }

  async initProtection() {
    await this.shield.configure({
      protectionLevel: 'strict',
      features: {
        networkInterception: true,
        behaviorAnalysis: true,
        predictiveDetection: true
      },
      threatDetection: {
        sensitivity: 0.9,
        customPatterns: [
          // API-specific threats
          'api.*key.*exposure',
          'bearer.*token.*leak',
          'authorization.*header.*tamper',
          'graphql.*introspection',
          'api.*rate.*limit.*bypass'
        ]
      }
    });

    await this.shield.initialize();
    await this.shield.start();

    this.interceptAPIRequests();
  }

  interceptAPIRequests() {
    // Intercept fetch requests to API
    const originalFetch = window.fetch;
    window.fetch = async (url, options = {}) => {
      if (url.startsWith(this.apiBaseUrl)) {
        // Validate API request
        if (!this.validateAPIRequest(url, options)) {
          throw new Error('API request blocked by security policy');
        }

        // Add security headers
        options.headers = {
          ...options.headers,
          'X-Security-Token': this.generateSecurityToken(),
          'X-Request-ID': this.generateRequestId()
        };

        // Queue request for monitoring
        this.requestQueue.push({
          url,
          method: options.method || 'GET',
          timestamp: new Date()
        });
      }

      return originalFetch(url, options);
    };
  }

  validateAPIRequest(url, options) {
    // Check for malicious patterns in URL and body
    if (this.shield.validateContent(url) === false) {
      return false;
    }

    if (options.body && this.shield.validateContent(options.body) === false) {
      return false;
    }

    // Check rate limiting
    if (this.isRateLimited()) {
      return false;
    }

    return true;
  }

  isRateLimited() {
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 100;

    // Clean old requests
    this.requestQueue = this.requestQueue.filter(
      req => now - req.timestamp.getTime() < windowMs
    );

    return this.requestQueue.length >= maxRequests;
  }

  generateSecurityToken() {
    return btoa(Math.random().toString()).substr(10, 10);
  }

  generateRequestId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// Protect API endpoints
const apiProtector = new APIProtector('/api/');
```

## Real-time Monitoring Dashboard

### Security Dashboard Implementation

```javascript
class SecurityDashboard {
  constructor() {
    this.shield = new ShieldFirewall();
    this.stats = {
      threatsDetected: 0,
      threatsBlocked: 0,
      falsePositives: 0,
      responseTime: 0
    };
    this.alerts = [];
    this.initDashboard();
  }

  async initDashboard() {
    await this.shield.configure({
      protectionLevel: 'strict',
      features: {
        realTimeMonitoring: true
      },
      logging: {
        level: 'detailed',
        maxEntries: 1000
      }
    });

    await this.shield.initialize();
    await this.shield.start();

    this.setupEventListeners();
    this.renderDashboard();
    this.startMetricsCollection();
  }

  setupEventListeners() {
    document.addEventListener('shield:threat-detected', (e) => {
      this.stats.threatsDetected++;
      this.addAlert('threat', e.detail);
      this.updateStats();
    });

    document.addEventListener('shield:threat-blocked', (e) => {
      this.stats.threatsBlocked++;
      this.addAlert('blocked', e.detail);
      this.updateStats();
    });

    document.addEventListener('shield:recovery-completed', (e) => {
      if (e.detail.success) {
        this.addAlert('recovery', e.detail);
      }
    });
  }

  addAlert(type, detail) {
    const alert = {
      id: Date.now(),
      type,
      detail,
      timestamp: new Date()
    };

    this.alerts.unshift(alert);

    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(0, 50);
    }

    this.renderAlerts();
  }

  updateStats() {
    const elements = {
      'threats-detected': this.stats.threatsDetected,
      'threats-blocked': this.stats.threatsBlocked,
      'false-positives': this.stats.falsePositives,
      'uptime': this.calculateUptime()
    };

    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value.toString();
      }
    });
  }

  calculateUptime() {
    // Calculate uptime percentage
    const totalTime = Date.now() - window.performance.timing.navigationStart;
    const downtime = this.stats.responseTime;
    const uptimePercent = ((totalTime - downtime) / totalTime * 100).toFixed(2);
    return `${uptimePercent}%`;
  }

  startMetricsCollection() {
    setInterval(() => {
      // Collect performance metrics
      this.collectMetrics();
    }, 5000);
  }

  collectMetrics() {
    if (window.performance && window.performance.memory) {
      const memory = window.performance.memory;
      this.updateMemoryUsage(memory.usedJSHeapSize, memory.totalJSHeapSize);
    }
  }

  updateMemoryUsage(used, total) {
    const element = document.getElementById('memory-usage');
    if (element) {
      const percent = ((used / total) * 100).toFixed(1);
      element.textContent = `${percent}%`;
    }
  }

  renderDashboard() {
    const dashboard = document.createElement('div');
    dashboard.id = 'security-dashboard';
    dashboard.innerHTML = `
      <div class="dashboard-header">
        <h3>🛡️ Core Developer Security Dashboard</h3>
        <div class="dashboard-controls">
          <button id="export-logs">Export Logs</button>
          <button id="clear-alerts">Clear Alerts</button>
        </div>
      </div>

      <div class="dashboard-stats">
        <div class="stat-card">
          <h4>Threats Detected</h4>
          <span id="threats-detected" class="stat-value">0</span>
        </div>
        <div class="stat-card">
          <h4>Threats Blocked</h4>
          <span id="threats-blocked" class="stat-value">0</span>
        </div>
        <div class="stat-card">
          <h4>False Positives</h4>
          <span id="false-positives" class="stat-value">0</span>
        </div>
        <div class="stat-card">
          <h4>Uptime</h4>
          <span id="uptime" class="stat-value">100%</span>
        </div>
        <div class="stat-card">
          <h4>Memory Usage</h4>
          <span id="memory-usage" class="stat-value">0%</span>
        </div>
      </div>

      <div class="dashboard-alerts">
        <h4>Recent Alerts</h4>
        <div id="alerts-container"></div>
      </div>
    `;

    document.body.appendChild(dashboard);

    // Add event listeners
    document.getElementById('export-logs').addEventListener('click', () => {
      this.exportLogs();
    });

    document.getElementById('clear-alerts').addEventListener('click', () => {
      this.clearAlerts();
    });
  }

  renderAlerts() {
    const container = document.getElementById('alerts-container');
    if (!container) return;

    container.innerHTML = this.alerts.map(alert => `
      <div class="alert alert-${alert.type}">
        <span class="alert-time">${alert.timestamp.toLocaleTimeString()}</span>
        <span class="alert-message">${this.formatAlertMessage(alert)}</span>
      </div>
    `).join('');
  }

  formatAlertMessage(alert) {
    switch (alert.type) {
      case 'threat':
        return `Threat detected: ${alert.detail.type} (${alert.detail.severity})`;
      case 'blocked':
        return `Threat blocked: ${alert.detail.type}`;
      case 'recovery':
        return `Recovery completed: ${alert.detail.reason}`;
      default:
        return 'Unknown alert';
    }
  }

  exportLogs() {
    const logs = this.shield.getThreatLog();
    const csv = this.convertToCSV(logs);

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `security-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }

  convertToCSV(logs) {
    const headers = ['Timestamp', 'Type', 'Severity', 'Description', 'Blocked', 'Source'];
    const rows = logs.map(log => [
      log.timestamp.toISOString(),
      log.type,
      log.severity,
      log.description,
      log.blocked,
      log.source || ''
    ]);

    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
  }

  clearAlerts() {
    this.alerts = [];
    this.renderAlerts();
  }
}

// Initialize security dashboard
const dashboard = new SecurityDashboard();
```