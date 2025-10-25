# SHIELD.js Interactive Demo

This interactive demo showcases SHIELD.js AI-powered client-side web application firewall in action.

## Features

- **Real-time Protection Dashboard**: Monitor firewall status, threats blocked, and system uptime
- **Interactive Configuration**: Adjust protection levels, sensitivity, and feature toggles
- **Attack Simulator**: Test various attack vectors including XSS, DOM manipulation, network attacks, and behavioral analysis
- **Custom Attack Testing**: Enter your own attack payloads to test protection
- **Content Validation**: Test content against SHIELD.js threat detection
- **Live Threat Log**: View real-time threat detection and blocking events

## Getting Started

1. Ensure SHIELD.js is built: `npm run build`
2. Open `demo/index.html` in a modern web browser
3. Configure protection settings as desired
4. Click "Start Protection" to activate SHIELD.js
5. Use the attack simulator to test various threats
6. Monitor the threat log and dashboard for real-time feedback

## Demo Features

### Protection Configuration
- **Protection Levels**: Basic, Balanced, Strict, Maximum
- **Sensitivity**: Adjust threat detection sensitivity (0.0 - 1.0)
- **Feature Toggles**: Enable/disable DOM protection, network interception, behavior analysis, and auto-recovery

### Attack Simulation
- **XSS Attack**: Injects malicious script tags
- **DOM Manipulation**: Attempts unauthorized DOM changes
- **Network Attack**: Makes suspicious HTTP requests
- **Behavior Attack**: Simulates rapid clicking/bot behavior
- **Custom Attack**: Execute user-defined attack payloads

### Monitoring
- **Status Dashboard**: Real-time protection status and metrics
- **Threat Log**: Chronological list of detected and blocked threats
- **Content Validation**: Test arbitrary content for threats

## Browser Support

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## Security Note

This demo is for educational purposes. The attack simulations are controlled and safe, but always test security measures in isolated environments.