# SHIELD.js Usage Examples

This directory contains practical examples of how to integrate SHIELD.js into various types of web applications.

## Table of Contents
- [Basic Setup](#basic-setup)
- [E-commerce Protection](#e-commerce-protection)
- [API Security](#api-security)
- [Gaming Anti-Cheat](#gaming-anti-cheat)
- [Content Management](#content-management)
- [Financial Applications](#financial-applications)
- [Real-time Applications](#real-time-applications)
- [Custom Integrations](#custom-integrations)

## Basic Setup

### Minimal Integration

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Protected App</title>
</head>
<body>
    <h1>Welcome to my application</h1>
    <form id="contact-form">
        <input type="text" name="name" placeholder="Your name">
        <input type="email" name="email" placeholder="Your email">
        <textarea name="message" placeholder="Your message"></textarea>
        <button type="submit">Send</button>
    </form>

    <script type="module">
        import ShieldFirewall from './dist/shield-firewall.min.js';

        // Initialize with default settings
        const shield = new ShieldFirewall();
        await shield.initialize();
        await shield.start();

        console.log('SHIELD.js protection active!');
    </script>
</body>
</html>
```

### Advanced Configuration

```javascript
import ShieldFirewall from 'shield-js';

async function initializeProtection() {
    const shield = new ShieldFirewall();

    // Configure for high-security environment
    await shield.configure({
        protectionLevel: 'strict',
        features: {
            domProtection: true,
            networkInterception: true,
            behaviorAnalysis: true,
            predictiveDetection: true,
            autoRecovery: true
        },
        threatDetection: {
            sensitivity: 0.8,
            blockUnknown: true,
            customPatterns: [
                'internal.*api',
                'admin.*panel',
                'sensitive.*data'
            ]
        },
        privacy: {
            anonymizeLogs: true,
            telemetry: false,
            dataRetention: 30
        },
        ui: {
            showDashboard: true,
            dashboardPosition: 'top-right',
            theme: 'dark'
        }
    });

    await shield.initialize();
    await shield.start();

    return shield;
}

// Initialize protection
const shield = await initializeProtection();

// Monitor protection status
setInterval(() => {
    const status = shield.getStatus();
    console.log('Protection status:', status);
}, 30000);
```

## E-commerce Protection

### Checkout Form Protection

```javascript
class EcommerceProtection {
    constructor() {
        this.shield = new ShieldFirewall();
        this.checkoutForm = document.getElementById('checkout-form');
        this.paymentForm = document.getElementById('payment-form');
    }

    async initialize() {
        await this.shield.configure({
            protectionLevel: 'strict',
            features: {
                domProtection: true,
                networkInterception: true,
                behaviorAnalysis: true,
                predictiveDetection: true
            },
            threatDetection: {
                sensitivity: 0.9,
                customPatterns: [
                    'payment.*card',
                    'credit.*number',
                    'cvv|cvc',
                    'billing.*address'
                ]
            }
        });

        await this.shield.initialize();
        await this.shield.start();

        this.setupFormProtection();
        this.setupNetworkMonitoring();
    }

    setupFormProtection() {
        // Protect checkout form
        this.shield.scan(this.checkoutForm);

        // Monitor form inputs
        const inputs = this.checkoutForm.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.validateInput(input);
            });
        });

        // Protect payment form
        this.shield.scan(this.paymentForm);
    }

    setupNetworkMonitoring() {
        // Monitor payment API calls
        document.addEventListener('shield:threat-detected', (event) => {
            const threat = event.detail;
            if (threat.type === 'network' && threat.content.includes('/api/payment')) {
                this.handlePaymentThreat(threat);
            }
        });
    }

    validateInput(input) {
        const value = input.value;
        const scanResult = this.shield.scan(input);

        if (scanResult.threats.length > 0) {
            input.classList.add('threat-detected');
            this.showWarning('Suspicious input detected');
        } else {
            input.classList.remove('threat-detected');
        }
    }

    handlePaymentThreat(threat) {
        // Block the transaction
        this.showAlert('Payment blocked due to security threat');

        // Log for review
        console.error('Payment threat blocked:', threat);

        // Create recovery snapshot
        const snapshotId = this.shield.createSnapshot('payment-blocked');
        this.lastSafeSnapshot = snapshotId;
    }

    showWarning(message) {
        const warning = document.createElement('div');
        warning.className = 'security-warning';
        warning.textContent = message;
        document.body.appendChild(warning);

        setTimeout(() => warning.remove(), 5000);
    }

    showAlert(message) {
        alert(`Security Alert: ${message}`);
    }
}

// Initialize e-commerce protection
const protection = new EcommerceProtection();
await protection.initialize();
```

### Product Review Protection

```javascript
class ReviewProtection {
    constructor() {
        this.shield = new ShieldFirewall();
        this.reviewForm = document.getElementById('review-form');
    }

    async initialize() {
        await this.shield.configure({
            protectionLevel: 'balanced',
            features: {
                domProtection: true,
                behaviorAnalysis: true
            },
            threatDetection: {
                customPatterns: [
                    'spam.*content',
                    'malicious.*link',
                    'inappropriate.*language'
                ]
            }
        });

        await this.shield.initialize();
        await this.shield.start();

        this.monitorReviews();
    }

    monitorReviews() {
        this.reviewForm.addEventListener('submit', async (event) => {
            const reviewText = this.reviewForm.querySelector('textarea').value;
            const scanResult = await this.shield.scan(this.reviewForm);

            if (scanResult.threats.length > 0) {
                event.preventDefault();
                this.showReviewWarning(scanResult.threats);
            }
        });
    }

    showReviewWarning(threats) {
        const modal = document.createElement('div');
        modal.className = 'review-warning-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Review Contains Potential Issues</h3>
                <ul>
                    ${threats.map(threat => `<li>${threat.type}: ${threat.severity}</li>`).join('')}
                </ul>
                <button onclick="this.closest('.modal').remove()">Edit Review</button>
                <button onclick="this.closest('.modal').remove(); submitReview()">Submit Anyway</button>
            </div>
        `;
        document.body.appendChild(modal);
    }
}
```

## API Security

### REST API Protection

```javascript
class APIProtection {
    constructor(apiEndpoints) {
        this.shield = new ShieldFirewall();
        this.endpoints = apiEndpoints;
    }

    async initialize() {
        await this.shield.configure({
            protectionLevel: 'strict',
            features: {
                networkInterception: true,
                predictiveDetection: true
            },
            threatDetection: {
                sensitivity: 0.85,
                customPatterns: this.endpoints.map(ep => ep.pattern)
            }
        });

        await this.shield.initialize();
        await this.shield.start();

        this.setupAPIInterception();
    }

    setupAPIInterception() {
        // Intercept all API calls
        document.addEventListener('shield:network-request', (event) => {
            const request = event.detail;
            this.validateAPIRequest(request);
        });
    }

    validateAPIRequest(request) {
        // Check if request is to protected endpoint
        const endpoint = this.endpoints.find(ep =>
            request.url.includes(ep.path)
        );

        if (endpoint) {
            // Validate request against endpoint rules
            const violations = this.checkEndpointRules(request, endpoint);

            if (violations.length > 0) {
                this.blockRequest(request, violations);
            }
        }
    }

    checkEndpointRules(request, endpoint) {
        const violations = [];

        // Check method
        if (endpoint.methods && !endpoint.methods.includes(request.method)) {
            violations.push('Invalid HTTP method');
        }

        // Check content type
        if (endpoint.contentType && request.headers['content-type'] !== endpoint.contentType) {
            violations.push('Invalid content type');
        }

        // Check request size
        if (endpoint.maxSize && request.body && request.body.length > endpoint.maxSize) {
            violations.push('Request too large');
        }

        // Check rate limits
        if (this.isRateLimited(request.url)) {
            violations.push('Rate limit exceeded');
        }

        return violations;
    }

    blockRequest(request, violations) {
        // Prevent the request
        request.blocked = true;

        // Log the violation
        this.shield.logger.warn('API request blocked', {
            url: request.url,
            violations,
            ip: request.ip,
            userAgent: request.userAgent
        });

        // Show user feedback
        this.showAPIBlockMessage(violations);
    }

    showAPIBlockMessage(violations) {
        const message = `API request blocked: ${violations.join(', ')}`;
        this.shield.alerts.show(message, 'error');
    }

    isRateLimited(url) {
        // Implement rate limiting logic
        const key = `rate_limit_${url}`;
        const now = Date.now();
        const window = 60000; // 1 minute
        const limit = 100; // 100 requests per minute

        // This would typically use a more sophisticated rate limiting algorithm
        return false; // Placeholder
    }
}

// Define protected endpoints
const endpoints = [
    {
        path: '/api/user',
        methods: ['GET', 'POST', 'PUT'],
        contentType: 'application/json',
        maxSize: 1024 * 10 // 10KB
    },
    {
        path: '/api/payment',
        methods: ['POST'],
        contentType: 'application/json',
        maxSize: 1024 // 1KB
    }
];

const apiProtection = new APIProtection(endpoints);
await apiProtection.initialize();
```

### GraphQL API Protection

```javascript
class GraphQLProtection {
    constructor() {
        this.shield = new ShieldFirewall();
    }

    async initialize() {
        await this.shield.configure({
            protectionLevel: 'strict',
            features: {
                networkInterception: true,
                predictiveDetection: true
            },
            threatDetection: {
                customPatterns: [
                    'query.*introspection',
                    '__schema',
                    '__type',
                    'mutation.*delete',
                    'fragment.*on.*User'
                ]
            }
        });

        await this.shield.initialize();
        await this.shield.start();

        this.setupGraphQLInterception();
    }

    setupGraphQLInterception() {
        document.addEventListener('shield:network-request', (event) => {
            const request = event.detail;
            if (this.isGraphQLRequest(request)) {
                this.validateGraphQLRequest(request);
            }
        });
    }

    isGraphQLRequest(request) {
        return request.url.includes('/graphql') ||
               request.headers['content-type']?.includes('application/graphql');
    }

    validateGraphQLRequest(request) {
        try {
            const query = this.extractGraphQLQuery(request);

            // Check for dangerous operations
            if (this.containsDangerousOperations(query)) {
                this.blockGraphQLRequest(request, 'Dangerous GraphQL operation');
                return;
            }

            // Check query complexity
            const complexity = this.calculateQueryComplexity(query);
            if (complexity > 1000) {
                this.blockGraphQLRequest(request, 'Query too complex');
                return;
            }

            // Check for introspection queries in production
            if (this.isProduction && this.isIntrospectionQuery(query)) {
                this.blockGraphQLRequest(request, 'Introspection not allowed');
                return;
            }

        } catch (error) {
            this.blockGraphQLRequest(request, 'Invalid GraphQL query');
        }
    }

    extractGraphQLQuery(request) {
        if (request.body) {
            const body = JSON.parse(request.body);
            return body.query || '';
        }
        return '';
    }

    containsDangerousOperations(query) {
        const dangerousPatterns = [
            /mutation.*delete/i,
            /drop/i,
            /alter/i,
            /create/i,
            /__schema/i,
            /__type/i
        ];

        return dangerousPatterns.some(pattern => pattern.test(query));
    }

    calculateQueryComplexity(query) {
        // Simple complexity calculation based on field count
        const fieldMatches = query.match(/\w+(?=\s*\{)/g) || [];
        return fieldMatches.length;
    }

    isIntrospectionQuery(query) {
        return /__schema|__type/i.test(query);
    }

    blockGraphQLRequest(request, reason) {
        request.blocked = true;
        this.shield.logger.warn('GraphQL request blocked', { reason, url: request.url });
        this.shield.alerts.show(`GraphQL request blocked: ${reason}`, 'warning');
    }
}
```

## Gaming Anti-Cheat

### Game State Protection

```javascript
class GameAntiCheat {
    constructor(gameEngine) {
        this.shield = new ShieldFirewall();
        this.gameEngine = gameEngine;
        this.playerActions = [];
        this.lastSnapshot = null;
    }

    async initialize() {
        await this.shield.configure({
            protectionLevel: 'paranoid',
            features: {
                behaviorAnalysis: true,
                domProtection: true,
                networkInterception: true,
                predictiveDetection: true
            },
            threatDetection: {
                sensitivity: 0.95,
                blockUnknown: true,
                customPatterns: [
                    'cheat.*engine',
                    'speed.*hack',
                    'wall.*hack',
                    'aim.*bot',
                    'memory.*modification'
                ]
            }
        });

        await this.shield.initialize();
        await this.shield.start();

        this.setupGameMonitoring();
        this.createInitialSnapshot();
    }

    setupGameMonitoring() {
        // Monitor DOM for cheat overlays
        this.shield.domProtector.onMutation = (mutations) => {
            this.checkForCheatElements(mutations);
        };

        // Monitor network for suspicious communications
        document.addEventListener('shield:network-request', (event) => {
            this.validateGameNetworkRequest(event.detail);
        });

        // Monitor behavior patterns
        document.addEventListener('shield:behavior-anomaly', (event) => {
            this.handleBehaviorAnomaly(event.detail);
        });
    }

    checkForCheatElements(mutations) {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.scanForCheatElements(node);
                    }
                });
            }
        });
    }

    scanForCheatElements(element) {
        // Check for known cheat UI elements
        const cheatSelectors = [
            '[class*="cheat"]',
            '[id*="hack"]',
            '[class*="aimbot"]',
            '[id*="speedhack"]',
            'canvas[style*="display: none"]' // Hidden canvases for bots
        ];

        cheatSelectors.forEach(selector => {
            const matches = element.querySelectorAll(selector);
            matches.forEach(match => {
                this.flagCheatElement(match, selector);
            });
        });
    }

    flagCheatElement(element, reason) {
        this.shield.logger.warn('Cheat element detected', { reason, element: element.outerHTML });

        // Quarantine the element
        const quarantineId = this.shield.recoveryEngine.quarantineElement(element, 'cheat-detected');

        // Alert the game
        this.gameEngine.onCheatDetected({
            type: 'dom_manipulation',
            element: quarantineId,
            reason
        });
    }

    validateGameNetworkRequest(request) {
        // Check for unauthorized game server communications
        if (request.url.includes('cheat-server.com') ||
            request.url.includes('hack-forum.net')) {
            this.blockCheatRequest(request);
        }

        // Check for memory scanning tools
        if (request.url.includes('process-memory') ||
            request.headers['user-agent']?.includes('CheatEngine')) {
            this.blockCheatRequest(request);
        }
    }

    blockCheatRequest(request) {
        request.blocked = true;
        this.gameEngine.onCheatDetected({
            type: 'network_suspicious',
            url: request.url,
            reason: 'Unauthorized communication'
        });
    }

    handleBehaviorAnomaly(anomaly) {
        // Check if anomaly indicates cheating
        if (anomaly.confidence > 0.8) {
            const cheatIndicators = [
                'perfect_aim',
                'no_recoil',
                'speed_hack',
                'wall_hack'
            ];

            if (cheatIndicators.some(indicator => anomaly.patterns.includes(indicator))) {
                this.gameEngine.onCheatDetected({
                    type: 'behavior_cheat',
                    anomaly,
                    confidence: anomaly.confidence
                });
            }
        }
    }

    createInitialSnapshot() {
        this.lastSnapshot = this.shield.createSnapshot('game-start');
    }

    onGameStateChange() {
        // Create periodic snapshots for recovery
        const snapshotId = this.shield.createSnapshot(`game-state-${Date.now()}`);
        this.lastSnapshot = snapshotId;
    }

    onCheatDetected(cheatData) {
        // Immediate actions on cheat detection
        switch (cheatData.type) {
            case 'dom_manipulation':
                // Restore clean game state
                if (this.lastSnapshot) {
                    this.shield.restoreFromSnapshot(this.lastSnapshot);
                }
                break;

            case 'network_suspicious':
                // Disconnect suspicious connections
                this.gameEngine.disconnect();
                break;

            case 'behavior_cheat':
                // Log and potentially ban
                this.shield.logger.error('Cheat behavior detected', cheatData);
                break;
        }

        // Notify server for global ban consideration
        this.reportCheatToServer(cheatData);
    }

    reportCheatToServer(cheatData) {
        // Send anonymized cheat report to game server
        fetch('/api/report-cheat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: cheatData.type,
                timestamp: Date.now(),
                confidence: cheatData.confidence || 0
            })
        }).catch(err => {
            this.shield.logger.warn('Failed to report cheat to server', err);
        });
    }
}

// Game engine interface
class GameEngine {
    onCheatDetected(cheatData) {
        console.log('Cheat detected:', cheatData);
        // Implement game-specific cheat response
        // e.g., kick player, log to server, update UI
    }

    disconnect() {
        // Disconnect from game server
        console.log('Disconnecting due to security threat');
    }
}

// Initialize anti-cheat
const gameEngine = new GameEngine();
const antiCheat = new GameAntiCheat(gameEngine);
await antiCheat.initialize();
```

## Content Management

### Rich Text Editor Protection

```javascript
class CMSEditorProtection {
    constructor(editor) {
        this.shield = new ShieldFirewall();
        this.editor = editor;
    }

    async initialize() {
        await this.shield.configure({
            protectionLevel: 'balanced',
            features: {
                domProtection: true,
                predictiveDetection: true
            },
            threatDetection: {
                customPatterns: [
                    '<script',
                    'javascript:',
                    'onload=',
                    'onerror=',
                    '<iframe',
                    '<object',
                    '<embed'
                ]
            }
        });

        await this.shield.initialize();
        await this.shield.start();

        this.setupEditorProtection();
    }

    setupEditorProtection() {
        // Monitor editor content changes
        this.editor.on('change', () => {
            this.validateContent();
        });

        // Intercept paste events
        this.editor.on('paste', (event) => {
            this.validatePaste(event);
        });

        // Monitor HTML mode changes
        this.editor.on('mode-change', (mode) => {
            if (mode === 'html') {
                this.enableStrictHTMLValidation();
            }
        });
    }

    validateContent() {
        const content = this.editor.getContent();
        const scanResult = this.shield.scan(this.editor.getContainer());

        if (scanResult.threats.length > 0) {
            this.handleContentThreats(scanResult.threats);
        }
    }

    validatePaste(event) {
        const pastedContent = event.clipboardData.getData('text/html') ||
                             event.clipboardData.getData('text/plain');

        const scanResult = this.shield.threatDetector.analyzeContent(pastedContent);

        if (scanResult.score > 0.5) {
            event.preventDefault();
            this.showPasteWarning(scanResult);
        }
    }

    handleContentThreats(threats) {
        threats.forEach(threat => {
            switch (threat.type) {
                case 'xss':
                    this.sanitizeXSSContent(threat);
                    break;
                case 'script_injection':
                    this.removeInjectedScripts(threat);
                    break;
                default:
                    this.logContentThreat(threat);
            }
        });
    }

    sanitizeXSSContent(threat) {
        const content = this.editor.getContent();
        const sanitized = this.shield.domProtector.sanitizeHTML(content);
        this.editor.setContent(sanitized);

        this.showEditorWarning('Potentially dangerous content has been sanitized');
    }

    removeInjectedScripts(threat) {
        // Remove script tags and event handlers
        const content = this.editor.getContent();
        const cleaned = content
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/on\w+="[^"]*"/gi, '')
            .replace(/on\w+='[^']*'/gi, '');

        this.editor.setContent(cleaned);
        this.showEditorWarning('Scripts and event handlers have been removed');
    }

    enableStrictHTMLValidation() {
        // When in HTML mode, enable stricter validation
        this.editor.on('before-save', () => {
            const html = this.editor.getContent();
            const validation = this.validateHTML(html);

            if (!validation.valid) {
                this.showValidationErrors(validation.errors);
                return false; // Prevent save
            }
        });
    }

    validateHTML(html) {
        const errors = [];
        const threats = this.shield.threatDetector.analyzeContent(html);

        if (threats.score > 0.3) {
            errors.push('Content contains potential security threats');
        }

        // Check for nested script tags
        if (html.match(/<script[^>]*><script[^>]*>/i)) {
            errors.push('Nested script tags detected');
        }

        // Check for suspicious attributes
        const suspiciousAttrs = ['onload', 'onerror', 'onclick', 'onmouseover'];
        suspiciousAttrs.forEach(attr => {
            if (html.includes(attr + '=')) {
                errors.push(`Suspicious attribute "${attr}" found`);
            }
        });

        return {
            valid: errors.length === 0,
            errors
        };
    }

    showPasteWarning(scanResult) {
        const modal = this.createModal('Paste Warning',
            `The pasted content may contain threats (score: ${scanResult.score.toFixed(2)}). ` +
            'It has been blocked for security reasons.'
        );
        document.body.appendChild(modal);
    }

    showEditorWarning(message) {
        const warning = document.createElement('div');
        warning.className = 'editor-security-warning';
        warning.innerHTML = `
            <i class="warning-icon">Warning:</i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;

        this.editor.getContainer().appendChild(warning);

        setTimeout(() => {
            if (warning.parentElement) {
                warning.remove();
            }
        }, 10000);
    }

    showValidationErrors(errors) {
        const modal = this.createModal('Validation Errors',
            '<ul>' + errors.map(error => `<li>${error}</li>`).join('') + '</ul>'
        );
        document.body.appendChild(modal);
    }

    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'cms-security-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.closest('.modal').remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">${content}</div>
                <div class="modal-footer">
                    <button onclick="this.closest('.modal').remove()">Close</button>
                </div>
            </div>
        `;
        return modal;
    }

    logContentThreat(threat) {
        this.shield.logger.warn('Content threat detected in editor', threat);
    }
}

// TinyMCE integration example
tinymce.init({
    selector: '#content-editor',
    setup: (editor) => {
        const protection = new CMSEditorProtection(editor);
        protection.initialize();
    }
});
```

## Financial Applications

### Banking Form Protection

```javascript
class BankingProtection {
    constructor() {
        this.shield = new ShieldFirewall();
        this.forms = {
            login: document.getElementById('login-form'),
            transfer: document.getElementById('transfer-form'),
            payment: document.getElementById('payment-form')
        };
    }

    async initialize() {
        await this.shield.configure({
            protectionLevel: 'strict',
            features: {
                domProtection: true,
                networkInterception: true,
                behaviorAnalysis: true,
                predictiveDetection: true,
                autoRecovery: true
            },
            threatDetection: {
                sensitivity: 0.9,
                customPatterns: [
                    'account.*number',
                    'routing.*number',
                    'credit.*card',
                    'social.*security',
                    'bank.*login',
                    'transfer.*amount'
                ]
            },
            privacy: {
                anonymizeLogs: true,
                dataRetention: 90 // 90 days for financial data
            }
        });

        await this.shield.initialize();
        await this.shield.start();

        this.setupFormProtection();
        this.setupTransactionMonitoring();
        this.setupSessionProtection();
    }

    setupFormProtection() {
        Object.entries(this.forms).forEach(([type, form]) => {
            if (form) {
                this.protectFinancialForm(form, type);
            }
        });
    }

    protectFinancialForm(form, type) {
        // Scan form for threats
        this.shield.scan(form);

        // Monitor input fields
        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.validateFinancialInput(input, type);
            });

            input.addEventListener('blur', () => {
                this.finalValidateFinancialInput(input, type);
            });
        });

        // Protect form submission
        form.addEventListener('submit', (event) => {
            if (!this.validateFormSubmission(form, type)) {
                event.preventDefault();
            }
        });
    }

    validateFinancialInput(input, formType) {
        const value = input.value;
        const fieldType = input.name || input.id;

        // Real-time validation based on field type
        switch (fieldType) {
            case 'accountNumber':
            case 'routingNumber':
                if (!this.isValidAccountNumber(value)) {
                    this.showFieldWarning(input, 'Invalid account number format');
                }
                break;

            case 'amount':
                if (!this.isValidAmount(value)) {
                    this.showFieldWarning(input, 'Invalid amount');
                }
                break;

            case 'cardNumber':
                if (!this.isValidCardNumber(value)) {
                    this.showFieldWarning(input, 'Invalid card number');
                }
                break;
        }

        // Check for injection attempts
        const scanResult = this.shield.threatDetector.analyzeContent(value);
        if (scanResult.score > 0.3) {
            this.showFieldWarning(input, 'Suspicious input detected');
        }
    }

    finalValidateFinancialInput(input, formType) {
        // Additional validation on blur
        const value = input.value;

        // Check against known fraud patterns
        if (this.isKnownFraudPattern(value, formType)) {
            this.flagPotentialFraud(input, formType);
        }
    }

    validateFormSubmission(form, type) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Comprehensive form validation
        const validation = this.validateFinancialTransaction(data, type);

        if (!validation.valid) {
            this.showFormErrors(form, validation.errors);
            return false;
        }

        // Create pre-submission snapshot
        this.submissionSnapshot = this.shield.createSnapshot(`pre-${type}-submit`);

        return true;
    }

    validateFinancialTransaction(data, type) {
        const errors = [];

        switch (type) {
            case 'transfer':
                if (!data.fromAccount || !data.toAccount) {
                    errors.push('Account information required');
                }
                if (!data.amount || parseFloat(data.amount) <= 0) {
                    errors.push('Valid amount required');
                }
                if (parseFloat(data.amount) > 10000) {
                    errors.push('Amount exceeds daily limit');
                }
                break;

            case 'payment':
                if (!this.isValidCardNumber(data.cardNumber)) {
                    errors.push('Invalid card number');
                }
                if (!data.expiry || !this.isValidExpiry(data.expiry)) {
                    errors.push('Invalid expiry date');
                }
                break;
        }

        // Check for suspicious patterns
        const contentCheck = this.shield.threatDetector.analyzeContent(JSON.stringify(data));
        if (contentCheck.score > 0.5) {
            errors.push('Transaction contains suspicious content');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    setupTransactionMonitoring() {
        document.addEventListener('shield:network-request', (event) => {
            const request = event.detail;
            if (this.isFinancialTransaction(request)) {
                this.monitorTransactionRequest(request);
            }
        });
    }

    isFinancialTransaction(request) {
        return request.url.includes('/api/transfer') ||
               request.url.includes('/api/payment') ||
               request.url.includes('/api/transaction');
    }

    monitorTransactionRequest(request) {
        // Log all financial transactions
        this.shield.logger.info('Financial transaction initiated', {
            url: request.url,
            method: request.method,
            timestamp: Date.now()
        });

        // Check for unusual patterns
        if (this.isUnusualTransaction(request)) {
            this.flagUnusualTransaction(request);
        }
    }

    isUnusualTransaction(request) {
        // Check transaction frequency, amount, time, etc.
        const now = new Date();
        const hour = now.getHours();

        // Flag transactions outside business hours
        if (hour < 9 || hour > 17) {
            return true;
        }

        // Flag large amounts
        if (request.body && JSON.parse(request.body).amount > 5000) {
            return true;
        }

        return false;
    }

    flagUnusualTransaction(request) {
        this.shield.logger.warn('Unusual transaction detected', {
            url: request.url,
            timestamp: Date.now()
        });

        // Require additional verification
        this.requireAdditionalVerification(request);
    }

    setupSessionProtection() {
        // Monitor for session hijacking attempts
        document.addEventListener('shield:threat-detected', (event) => {
            const threat = event.detail;
            if (threat.type === 'session_hijacking') {
                this.handleSessionThreat(threat);
            }
        });

        // Periodic session validation
        setInterval(() => {
            this.validateSessionIntegrity();
        }, 300000); // Every 5 minutes
    }

    handleSessionThreat(threat) {
        // Immediate session invalidation
        this.invalidateSession();
        this.showSessionWarning();

        // Create recovery snapshot
        this.shield.createSnapshot('session-threat');
    }

    validateSessionIntegrity() {
        // Check session token validity, user behavior consistency, etc.
        const sessionValid = this.checkSessionValidity();

        if (!sessionValid) {
            this.handleInvalidSession();
        }
    }

    // Utility methods
    isValidAccountNumber(value) {
        return /^\d{8,17}$/.test(value.replace(/[-\s]/g, ''));
    }

    isValidAmount(value) {
        const amount = parseFloat(value);
        return !isNaN(amount) && amount > 0 && amount <= 1000000;
    }

    isValidCardNumber(value) {
        // Luhn algorithm check
        const clean = value.replace(/\s+/g, '');
        if (!/^\d{13,19}$/.test(clean)) return false;

        let sum = 0;
        for (let i = 0; i < clean.length; i++) {
            let digit = parseInt(clean[i]);
            if ((clean.length - i) % 2 === 0) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
        }
        return sum % 10 === 0;
    }

    isValidExpiry(value) {
        const match = value.match(/^(\d{2})\/(\d{2})$/);
        if (!match) return false;

        const month = parseInt(match[1]);
        const year = parseInt(match[2]) + 2000;
        const now = new Date();
        const expiry = new Date(year, month - 1);

        return month >= 1 && month <= 12 && expiry > now;
    }

    isKnownFraudPattern(value, formType) {
        // Check against known fraud patterns
        const fraudPatterns = [
            /^123456/,
            /test.*test/i,
            /fake.*account/i
        ];

        return fraudPatterns.some(pattern => pattern.test(value));
    }

    showFieldWarning(input, message) {
        this.clearFieldWarning(input);

        const warning = document.createElement('div');
        warning.className = 'field-warning';
        warning.textContent = message;

        input.parentElement.appendChild(warning);
        input.classList.add('field-error');
    }

    clearFieldWarning(input) {
        const existing = input.parentElement.querySelector('.field-warning');
        if (existing) existing.remove();
        input.classList.remove('field-error');
    }

    showFormErrors(form, errors) {
        const errorContainer = form.querySelector('.form-errors') ||
                              document.createElement('div');
        errorContainer.className = 'form-errors';
        errorContainer.innerHTML = `
            <h4>Please correct the following errors:</h4>
            <ul>${errors.map(error => `<li>${error}</li>`).join('')}</ul>
        `;

        form.insertBefore(errorContainer, form.firstElementChild);
    }

    flagPotentialFraud(input, formType) {
        this.shield.logger.warn('Potential fraud pattern detected', {
            field: input.name,
            formType,
            value: input.value.substring(0, 10) + '...' // Partial logging for privacy
        });

        this.showFieldWarning(input, 'This input pattern may indicate fraud. Please verify.');
    }

    requireAdditionalVerification(request) {
        // Show additional verification UI
        const verificationModal = this.createVerificationModal();
        document.body.appendChild(verificationModal);
    }

    createVerificationModal() {
        const modal = document.createElement('div');
        modal.className = 'verification-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <h3>Additional Verification Required</h3>
                <p>For security reasons, please verify your identity.</p>
                <form id="verification-form">
                    <input type="text" placeholder="Security question answer" required>
                    <button type="submit">Verify</button>
                </form>
            </div>
        `;
        return modal;
    }

    invalidateSession() {
        // Clear session data and redirect to login
        localStorage.removeItem('sessionToken');
        sessionStorage.clear();
        window.location.href = '/login?reason=security';
    }

    showSessionWarning() {
        alert('Your session has been terminated due to a security threat. Please log in again.');
    }

    checkSessionValidity() {
        // Implement session validation logic
        const sessionToken = localStorage.getItem('sessionToken');
        return sessionToken && this.validateToken(sessionToken);
    }

    validateToken(token) {
        // Implement token validation
        try {
            // Check expiry, signature, etc.
            return true; // Placeholder
        } catch {
            return false;
        }
    }

    handleInvalidSession() {
        this.shield.logger.warn('Invalid session detected');
        this.invalidateSession();
    }
}

// Initialize banking protection
const bankingProtection = new BankingProtection();
await bankingProtection.initialize();
```

## Real-time Applications

### Chat Application Protection

```javascript
class ChatProtection {
    constructor(chatApp) {
        this.shield = new ShieldFirewall();
        this.chatApp = chatApp;
        this.messageQueue = [];
        this.spamDetection = new Map();
    }

    async initialize() {
        await this.shield.configure({
            protectionLevel: 'balanced',
            features: {
                domProtection: true,
                networkInterception: true,
                behaviorAnalysis: true
            },
            threatDetection: {
                sensitivity: 0.7,
                customPatterns: [
                    'spam.*message',
                    'flood.*attack',
                    'malicious.*link',
                    'inappropriate.*content'
                ]
            }
        });

        await this.shield.initialize();
        await this.shield.start();

        this.setupMessageProtection();
        this.setupSpamPrevention();
        this.setupLinkValidation();
    }

    setupMessageProtection() {
        // Intercept message sending
        this.chatApp.on('before-send-message', (message) => {
            return this.validateMessage(message);
        });

        // Monitor incoming messages
        this.chatApp.on('message-received', (message) => {
            this.scanIncomingMessage(message);
        });

        // Protect message display
        this.chatApp.on('render-message', (element) => {
            this.shield.scan(element);
        });
    }

    validateMessage(message) {
        // Check message content
        const scanResult = this.shield.threatDetector.analyzeContent(message.content);

        if (scanResult.score > 0.6) {
            this.shield.logger.warn('Message blocked due to content threat', {
                score: scanResult.score,
                threats: scanResult.threats
            });
            return false;
        }

        // Check for spam
        if (this.isSpamMessage(message)) {
            return false;
        }

        // Validate links
        if (this.containsLinks(message.content)) {
            if (!this.validateLinks(message.content)) {
                return false;
            }
        }

        return true;
    }

    scanIncomingMessage(message) {
        // Scan incoming messages for threats
        const scanResult = this.shield.scan(message.element);

        if (scanResult.threats.length > 0) {
            this.handleIncomingThreat(message, scanResult.threats);
        }
    }

    handleIncomingThreat(message, threats) {
        // Hide or quarantine threatening messages
        message.element.classList.add('message-threat');
        message.element.setAttribute('data-threat-level', 'high');

        // Log threat
        this.shield.logger.warn('Incoming message threat detected', {
            messageId: message.id,
            threats: threats.map(t => t.type)
        });

        // Optionally hide the message
        if (threats.some(t => t.severity === 'critical')) {
            message.element.style.display = 'none';
        }
    }

    setupSpamPrevention() {
        this.chatApp.on('message-sent', (message) => {
            this.trackMessageRate(message.sender);
        });
    }

    trackMessageRate(senderId) {
        const now = Date.now();
        const window = 60000; // 1 minute
        const limit = 10; // 10 messages per minute

        if (!this.spamDetection.has(senderId)) {
            this.spamDetection.set(senderId, []);
        }

        const messages = this.spamDetection.get(senderId);
        messages.push(now);

        // Remove old messages outside the window
        const recentMessages = messages.filter(time => now - time < window);

        this.spamDetection.set(senderId, recentMessages);

        if (recentMessages.length > limit) {
            this.handleSpamDetection(senderId);
        }
    }

    handleSpamDetection(senderId) {
        this.shield.logger.warn('Spam detection triggered', { senderId });

        // Temporarily mute the user
        this.chatApp.muteUser(senderId, 300000); // 5 minutes

        // Show warning
        this.chatApp.showSystemMessage(
            'Spam detected. You have been temporarily muted.',
            'warning'
        );
    }

    isSpamMessage(message) {
        const content = message.content.toLowerCase();

        // Check for repeated messages
        const recentMessages = this.messageQueue.slice(-5);
        const isRepeated = recentMessages.some(m =>
            m.content === message.content && m.sender === message.sender
        );

        if (isRepeated) {
            return true;
        }

        // Check for spam patterns
        const spamPatterns = [
            /free.*money/i,
            /click.*here/i,
            /buy.*now/i,
            /limited.*time/i
        ];

        return spamPatterns.some(pattern => pattern.test(content));
    }

    setupLinkValidation() {
        this.chatApp.on('link-clicked', (linkData) => {
            if (!this.isSafeLink(linkData.url)) {
                this.handleUnsafeLink(linkData);
            }
        });
    }

    containsLinks(content) {
        const urlRegex = /https?:\/\/[^\s]+/g;
        return urlRegex.test(content);
    }

    validateLinks(content) {
        const urls = content.match(/https?:\/\/[^\s]+/g) || [];

        for (const url of urls) {
            if (!this.isSafeLink(url)) {
                this.shield.logger.warn('Unsafe link detected in message', { url });
                return false;
            }
        }

        return true;
    }

    isSafeLink(url) {
        try {
            const urlObj = new URL(url);

            // Block suspicious domains
            const blockedDomains = [
                'malicious-site.com',
                'phishing.net',
                'spam-domain.org'
            ];

            if (blockedDomains.some(domain => urlObj.hostname.includes(domain))) {
                return false;
            }

            // Allow whitelisted domains
            const allowedDomains = [
                'trusted-site.com',
                'chat-app.com',
                'cdn.chat-app.com'
            ];

            return allowedDomains.some(domain => urlObj.hostname === domain);

        } catch {
            // Invalid URL
            return false;
        }
    }

    handleUnsafeLink(linkData) {
        // Prevent navigation
        linkData.event.preventDefault();

        // Show warning
        this.chatApp.showModal('Unsafe Link',
            'This link has been flagged as potentially unsafe and has been blocked.'
        );

        // Log the attempt
        this.shield.logger.warn('Unsafe link click blocked', {
            url: linkData.url,
            userId: linkData.userId
        });
    }
}

// Chat application interface
class ChatApp {
    constructor() {
        this.eventListeners = new Map();
    }

    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    emit(event, data) {
        const listeners = this.eventListeners.get(event) || [];
        listeners.forEach(callback => callback(data));
    }

    showSystemMessage(message, type) {
        const element = document.createElement('div');
        element.className = `system-message ${type}`;
        element.textContent = message;
        document.getElementById('messages').appendChild(element);
    }

    muteUser(userId, duration) {
        // Implement user muting logic
        console.log(`User ${userId} muted for ${duration}ms`);
    }

    showModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'chat-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>${title}</h3>
                <p>${content}</p>
                <button onclick="this.closest('.modal').remove()">OK</button>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

// Initialize chat protection
const chatApp = new ChatApp();
const chatProtection = new ChatProtection(chatApp);
await chatProtection.initialize();
```

## Custom Integrations

### Framework-Specific Integration

```javascript
// React Integration
class ReactShieldProvider extends React.Component {
    constructor(props) {
        super(props);
        this.shield = new ShieldFirewall();
        this.state = { isProtected: false };
    }

    async componentDidMount() {
        await this.shield.configure({
            protectionLevel: 'balanced',
            features: {
                domProtection: true,
                behaviorAnalysis: true
            }
        });

        await this.shield.initialize();
        await this.shield.start();

        this.setState({ isProtected: true });
    }

    render() {
        return (
            <ShieldContext.Provider value={this.shield}>
                {this.props.children}
            </ShieldContext.Provider>
        );
    }
}

// Vue.js Integration
const VueShieldPlugin = {
    install(Vue, options) {
        const shield = new ShieldFirewall();

        Vue.prototype.$shield = shield;
        Vue.mixin({
            async created() {
                if (this.$root === this) {
                    await shield.configure(options || {});
                    await shield.initialize();
                    await shield.start();
                }
            }
        });
    }
};

// Angular Integration
@Injectable({
    providedIn: 'root'
})
export class ShieldService {
    private shield: ShieldFirewall;

    constructor() {
        this.shield = new ShieldFirewall();
    }

    async initialize(config?: ShieldConfig): Promise<void> {
        await this.shield.configure(config || {});
        await this.shield.initialize();
        await this.shield.start();
    }

    getInstance(): ShieldFirewall {
        return this.shield;
    }
}
```

### CDN Integration

```html
<!DOCTYPE html>
<html>
<head>
    <title>CDN Integration</title>
    <!-- Load SHIELD.js from CDN -->
    <script src="https://cdn.shield-js.com/v1.0.0/shield.min.js"></script>
</head>
<body>
    <div id="app">
        <h1>My Protected Application</h1>
        <form id="contact-form">
            <input type="text" name="name" placeholder="Name">
            <input type="email" name="email" placeholder="Email">
            <textarea name="message" placeholder="Message"></textarea>
            <button type="submit">Send</button>
        </form>
    </div>

    <script>
        // Wait for SHIELD.js to load
        window.addEventListener('shield-loaded', async () => {
            // Initialize protection
            const shield = new ShieldFirewall();

            await shield.configure({
                protectionLevel: 'balanced',
                features: {
                    domProtection: true,
                    networkInterception: true
                }
            });

            await shield.initialize();
            await shield.start();

            console.log('SHIELD.js protection active via CDN');
        });

        // Fallback if SHIELD.js fails to load
        window.addEventListener('shield-load-error', () => {
            console.warn('SHIELD.js failed to load, falling back to basic protection');
            // Implement basic client-side validation
        });
    </script>
</body>
</html>
```

### Web Components Integration

```javascript
class ShieldProtectedElement extends HTMLElement {
    constructor() {
        super();
        this.shield = new ShieldFirewall();
        this.attachShadow({ mode: 'open' });
    }

    async connectedCallback() {
        await this.initializeProtection();
        this.render();
        this.attachEventListeners();
    }

    async initializeProtection() {
        const protectionLevel = this.getAttribute('protection-level') || 'basic';

        await this.shield.configure({
            protectionLevel,
            features: {
                domProtection: true,
                behaviorAnalysis: protectionLevel !== 'basic'
            }
        });

        await this.shield.initialize();
        await this.shield.start();
    }

    render() {
        const template = `
            <style>
                .protected-content {
                    position: relative;
                }
                .shield-status {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    padding: 5px 10px;
                    background: #4CAF50;
                    color: white;
                    border-radius: 4px;
                    font-size: 12px;
                }
            </style>
            <div class="protected-content">
                <div class="shield-status">Protected by SHIELD.js</div>
                <slot></slot>
            </div>
        `;

        this.shadowRoot.innerHTML = template;
    }

    attachEventListeners() {
        // Protect content within this element
        this.addEventListener('input', (event) => {
            this.validateInput(event.target);
        });

        this.addEventListener('submit', (event) => {
            if (!this.validateSubmission(event.target)) {
                event.preventDefault();
            }
        });
    }

    validateInput(input) {
        const scanResult = this.shield.scan(input);
        if (scanResult.threats.length > 0) {
            input.classList.add('shield-threat-detected');
            this.dispatchEvent(new CustomEvent('shield-input-threat', {
                detail: { input, threats: scanResult.threats }
            }));
        }
    }

    validateSubmission(form) {
        const scanResult = this.shield.scan(form);
        const isValid = scanResult.threats.length === 0;

        this.dispatchEvent(new CustomEvent('shield-form-validation', {
            detail: { form, valid: isValid, threats: scanResult.threats }
        }));

        return isValid;
    }
}

// Register the custom element
customElements.define('shield-protected', ShieldProtectedElement);
```

### Module Federation Integration

```javascript
// Host Application
import { initShieldHost } from 'shield-js/host';

async function initializeHostProtection() {
    const shieldHost = await initShieldHost({
        protectionLevel: 'strict',
        sharedModules: ['react', 'lodash'],
        remoteModules: ['app1', 'app2']
    });

    // Protect shared dependencies
    shieldHost.protectSharedModules();

    // Monitor remote module loading
    shieldHost.onRemoteModuleLoad((moduleName, module) => {
        shieldHost.scanRemoteModule(moduleName, module);
    });

    return shieldHost;
}

// Remote Module
import { initShieldRemote } from 'shield-js/remote';

async function initializeRemoteProtection() {
    const shieldRemote = await initShieldRemote({
        moduleName: 'my-remote-module',
        protectionLevel: 'balanced'
    });

    // Protect module's DOM interactions
    shieldRemote.protectDOMInteractions();

    // Validate inter-module communications
    shieldRemote.onMessage((source, message) => {
        if (!shieldRemote.validateMessage(source, message)) {
            throw new Error('Invalid inter-module communication');
        }
    });

    return shieldRemote;
}
```

These examples demonstrate the versatility of SHIELD.js across different application types and integration patterns. The modular architecture allows for selective feature usage and easy integration with existing applications.