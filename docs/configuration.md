# Configuration Guide

## Overview

Core Developer offers extensive configuration options to customize protection behavior for your specific use case. This guide covers all available configuration options and best practices.

## Basic Configuration

### Protection Levels

Core Developer provides four predefined protection levels:

```javascript
const shield = new ShieldFirewall();

// Basic protection (minimal performance impact)
await shield.configure({
  protectionLevel: 'basic'
});

// Balanced protection (recommended for most applications)
await shield.configure({
  protectionLevel: 'balanced'
});

// Strict protection (high security)
await shield.configure({
  protectionLevel: 'strict'
});

// Maximum protection (paranoid security)
await shield.configure({
  protectionLevel: 'maximum'
});
```

### Feature Selection

Enable or disable specific protection features:

```javascript
await shield.configure({
  features: {
    domProtection: true,        // Prevent DOM-based attacks
    networkInterception: true,  // Monitor HTTP requests
    behaviorAnalysis: true,     // AI behavioral analysis
    predictiveDetection: true,  // ML threat prediction
    autoRecovery: true,         // Automatic recovery
    realTimeMonitoring: true    // Live monitoring dashboard
  }
});
```

## Advanced Configuration

### Threat Detection Settings

```javascript
await shield.configure({
  threatDetection: {
    sensitivity: 0.8,           // 0.0 (permissive) to 1.0 (strict)
    customPatterns: [           // Custom regex patterns
      'script.*alert',
      'javascript:',
      'onerror.*eval',
      /dangerous-pattern/i
    ],
    anomalyThreshold: 0.7,      // Behavioral anomaly sensitivity
    maxThreatsPerMinute: 10     // Rate limiting
  }
});
```

### Network Rules

```javascript
await shield.configure({
  networkRules: {
    blockSuspiciousUrls: true,
    allowedDomains: [
      'trusted-api.com',
      'cdn.example.com'
    ],
    blockedDomains: [
      'malicious-site.com'
    ],
    blockDataExfiltration: true,
    maxRequestsPerMinute: 100
  }
});
```

### Behavioral Analysis

```javascript
await shield.configure({
  behavioralAnalysis: {
    enabled: true,
    patterns: {
      maxClicksPerSecond: 10,
      maxFormSubmissionsPerMinute: 5,
      maxNavigationChangesPerMinute: 20,
      suspiciousPatterns: [
        'rapid-clicking',
        'form-spamming',
        'navigation-loops'
      ]
    },
    learningPeriod: 300000  // 5 minutes in milliseconds
  }
});
```

### Logging Configuration

```javascript
await shield.configure({
  logging: {
    level: 'standard',          // 'none', 'standard', 'detailed'
    maxEntries: 1000,           // Maximum log entries to keep
    persistLogs: true,          // Save logs to localStorage
    remoteLogging: {            // Send logs to remote server
      enabled: false,
      endpoint: 'https://logs.example.com/api/security',
      apiKey: 'your-api-key'
    }
  }
});
```

## Environment-Specific Configuration

### Development Environment

```javascript
// Relaxed settings for development
await shield.configure({
  protectionLevel: 'basic',
  logging: {
    level: 'detailed'
  },
  threatDetection: {
    sensitivity: 0.3  // More permissive
  }
});
```

### Production Environment

```javascript
// Strict settings for production
await shield.configure({
  protectionLevel: 'strict',
  features: {
    realTimeMonitoring: false  // Disable for performance
  },
  logging: {
    level: 'standard',
    remoteLogging: {
      enabled: true,
      endpoint: 'https://security-logs.yourcompany.com'
    }
  }
});
```

## Framework-Specific Configuration

### React Applications

```javascript
import { useEffect } from 'react';
import { ShieldFirewall } from 'shield-firewall';

function App() {
  useEffect(() => {
    const initShield = async () => {
      const shield = new ShieldFirewall();

      await shield.configure({
        protectionLevel: 'strict',
        // React-specific patterns
        threatDetection: {
          customPatterns: [
            'dangerouslySetInnerHTML',
            'eval',
            'Function.*constructor'
          ]
        }
      });

      await shield.initialize();
      await shield.start();
    };

    initShield();
  }, []);

  return <div>Your React App</div>;
}
```

### Vue.js Applications

