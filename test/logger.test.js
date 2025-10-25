/**
 * Logger Test Suite
 * Tests for logging functionality and threat persistence
 */

import { Logger } from '../src/utils/logger.js';

describe('Logger', () => {
  let logger;
  let mockStorage;
  let mockConsole;

  beforeEach(() => {
    // Mock storage
    mockStorage = {
      logThreat: jest.fn().mockResolvedValue(true),
      getThreatLogs: jest.fn().mockResolvedValue([]),
      storeConfig: jest.fn().mockResolvedValue(true),
      getConfig: jest.fn().mockResolvedValue({ logLevel: 'info' })
    };

    // Mock console methods
    mockConsole = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      debug: jest.fn()
    };

    global.console = mockConsole;

    logger = new Logger(mockStorage);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Log Levels', () => {
    test('should log debug messages', () => {
      logger.setLevel('debug');
      logger.debug('Debug message', { key: 'value' });

      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('DEBUG'),
        'Debug message',
        { key: 'value' }
      );
    });

    test('should log info messages', () => {
      logger.setLevel('info');
      logger.info('Info message');

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('INFO'),
        'Info message'
      );
    });

    test('should log warning messages', () => {
      logger.warn('Warning message', { error: 'test' });

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('WARN'),
        'Warning message',
        { error: 'test' }
      );
    });

    test('should log error messages', () => {
      logger.error('Error message', new Error('Test error'));

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR'),
        'Error message',
        expect.any(Error)
      );
    });

    test('should respect log levels', () => {
      logger.setLevel('error');

      logger.debug('Debug - should not appear');
      logger.info('Info - should not appear');
      logger.warn('Warn - should not appear');
      logger.error('Error - should appear');

      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalled();
    });
  });

  describe('Threat Logging', () => {
    test('should log threats with persistence', async () => {
      const threat = {
        type: 'xss',
        severity: 'high',
        source: 'dom',
        content: '<script>alert(1)</script>',
        blocked: true
      };

      await logger.threatDetected(threat);

      expect(mockStorage.logThreat).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'xss',
          severity: 'high',
          source: 'dom',
          blocked: true,
          timestamp: expect.any(Number)
        })
      );

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('THREAT'),
        expect.stringContaining('xss'),
        expect.stringContaining('high')
      );
    });

    test('should handle threat logging failures gracefully', async () => {
      mockStorage.logThreat.mockRejectedValueOnce(new Error('Storage failed'));

      const threat = { type: 'test', severity: 'low' };

      // Should not throw, just log to console
      await expect(logger.threatDetected(threat)).resolves.not.toThrow();

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to persist threat'),
        expect.any(Error)
      );
    });

    test('should log different threat severities', async () => {
      const threats = [
        { type: 'xss', severity: 'low' },
        { type: 'sql_injection', severity: 'medium' },
        { type: 'rce', severity: 'high' },
        { type: 'csrf', severity: 'critical' }
      ];

      for (const threat of threats) {
        await logger.threatDetected(threat);
      }

      expect(mockStorage.logThreat).toHaveBeenCalledTimes(4);
      expect(mockConsole.error).toHaveBeenCalledTimes(4);
    });
  });

  describe('Statistics and Metrics', () => {
    test('should track threat statistics', async () => {
      const threats = [
        { type: 'xss', severity: 'high' },
        { type: 'xss', severity: 'medium' },
        { type: 'sql_injection', severity: 'high' },
        { type: 'csrf', severity: 'low' }
      ];

      for (const threat of threats) {
        await logger.threatDetected(threat);
      }

      const stats = logger.getStats();

      expect(stats.totalThreats).toBe(4);
      expect(stats.byType.xss).toBe(2);
      expect(stats.byType.sql_injection).toBe(1);
      expect(stats.byType.csrf).toBe(1);
      expect(stats.bySeverity.high).toBe(2);
      expect(stats.bySeverity.medium).toBe(1);
      expect(stats.bySeverity.low).toBe(1);
    });

    test('should track time-based statistics', async () => {
      const now = Date.now();

      // Mock Date.now for consistent testing
      global.Date.now = jest.fn()
        .mockReturnValueOnce(now - 3600000) // 1 hour ago
        .mockReturnValueOnce(now - 1800000) // 30 min ago
        .mockReturnValueOnce(now - 600000)  // 10 min ago
        .mockReturnValueOnce(now);          // now

      await logger.threatDetected({ type: 'xss', severity: 'high' });
      await logger.threatDetected({ type: 'sql', severity: 'medium' });
      await logger.threatDetected({ type: 'csrf', severity: 'low' });
      await logger.threatDetected({ type: 'xss', severity: 'high' });

      const stats = logger.getStats();

      expect(stats.lastHour).toBe(4);
      expect(stats.last24Hours).toBe(4);
    });

    test('should reset statistics', () => {
      logger.resetStats();
      const stats = logger.getStats();

      expect(stats.totalThreats).toBe(0);
      expect(Object.keys(stats.byType).length).toBe(0);
      expect(Object.keys(stats.bySeverity).length).toBe(0);
    });
  });

  describe('Log Formatting', () => {
    test('should format log messages correctly', () => {
      logger.info('Test message', { user: 'test', action: 'login' });

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringMatching(/^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\] INFO: Test message$/),
        { user: 'test', action: 'login' }
      );
    });

    test('should include timestamps in logs', () => {
      const before = Date.now();
      logger.debug('Timestamp test');
      const after = Date.now();

      const call = mockConsole.debug.mock.calls[0][0];
      const timestamp = call.match(/\[([^\]]+)\]/)[1];
      const logTime = new Date(timestamp).getTime();

      expect(logTime).toBeGreaterThanOrEqual(before);
      expect(logTime).toBeLessThanOrEqual(after);
    });

    test('should handle complex data structures', () => {
      const complexData = {
        user: { id: 123, name: 'Test User' },
        request: {
          url: '/api/data',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        },
        response: { status: 200, data: [1, 2, 3] }
      };

      logger.info('Complex log', complexData);

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.any(String),
        complexData
      );
    });
  });

  describe('Configuration', () => {
    test('should load configuration from storage', async () => {
      mockStorage.getConfig.mockResolvedValue({
        logLevel: 'warn',
        persistThreats: true,
        maxLogs: 1000
      });

      await logger.loadConfig();

      expect(logger.level).toBe('warn');
    });

    test('should save configuration to storage', async () => {
      const config = { logLevel: 'debug', persistThreats: false };
      await logger.saveConfig(config);

      expect(mockStorage.storeConfig).toHaveBeenCalledWith(config);
    });

    test('should handle configuration load failures', async () => {
      mockStorage.getConfig.mockRejectedValue(new Error('Config load failed'));

      // Should not throw, use defaults
      await expect(logger.loadConfig()).resolves.not.toThrow();
      expect(logger.level).toBe('info'); // default level
    });
  });

  describe('Performance Monitoring', () => {
    test('should track logging performance', () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        logger.debug(`Performance test message ${i}`);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should handle high-frequency logging', async () => {
      const threats = Array(100).fill().map((_, i) => ({
        type: 'performance_test',
        severity: 'low',
        id: i
      }));

      const startTime = performance.now();

      const promises = threats.map(threat => logger.threatDetected(threat));
      await Promise.all(promises);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(mockStorage.logThreat).toHaveBeenCalledTimes(100);
    });
  });

  describe('Error Handling', () => {
    test('should handle console method failures', () => {
      mockConsole.log.mockImplementation(() => {
        throw new Error('Console failed');
      });

      // Should not throw when console fails
      expect(() => logger.info('Test')).not.toThrow();
    });

    test('should handle invalid log levels', () => {
      expect(() => logger.setLevel('invalid')).not.toThrow();
      expect(logger.level).toBe('info'); // Should default to info
    });

    test('should handle null/undefined data', () => {
      expect(() => logger.info('Test', null)).not.toThrow();
      expect(() => logger.warn('Test', undefined)).not.toThrow();
      expect(() => logger.error('Test', {})).not.toThrow();
    });

    test('should handle circular references in data', () => {
      const circular = { self: null };
      circular.self = circular;

      expect(() => logger.debug('Circular test', circular)).not.toThrow();
    });
  });

  describe('Log Rotation and Cleanup', () => {
    test('should limit in-memory log buffer', () => {
      logger.maxBufferSize = 10;

      for (let i = 0; i < 15; i++) {
        logger.info(`Message ${i}`);
      }

      // Should only keep last 10 messages
      expect(logger.buffer.length).toBe(10);
      expect(logger.buffer[0].message).toContain('Message 5');
      expect(logger.buffer[9].message).toContain('Message 14');
    });

    test('should clear log buffer', () => {
      logger.info('Test message');
      expect(logger.buffer.length).toBe(1);

      logger.clearBuffer();
      expect(logger.buffer.length).toBe(0);
    });

    test('should export logs', () => {
      logger.info('Export test 1');
      logger.warn('Export test 2');
      logger.error('Export test 3');

      const exported = logger.exportLogs();

      expect(exported).toContain('INFO: Export test 1');
      expect(exported).toContain('WARN: Export test 2');
      expect(exported).toContain('ERROR: Export test 3');
      expect(exported.split('\n').length).toBe(3);
    });
  });

  describe('Integration with Storage', () => {
    test('should persist logs to storage', async () => {
      mockStorage.getConfig.mockResolvedValue({ persistLogs: true });

      logger.info('Persistent message');
      await logger.flush(); // Force flush to storage

      expect(mockStorage.storeConfig).toHaveBeenCalled();
    });

    test('should retrieve logs from storage', async () => {
      const storedLogs = [
        { level: 'error', message: 'Stored error', timestamp: Date.now() },
        { level: 'warn', message: 'Stored warning', timestamp: Date.now() }
      ];

      mockStorage.getConfig.mockResolvedValue({ logs: storedLogs });

      await logger.loadPersistedLogs();

      // Should merge with current buffer
      expect(logger.buffer.length).toBe(2);
    });

    test('should handle storage unavailability', async () => {
      mockStorage.logThreat.mockRejectedValue(new Error('Storage down'));

      // Should continue logging to console even if storage fails
      await expect(logger.threatDetected({ type: 'test' })).resolves.not.toThrow();
      expect(mockConsole.error).toHaveBeenCalled();
    });
  });
});