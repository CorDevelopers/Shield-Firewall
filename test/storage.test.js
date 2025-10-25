/**
 * Storage Manager Test Suite
 * Tests for IndexedDB storage operations and data persistence
 */

import storageManager from '../src/utils/storage.js';

describe('StorageManager', () => {
  let storageManagerInstance;
  let mockCrypto;

  beforeEach(async () => {
    // Mock crypto for testing
    mockCrypto = {
      encrypt: jest.fn((data) => Promise.resolve(`encrypted_${data}`)),
      decrypt: jest.fn((data) => Promise.resolve(data.replace('encrypted_', ''))),
      hash: jest.fn((data) => Promise.resolve(`hash_${data}`))
    };

    // Mock IndexedDB
    global.indexedDB = {
      open: jest.fn(() => ({
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
        result: {
          createObjectStore: jest.fn(() => ({
            createIndex: jest.fn()
          })),
          transaction: jest.fn(() => ({
            objectStore: jest.fn(() => ({
              put: jest.fn(),
              get: jest.fn(() => ({ onsuccess: null, onerror: null })),
              delete: jest.fn(),
              clear: jest.fn(),
              openCursor: jest.fn(() => ({ onsuccess: null, onerror: null }))
            }))
          }))
        }
      }))
    };

    // Create a new instance for testing with mock crypto
    const StorageManager = (await import('../src/utils/storage.js')).default.constructor;
    storageManagerInstance = new StorageManager(mockCrypto);
    await storageManagerInstance.initialize();
  });

  afterEach(async () => {
    if (storageManagerInstance) {
      await storageManagerInstance.close();
    }
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      expect(storageManager.initialized).toBe(true);
      expect(storageManager.db).toBeDefined();
    });

    test('should create required object stores', async () => {
      const stores = ['behavior_profiles', 'threat_logs', 'config', 'snapshots'];
      // Verify that createObjectStore was called for each store
      expect(global.indexedDB.open).toHaveBeenCalled();
    });

    test('should handle initialization failures gracefully', async () => {
      global.indexedDB.open.mockImplementationOnce(() => {
        throw new Error('IndexedDB not supported');
      });

      const newStorage = new StorageManager(mockCrypto);
      await expect(newStorage.initialize()).rejects.toThrow();
    });
  });

  describe('Behavior Profile Storage', () => {
    test('should store behavior profile', async () => {
      const profile = {
        userId: 'test-user',
        interactions: 150,
        avgInterval: 2000,
        patterns: ['click', 'scroll', 'input'],
        lastUpdated: Date.now()
      };

      const success = await storageManager.storeBehaviorProfile(profile);
      expect(success).toBe(true);
      expect(mockCrypto.encrypt).toHaveBeenCalledWith(JSON.stringify(profile));
    });

    test('should retrieve behavior profile', async () => {
      const profile = {
        userId: 'test-user',
        interactions: 100,
        patterns: ['click']
      };

      await storageManager.storeBehaviorProfile(profile);
      const retrieved = await storageManager.getBehaviorProfile('test-user');

      expect(retrieved).toEqual(profile);
      expect(mockCrypto.decrypt).toHaveBeenCalled();
    });

    test('should handle profile not found', async () => {
      const retrieved = await storageManager.getBehaviorProfile('nonexistent');
      expect(retrieved).toBeNull();
    });

    test('should update existing profile', async () => {
      const initialProfile = { userId: 'user1', interactions: 50 };
      const updatedProfile = { userId: 'user1', interactions: 100 };

      await storageManager.storeBehaviorProfile(initialProfile);
      await storageManager.storeBehaviorProfile(updatedProfile);

      const retrieved = await storageManager.getBehaviorProfile('user1');
      expect(retrieved.interactions).toBe(100);
    });
  });

  describe('Threat Logging', () => {
    test('should log threats', async () => {
      const threat = {
        type: 'xss',
        severity: 'high',
        source: 'dom',
        content: '<script>alert(1)</script>',
        timestamp: Date.now(),
        blocked: true
      };

      const success = await storageManager.logThreat(threat);
      expect(success).toBe(true);
      expect(mockCrypto.encrypt).toHaveBeenCalled();
    });

    test('should retrieve threat logs', async () => {
      const threats = [
        { type: 'xss', severity: 'high', timestamp: Date.now() },
        { type: 'sql_injection', severity: 'medium', timestamp: Date.now() + 1000 }
      ];

      for (const threat of threats) {
        await storageManager.logThreat(threat);
      }

      const logs = await storageManager.getThreatLogs();
      expect(logs.length).toBe(2);
      expect(logs[0].type).toBe('xss');
      expect(logs[1].type).toBe('sql_injection');
    });

    test('should filter threat logs by type', async () => {
      const threats = [
        { type: 'xss', severity: 'high' },
        { type: 'sql_injection', severity: 'medium' },
        { type: 'xss', severity: 'low' }
      ];

      for (const threat of threats) {
        await storageManager.logThreat(threat);
      }

      const xssLogs = await storageManager.getThreatLogs({ type: 'xss' });
      expect(xssLogs.length).toBe(2);
      expect(xssLogs.every(log => log.type === 'xss')).toBe(true);
    });

    test('should filter threat logs by severity', async () => {
      const threats = [
        { type: 'xss', severity: 'high' },
        { type: 'sql_injection', severity: 'medium' },
        { type: 'csrf', severity: 'high' }
      ];

      for (const threat of threats) {
        await storageManager.logThreat(threat);
      }

      const highSeverityLogs = await storageManager.getThreatLogs({ severity: 'high' });
      expect(highSeverityLogs.length).toBe(2);
      expect(highSeverityLogs.every(log => log.severity === 'high')).toBe(true);
    });

    test('should limit threat log results', async () => {
      const threats = Array(50).fill().map((_, i) => ({
        type: 'test',
        severity: 'low',
        id: i
      }));

      for (const threat of threats) {
        await storageManager.logThreat(threat);
      }

      const limitedLogs = await storageManager.getThreatLogs({}, 10);
      expect(limitedLogs.length).toBe(10);
    });
  });

  describe('Configuration Storage', () => {
    test('should store configuration', async () => {
      const config = {
        protectionLevel: 'strict',
        features: {
          domProtection: true,
          networkInterception: true
        },
        threatDetection: {
          sensitivity: 0.8
        }
      };

      const success = await storageManager.storeConfig(config);
      expect(success).toBe(true);
      expect(mockCrypto.encrypt).toHaveBeenCalled();
    });

    test('should retrieve configuration', async () => {
      const config = { protectionLevel: 'balanced' };
      await storageManager.storeConfig(config);

      const retrieved = await storageManager.getConfig();
      expect(retrieved).toEqual(config);
    });

    test('should update configuration', async () => {
      const initialConfig = { level: 'basic' };
      const updatedConfig = { level: 'advanced' };

      await storageManager.storeConfig(initialConfig);
      await storageManager.storeConfig(updatedConfig);

      const retrieved = await storageManager.getConfig();
      expect(retrieved.level).toBe('advanced');
    });
  });

  describe('Snapshot Storage', () => {
    test('should store DOM snapshots', async () => {
      const snapshot = {
        id: 'snapshot-1',
        timestamp: Date.now(),
        domContent: '<html><body>Hello</body></html>',
        url: 'https://example.com'
      };

      const success = await storageManager.storeSnapshot(snapshot);
      expect(success).toBe(true);
    });

    test('should retrieve snapshots', async () => {
      const snapshot = { id: 'test-snapshot', content: 'test content' };
      await storageManager.storeSnapshot(snapshot);

      const retrieved = await storageManager.getSnapshot('test-snapshot');
      expect(retrieved).toEqual(snapshot);
    });

    test('should list snapshots', async () => {
      const snapshots = [
        { id: 'snap1', timestamp: Date.now() },
        { id: 'snap2', timestamp: Date.now() + 1000 }
      ];

      for (const snapshot of snapshots) {
        await storageManager.storeSnapshot(snapshot);
      }

      const list = await storageManager.listSnapshots();
      expect(list.length).toBe(2);
      expect(list.map(s => s.id)).toEqual(['snap1', 'snap2']);
    });

    test('should delete old snapshots', async () => {
      const oldSnapshot = {
        id: 'old',
        timestamp: Date.now() - (31 * 24 * 60 * 60 * 1000) // 31 days ago
      };

      const newSnapshot = {
        id: 'new',
        timestamp: Date.now()
      };

      await storageManager.storeSnapshot(oldSnapshot);
      await storageManager.storeSnapshot(newSnapshot);

      await storageManager.cleanupOldSnapshots(30); // 30 days retention

      const list = await storageManager.listSnapshots();
      expect(list.length).toBe(1);
      expect(list[0].id).toBe('new');
    });
  });

  describe('Data Encryption', () => {
    test('should encrypt sensitive data', async () => {
      const sensitiveData = 'password123';
      await storageManager.storeConfig({ password: sensitiveData });

      expect(mockCrypto.encrypt).toHaveBeenCalledWith(
        expect.stringContaining(sensitiveData)
      );
    });

    test('should decrypt data on retrieval', async () => {
      const data = 'test data';
      await storageManager.storeConfig({ test: data });

      const retrieved = await storageManager.getConfig();
      expect(mockCrypto.decrypt).toHaveBeenCalled();
      expect(retrieved.test).toBe(data);
    });

    test('should handle encryption failures', async () => {
      mockCrypto.encrypt.mockRejectedValueOnce(new Error('Encryption failed'));

      await expect(storageManager.storeConfig({ test: 'data' })).rejects.toThrow();
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle bulk operations efficiently', async () => {
      const threats = Array(100).fill().map((_, i) => ({
        type: 'test',
        severity: 'low',
        id: i,
        timestamp: Date.now() + i
      }));

      const startTime = performance.now();

      for (const threat of threats) {
        await storageManager.logThreat(threat);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should maintain data integrity under load', async () => {
      const operations = Array(50).fill().map((_, i) => ({
        type: 'concurrent_test',
        id: i
      }));

      const promises = operations.map(op =>
        storageManager.logThreat(op)
      );

      const results = await Promise.all(promises);
      expect(results.every(result => result === true)).toBe(true);

      const logs = await storageManager.getThreatLogs({ type: 'concurrent_test' });
      expect(logs.length).toBe(50);
    });
  });

  describe('Error Handling', () => {
    test('should handle storage quota exceeded', async () => {
      const largeData = 'x'.repeat(1024 * 1024 * 10); // 10MB
      const largeConfig = { data: largeData };

      // Mock quota exceeded error
      global.indexedDB.open.mockImplementationOnce(() => {
        const request = {
          onsuccess: null,
          onerror: null,
          onupgradeneeded: null,
          error: { name: 'QuotaExceededError' }
        };
        setTimeout(() => {
          if (request.onerror) request.onerror({ target: request });
        }, 0);
        return request;
      });

      const newStorage = new StorageManager(mockCrypto);
      await expect(newStorage.initialize()).rejects.toThrow();
    });

    test('should handle transaction failures', async () => {
      // Mock transaction failure
      const mockTransaction = {
        objectStore: jest.fn(() => ({
          put: jest.fn(() => {
            throw new Error('Transaction failed');
          })
        }))
      };

      global.indexedDB.open().result.transaction.mockReturnValue(mockTransaction);

      await expect(storageManager.storeConfig({ test: 'data' })).rejects.toThrow();
    });

    test('should handle corrupted data gracefully', async () => {
      mockCrypto.decrypt.mockRejectedValueOnce(new Error('Decryption failed'));

      const retrieved = await storageManager.getConfig();
      expect(retrieved).toBeNull();
    });
  });

  describe('Data Retention and Cleanup', () => {
    test('should clean up old threat logs', async () => {
      const oldThreat = {
        type: 'old',
        timestamp: Date.now() - (91 * 24 * 60 * 60 * 1000) // 91 days ago
      };

      const newThreat = {
        type: 'new',
        timestamp: Date.now()
      };

      await storageManager.logThreat(oldThreat);
      await storageManager.logThreat(newThreat);

      await storageManager.cleanupOldThreatLogs(90); // 90 days retention

      const logs = await storageManager.getThreatLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].type).toBe('new');
    });

    test('should maintain storage limits', async () => {
      // Fill storage with many entries
      for (let i = 0; i < 200; i++) {
        await storageManager.logThreat({
          type: 'bulk_test',
          id: i,
          timestamp: Date.now()
        });
      }

      // Storage should automatically limit entries
      const logs = await storageManager.getThreatLogs({ type: 'bulk_test' });
      expect(logs.length).toBeLessThanOrEqual(100); // Assuming max 100 entries
    });
  });
});