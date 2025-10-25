---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Core Developer"
  text: "AI-Powered Client-Side WAF"
  tagline: Revolutionary protection against advanced web threats
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/yourusername/shield-js

features:
  - title: AI-Powered Protection
    details: Machine learning algorithms analyze user behavior and detect anomalies in real-time
  - title: Zero-Knowledge Security
    details: All processing happens client-side with no data transmission or external dependencies
  - title: Comprehensive Coverage
    details: Protects against XSS, CSRF, injection attacks, crypto mining, and emerging threats
  - title: Performance Optimized
    details: Minimal footprint (~50KB gzipped) with Web Workers for optimal performance
  - title: Real-time Monitoring
    details: Live threat dashboard with detailed logging and attack pattern analysis
  - title: Auto-Recovery
    details: Automatic DOM restoration and threat quarantine with one-click recovery
---

## Quick Example

```javascript
import { ShieldFirewall } from 'shield-firewall';

// Initialize protection
const shield = new ShieldFirewall();
await shield.configure({
  protectionLevel: 'strict',
  features: {
    domProtection: true,
    networkInterception: true,
    behaviorAnalysis: true,
    predictiveDetection: true
  }
});

await shield.initialize();
await shield.start();

console.log('🛡️ Core Developer protection active');
```

## Why Core Developer?

Traditional web application firewalls only protect server-side endpoints. Core Developer provides **client-side protection** that:

- **Detects attacks before they reach your server**
- **Analyzes user behavior patterns** to identify bots and automated attacks
- **Provides real-time threat intelligence** without compromising privacy
- **Works alongside existing security measures** for comprehensive protection

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## License

MIT License - see [LICENSE](https://github.com/yourusername/shield-js/blob/main/LICENSE) for details.

