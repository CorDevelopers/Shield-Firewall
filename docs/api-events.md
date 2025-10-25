# Events

Core Developer emits custom events that you can listen for to monitor protection activity and threats.

## Event Types

### Threat Detection Events

#### `shield:threat-detected`
Fired when a potential threat is detected.

```javascript
document.addEventListener('shield:threat-detected', (event) => {
  const threat = event.detail;
  console.log('Threat detected:', {
    type: threat.type,
    severity: threat.severity,
    description: threat.description,
    source: threat.source,
    timestamp: threat.timestamp
  });

  // Handle threat detection
  handleThreat(threat);
});
```

#### `shield:threat-blocked`
Fired when a threat is successfully blocked.

```javascript
document.addEventListener('shield:threat-blocked', (event) => {
  const threat = event.detail;
  console.log('Threat blocked:', threat.type);

  // Log blocked threat
  logBlockedThreat(threat);

  // Update UI
  updateThreatCounter();
});
```

### Protection Status Events

#### `shield:protection-started`
Fired when protection systems are activated.

```javascript
document.addEventListener('shield:protection-started', (event) => {
  console.log('Core Developer protection activated');
  updateUIProtectionStatus(true);
});
```

#### `shield:protection-stopped`
Fired when protection systems are deactivated.

```javascript
document.addEventListener('shield:protection-stopped', (event) => {
  console.log('Core Developer protection deactivated');
  updateUIProtectionStatus(false);
});
```

### Configuration Events

#### `shield:config-updated`
Fired when configuration is successfully updated.

```javascript
document.addEventListener('shield:config-updated', (event) => {
  const newConfig = event.detail;
  console.log('Configuration updated:', newConfig);
  updateUIConfig(newConfig);
});
```

#### `shield:config-error`
Fired when configuration update fails.

```javascript
document.addEventListener('shield:config-error', (event) => {
  const error = event.detail;
  console.error('Configuration error:', error.message);
  showConfigError(error);
});
```

### Recovery Events

#### `shield:recovery-initiated`
Fired when auto-recovery process begins.

```javascript
document.addEventListener('shield:recovery-initiated', (event) => {
  const recovery = event.detail;
  console.log('Recovery initiated for:', recovery.reason);
  showRecoveryNotification(recovery);
});
```

#### `shield:recovery-completed`
Fired when auto-recovery process completes.

```javascript
document.addEventListener('shield:recovery-completed', (event) => {
  const recovery = event.detail;
  console.log('Recovery completed:', recovery.success);
  hideRecoveryNotification();
});
```

## Event Detail Objects

### Threat Event Detail

```typescript
interface ThreatEventDetail {
  id: string;
  type: 'xss' | 'injection' | 'csrf' | 'crypto-mining' | 'behavior' | 'network' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  source?: string;
  userAgent?: string;
  url?: string;
  timestamp: Date;
  blocked: boolean;
  metadata?: Record<string, any>;
}
```

### Configuration Event Detail

```typescript
interface ConfigEventDetail {
  protectionLevel: string;
  features: Record<string, boolean>;
  threatDetection: {
    sensitivity: number;
    customPatterns: string[];
  };
  logging: {
    level: string;
    maxEntries: number;
  };
}
```

### Recovery Event Detail

```typescript
interface RecoveryEventDetail {
  reason: string;
  type: 'dom' | 'network' | 'behavior';
  success: boolean;
  timestamp: Date;
  affectedElements?: number;
  error?: string;
}
```

## Event Handling Examples

### Comprehensive Threat Monitoring

```javascript
class ThreatMonitor {
  constructor() {
    this.threats = [];
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Threat detection
    document.addEventListener('shield:threat-detected', (e) => {
      this.handleThreatDetected(e.detail);
    });

    // Threat blocking
    document.addEventListener('shield:threat-blocked', (e) => {
      this.handleThreatBlocked(e.detail);
    });

    // Recovery events
    document.addEventListener('shield:recovery-initiated', (e) => {
      this.handleRecoveryStart(e.detail);
    });

    document.addEventListener('shield:recovery-completed', (e) => {
      this.handleRecoveryComplete(e.detail);
    });
  }

  handleThreatDetected(threat) {
    this.threats.push(threat);
    this.updateDashboard(threat);
    this.sendAlert(threat);
  }

  handleThreatBlocked(threat) {
    console.log(`Blocked ${threat.type} threat from ${threat.source}`);
  }

  handleRecoveryStart(recovery) {
    console.log(`Starting recovery: ${recovery.reason}`);
  }

  handleRecoveryComplete(recovery) {
    if (recovery.success) {
      console.log('Recovery completed successfully');
    } else {
      console.error('Recovery failed:', recovery.error);
    }
  }

  updateDashboard(threat) {
    // Update UI with threat information
  }

  sendAlert(threat) {
    // Send alert to monitoring system
  }
}

// Initialize monitor
const monitor = new ThreatMonitor();
```

### Real-time Dashboard Integration

```javascript
class SecurityDashboard {
  constructor() {
    this.stats = {
      threatsDetected: 0,
      threatsBlocked: 0,
      recoveries: 0
    };
    this.setupDashboard();
  }

  setupDashboard() {
    document.addEventListener('shield:threat-detected', () => {
      this.stats.threatsDetected++;
      this.updateStats();
    });

    document.addEventListener('shield:threat-blocked', () => {
      this.stats.threatsBlocked++;
      this.updateStats();
    });

    document.addEventListener('shield:recovery-completed', (e) => {
      if (e.detail.success) {
        this.stats.recoveries++;
        this.updateStats();
      }
    });
  }

  updateStats() {
    document.getElementById('threats-detected').textContent = this.stats.threatsDetected;
    document.getElementById('threats-blocked').textContent = this.stats.threatsBlocked;
    document.getElementById('recoveries').textContent = this.stats.recoveries;
  }
}

// Initialize dashboard
const dashboard = new SecurityDashboard();
```

## Best Practices

### Event Listener Management

```javascript
class SecureApp {
  constructor() {
    this.eventListeners = [];
    this.setupSecurity();
  }

  setupSecurity() {
    // Store references to remove later
    this.addEventListener('shield:threat-detected', this.handleThreat.bind(this));
    this.addEventListener('shield:protection-started', this.handleProtectionStart.bind(this));
  }

  addEventListener(event, handler) {
    document.addEventListener(event, handler);
    this.eventListeners.push({ event, handler });
  }

  destroy() {
    // Clean up event listeners
    this.eventListeners.forEach(({ event, handler }) => {
      document.removeEventListener(event, handler);
    });
    this.eventListeners = [];
  }
}
```

### Error Handling

```javascript
document.addEventListener('shield:config-error', (event) => {
  const error = event.detail;

  // Log error
  console.error('Core Developer configuration error:', error);

  // Show user-friendly message
  showErrorToast('Security configuration failed. Using default settings.');

  // Attempt recovery
  setTimeout(() => {
    location.reload();
  }, 5000);
});
```