# Quick Start

This guide will get you up and running with Core Developer in minutes.

## Minimal Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Protected App</title>
    <script src="https://cdn.jsdelivr.net/npm/shield-firewall@latest/dist/shield-firewall.min.js"></script>
</head>
<body>
    <h1>Welcome to my protected application</h1>
    <form id="contact-form">
        <input type="text" name="name" placeholder="Your name">
        <input type="email" name="email" placeholder="Your email">
        <textarea name="message" placeholder="Your message"></textarea>
        <button type="submit">Send</button>
    </form>

    <script>
        // Initialize Core Developer
        async function initSecurity() {
            const shield = new ShieldFirewall();

            await shield.configure({
                protectionLevel: 'balanced'
            });

            await shield.initialize();
            await shield.start();

            console.log('Protection active!');
        }

        initSecurity();
    </script>
</body>
</html>
```

## Step-by-Step Setup

### 1. Add Core Developer to your project

**Via CDN:**
```html
<script src="https://cdn.jsdelivr.net/npm/shield-firewall@latest/dist/shield-firewall.min.js"></script>
```

**Via NPM:**
```bash
npm install shield-firewall
```

```javascript
import { ShieldFirewall } from 'shield-firewall';
```

### 2. Create and configure

```javascript
// Create firewall instance
const shield = new ShieldFirewall();

// Configure for your needs
await shield.configure({
  protectionLevel: 'strict',
  features: {
    domProtection: true,      // Prevent DOM manipulation attacks
    networkInterception: true, // Monitor network requests
    behaviorAnalysis: true,   // Detect suspicious behavior
  }
});
```

### 3. Initialize and start

```javascript
// Initialize the firewall
await shield.initialize();

// Start protection
await shield.start();
```

## Testing Protection

Create a simple test to verify Core Developer is working:

```javascript
// Test XSS protection
function testXSS() {
    const testDiv = document.createElement('div');
    testDiv.innerHTML = '<script>alert("XSS Attack!")</script>';
    document.body.appendChild(testDiv);
}

// Test after Core Developer initialization
setTimeout(() => {
    testXSS(); // This should be blocked
}, 1000);
```

## Common Patterns

### Protecting a React App

```javascript
import React, { useEffect } from 'react';
import { ShieldFirewall } from 'shield-firewall';

function App() {
  useEffect(() => {
    const initShield = async () => {
      const shield = new ShieldFirewall();
      await shield.configure({ protectionLevel: 'strict' });
      await shield.initialize();
      await shield.start();
    };

    initShield();
  }, []);

  return (
    <div className="App">
      <h1>Protected React App</h1>
      {/* Your app content */}
    </div>
  );
}
```

### Protecting an API Client

```javascript
import { ShieldFirewall } from 'shield-firewall';

class ApiClient {
  constructor() {
    this.shield = new ShieldFirewall();
    this.init();
  }

  async init() {
    await this.shield.configure({
      features: {
        networkInterception: true
      },
      threatDetection: {
        customPatterns: ['api.*token', 'auth.*secret']
      }
    });

    await this.shield.initialize();
    await this.shield.start();
  }

  async request(url, options = {}) {
    // SHIELD.js will automatically monitor this request
    return fetch(url, options);
  }
}
```

### E-commerce Protection

```javascript
// Protect checkout forms
const shield = new ShieldFirewall();

await shield.configure({
  protectionLevel: 'maximum',
  features: {
    domProtection: true,
    behaviorAnalysis: true,
    autoRecovery: true
  },
  threatDetection: {
    sensitivity: 0.9
  }
});

await shield.initialize();
await shield.start();

// Monitor checkout form specifically
const checkoutForm = document.getElementById('checkout-form');
shield.scan(checkoutForm);
```

## Troubleshooting

### Protection not activating

Check the browser console for errors. Common issues:

- **Network error**: Ensure CDN URL is accessible
- **Configuration error**: Validate configuration object syntax
- **Browser compatibility**: Check [supported browsers](../)

### False positives

If legitimate actions are being blocked:

```javascript
// Add exceptions for legitimate patterns
await shield.configure({
  threatDetection: {
    customPatterns: [
      // Exclude legitimate patterns
      '!legitimate-action',
      '!trusted-domain.com'
    ]
  }
});
```

### Performance issues

For better performance:

```javascript
await shield.configure({
  protectionLevel: 'balanced', // Instead of 'maximum'
  features: {
    // Disable non-essential features
    realTimeMonitoring: false
  }
});
```

## Next Steps

- [Configuration Guide](./configuration) - Advanced options
- [API Reference](./api-reference) - Complete API
- [Examples](./examples) - More code examples