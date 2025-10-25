# Getting Started

## Installation

SHIELD.js can be installed via npm or used directly via CDN.

### NPM Installation

```bash
npm install shield-firewall
```

### CDN Usage

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/shield-firewall@latest/dist/shield-firewall.min.js"></script>
</head>
<body>
  <!-- Your application code -->
</body>
</html>
```

## Basic Setup

### 1. Import SHIELD.js

```javascript
// ES6 modules
import { ShieldFirewall } from 'shield-firewall';

// CommonJS
const { ShieldFirewall } = require('shield-firewall');

// CDN (global variable)
const ShieldFirewall = window.ShieldFirewall;
```

### 2. Initialize Protection

```javascript
// Create firewall instance
const shield = new ShieldFirewall();

// Configure protection settings
await shield.configure({
  protectionLevel: 'strict',
  features: {
    domProtection: true,
    networkInterception: true,
    behaviorAnalysis: true
  }
});

// Initialize and start protection
await shield.initialize();
await shield.start();

console.log('🛡️ SHIELD.js protection active');
```

### 3. Verify Protection

Open your browser's developer console and check for the SHIELD.js initialization message. You should also see a small dashboard in the top-right corner of your page.

## Configuration Levels

SHIELD.js offers four protection levels:

### Basic
Essential protection with minimal performance impact.
- XSS prevention
- Basic DOM monitoring
- Network request logging

### Balanced (Recommended)
Balanced security and performance.
- All Basic features
- Behavioral analysis
- Threat pattern matching

### Strict
High security with moderate performance impact.
- All Balanced features
- Predictive threat detection
- Advanced pattern matching
- Auto-recovery enabled

### Maximum
Maximum security with potential performance trade-offs.
- All Strict features
- Paranoid threat detection
- Real-time monitoring
- Comprehensive logging

## Next Steps

- [Quick Start Guide](./quick-start) - Learn the API
- [Configuration](./configuration) - Advanced setup options
- [Examples](./examples) - Code examples
- [API Reference](./api-reference) - Complete API documentation