```javascript
import { createApp } from 'vue';
import { ShieldFirewall } from 'shield-firewall';

const app = createApp(App);

app.mount('#app');

// Initialize SHIELD.js after Vue
const shield = new ShieldFirewall();
await shield.configure({
  protectionLevel: 'strict',
  // Vue-specific patterns
  threatDetection: {
    customPatterns: [
      'v-html.*script',
      'eval',
      '\\$\\{.*\\}'
    ]
  }
});

await shield.initialize();
await shield.start();
```

### Angular Applications

```javascript
import { Component, OnInit } from '@angular/core';
import { ShieldFirewall } from 'shield-firewall';

@Component({
  selector: 'app-root',
  template: `<div>Your Angular App</div>`
})
export class AppComponent implements OnInit {
  async ngOnInit() {
    const shield = new ShieldFirewall();

    await shield.configure({
      protectionLevel: 'strict',
      // Angular-specific patterns
      threatDetection: {
        customPatterns: [
          'innerHTML',
          'bypassSecurityTrust',
          'eval'
        ]
      }
    });

    await shield.initialize();
    await shield.start();
  }
}
```

## Performance Tuning

### High-Traffic Applications

```javascript
await shield.configure({
  protectionLevel: 'balanced',  // Not 'maximum'
  features: {
    realTimeMonitoring: false,  // Disable dashboard
    predictiveDetection: false  // Disable ML features
  },
  threatDetection: {
    sensitivity: 0.6  // Slightly more permissive
  },
  logging: {
    level: 'standard'  // Not 'detailed'
  }
});
```

### Low-Power Devices

```javascript
await shield.configure({
  protectionLevel: 'basic',
  features: {
    behaviorAnalysis: false,    // Disable AI features
    predictiveDetection: false,
    realTimeMonitoring: false
  },
  threatDetection: {
    sensitivity: 0.5
  }
});
```

## Security Best Practices

### Defense in Depth

```javascript
// Combine with server-side protection
await shield.configure({
  protectionLevel: 'maximum',
  features: {
    networkInterception: true,
    autoRecovery: true
  },
  threatDetection: {
    customPatterns: [
      // Application-specific threats
      'api.*token.*leak',
      'session.*hijack',
      'csrf.*token'
    ]
  }
});
```

### Regular Updates

```javascript
// Check for updates periodically
setInterval(async () => {
  const updateAvailable = await shield.checkForUpdates();
  if (updateAvailable) {
    console.log('SHIELD.js update available');
    // Handle update logic
  }
}, 24 * 60 * 60 * 1000); // Daily check
```

## Troubleshooting Configuration

### Configuration Validation

```javascript
try {
  await shield.configure(config);
  console.log('Configuration applied successfully');
} catch (error) {
  console.error('Configuration error:', error.message);
  // Fallback to default configuration
  await shield.configure({ protectionLevel: 'basic' });
}
```

### Debug Configuration

```javascript
await shield.configure({
  logging: {
    level: 'detailed',
    debug: true
  },
  // Temporarily relaxed for debugging
  threatDetection: {
    sensitivity: 0.3
  }
});
```

## Complete Configuration Example

```javascript
const productionConfig = {
  protectionLevel: 'strict',
  features: {
    domProtection: true,
    networkInterception: true,
    behaviorAnalysis: true,
    predictiveDetection: true,
    autoRecovery: true,
    realTimeMonitoring: false  // Disabled for performance
  },
  threatDetection: {
    sensitivity: 0.8,
    customPatterns: [
      'script.*alert',
      'javascript:',
      'onerror.*eval',
      'document\\.cookie',
      'localStorage.*token',
      'sessionStorage.*secret'
    ],
    anomalyThreshold: 0.7,
    maxThreatsPerMinute: 20
  },
  networkRules: {
    blockSuspiciousUrls: true,
    allowedDomains: ['api.yourapp.com', 'cdn.yourapp.com'],
    blockDataExfiltration: true,
    maxRequestsPerMinute: 100
  },
  behavioralAnalysis: {
    enabled: true,
    patterns: {
      maxClicksPerSecond: 8,
      maxFormSubmissionsPerMinute: 3,
      maxNavigationChangesPerMinute: 15
    }
  },
  logging: {
    level: 'standard',
    maxEntries: 500,
    persistLogs: true,
    remoteLogging: {
      enabled: true,
      endpoint: 'https://security.yourapp.com/logs',
      apiKey: process.env.SECURITY_LOG_API_KEY
    }
  }
};

const shield = new ShieldFirewall();
await shield.configure(productionConfig);
await shield.initialize();
await shield.start();
```