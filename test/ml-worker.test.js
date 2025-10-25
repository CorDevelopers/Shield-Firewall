/**
 * ML Worker Test Suite
 * Tests for machine learning computations and behavioral analysis
 */

import { MLWorker } from '../src/workers/ml-worker.js';

describe('MLWorker', () => {
  let mlWorker;
  let mockWorker;

  beforeEach(() => {
    // Mock Web Worker
    mockWorker = {
      postMessage: jest.fn(),
      onmessage: null,
      onerror: null,
      terminate: jest.fn()
    };

    global.Worker = jest.fn(() => mockWorker);

    mlWorker = new MLWorker();
  });

  afterEach(() => {
    if (mlWorker) {
      mlWorker.terminate();
    }
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize Web Worker', () => {
      expect(mlWorker.worker).toBeDefined();
      expect(global.Worker).toHaveBeenCalledWith('./ml-worker.js');
    });

    test('should handle worker creation failures', () => {
      global.Worker.mockImplementationOnce(() => {
        throw new Error('Worker not supported');
      });

      expect(() => new MLWorker()).toThrow('Worker not supported');
    });

    test('should set up message handlers', () => {
      expect(mockWorker.onmessage).toBeDefined();
      expect(mockWorker.onerror).toBeDefined();
    });
  });

  describe('Behavioral Analysis', () => {
    test('should analyze user behavior patterns', async () => {
      const interactions = [
        { type: 'click', timestamp: 1000, position: { x: 100, y: 200 } },
        { type: 'scroll', timestamp: 1500, distance: 500 },
        { type: 'input', timestamp: 2000, field: 'username' },
        { type: 'click', timestamp: 2500, position: { x: 150, y: 250 } }
      ];

      // Mock worker response
      mockWorker.onmessage({ data: { type: 'analysis_result', result: {
        isAnomaly: false,
        confidence: 0.95,
        patterns: ['normal_click_pattern', 'legitimate_input']
      }}});

      const result = await mlWorker.analyzeBehavior(interactions);

      expect(mockWorker.postMessage).toHaveBeenCalledWith({
        type: 'analyze_behavior',
        data: interactions
      });

      expect(result.isAnomaly).toBe(false);
      expect(result.confidence).toBe(0.95);
    });

    test('should detect anomalous behavior', async () => {
      const suspiciousInteractions = [
        { type: 'click', timestamp: 1000, position: { x: 100, y: 100 } },
        { type: 'click', timestamp: 1001, position: { x: 100, y: 100 } }, // Same position instantly
        { type: 'click', timestamp: 1002, position: { x: 100, y: 100 } }, // Bot-like behavior
        { type: 'input', timestamp: 1003, field: 'password', value: 'x'.repeat(1000) } // Unusual input
      ];

      mockWorker.onmessage({ data: { type: 'analysis_result', result: {
        isAnomaly: true,
        confidence: 0.87,
        patterns: ['bot_behavior', 'suspicious_input']
      }}});

      const result = await mlWorker.analyzeBehavior(suspiciousInteractions);

      expect(result.isAnomaly).toBe(true);
      expect(result.confidence).toBe(0.87);
      expect(result.patterns).toContain('bot_behavior');
    });

    test('should handle analysis timeouts', async () => {
      // Mock no response from worker
      const promise = mlWorker.analyzeBehavior([]);

      // Simulate timeout by not calling onmessage
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should reject with timeout error
      await expect(promise).rejects.toThrow('Analysis timeout');
    });
  });

  describe('Bot Detection', () => {
    test('should detect bot behavior', async () => {
      const botInteractions = Array(100).fill().map((_, i) => ({
        type: 'click',
        timestamp: Date.now() + i,
        position: { x: 100, y: 100 } // Same position repeatedly
      }));

      mockWorker.onmessage({ data: { type: 'bot_detection_result', result: {
        isBot: true,
        confidence: 0.92,
        indicators: ['repetitive_clicks', 'uniform_timing', 'same_position']
      }}});

      const result = await mlWorker.detectBot(botInteractions);

      expect(result.isBot).toBe(true);
      expect(result.confidence).toBe(0.92);
      expect(result.indicators).toContain('repetitive_clicks');
    });

    test('should identify legitimate user behavior', async () => {
      const humanInteractions = [
        { type: 'click', timestamp: 1000, position: { x: 100, y: 200 } },
        { type: 'scroll', timestamp: 2000, distance: 300 },
        { type: 'input', timestamp: 3500, field: 'search', value: 'query' },
        { type: 'click', timestamp: 5000, position: { x: 300, y: 400 } }
      ];

      mockWorker.onmessage({ data: { type: 'bot_detection_result', result: {
        isBot: false,
        confidence: 0.98,
        indicators: ['natural_timing', 'varied_interactions']
      }}});

      const result = await mlWorker.detectBot(humanInteractions);

      expect(result.isBot).toBe(false);
      expect(result.confidence).toBe(0.98);
    });

    test('should handle edge cases in bot detection', async () => {
      const edgeCases = [
        [], // Empty interactions
        [{ type: 'single_click' }], // Single interaction
        Array(1000).fill({ type: 'click', timestamp: Date.now() }) // Many interactions
      ];

      for (const interactions of edgeCases) {
        mockWorker.onmessage({ data: { type: 'bot_detection_result', result: {
          isBot: false,
          confidence: 0.5,
          indicators: []
        }}});

        const result = await mlWorker.detectBot(interactions);
        expect(result).toHaveProperty('isBot');
        expect(result).toHaveProperty('confidence');
      }
    });
  });

  describe('Statistical Analysis', () => {
    test('should calculate statistical measures', async () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      mockWorker.onmessage({ data: { type: 'statistics_result', result: {
        mean: 5.5,
        median: 5.5,
        stdDev: 2.87,
        min: 1,
        max: 10,
        quartiles: [3, 5.5, 8]
      }}});

      const result = await mlWorker.calculateStatistics(data);

      expect(result.mean).toBe(5.5);
      expect(result.median).toBe(5.5);
      expect(result.stdDev).toBeCloseTo(2.87, 2);
      expect(result.min).toBe(1);
      expect(result.max).toBe(10);
    });

    test('should detect outliers', async () => {
      const data = [1, 2, 3, 4, 5, 100]; // 100 is an outlier

      mockWorker.onmessage({ data: { type: 'outlier_detection_result', result: {
        outliers: [100],
        outlierIndices: [5],
        threshold: 2.5,
        method: 'iqr'
      }}});

      const result = await mlWorker.detectOutliers(data);

      expect(result.outliers).toEqual([100]);
      expect(result.outlierIndices).toEqual([5]);
      expect(result.threshold).toBe(2.5);
    });

    test('should perform correlation analysis', async () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10]; // Perfect positive correlation

      mockWorker.onmessage({ data: { type: 'correlation_result', result: {
        coefficient: 1.0,
        pValue: 0.0,
        significance: 'perfect_positive'
      }}});

      const result = await mlWorker.calculateCorrelation(x, y);

      expect(result.coefficient).toBe(1.0);
      expect(result.pValue).toBe(0.0);
      expect(result.significance).toBe('perfect_positive');
    });
  });

  describe('Pattern Recognition', () => {
    test('should identify behavior patterns', async () => {
      const interactions = [
        { type: 'click', element: 'button', timestamp: 1000 },
        { type: 'input', field: 'username', timestamp: 1500 },
        { type: 'input', field: 'password', timestamp: 2000 },
        { type: 'click', element: 'submit', timestamp: 2500 }
      ];

      mockWorker.onmessage({ data: { type: 'pattern_recognition_result', result: {
        patterns: ['login_sequence', 'form_interaction'],
        confidence: 0.89,
        sequence: ['click', 'input', 'input', 'click']
      }}});

      const result = await mlWorker.recognizePatterns(interactions);

      expect(result.patterns).toContain('login_sequence');
      expect(result.confidence).toBe(0.89);
      expect(result.sequence).toEqual(['click', 'input', 'input', 'click']);
    });

    test('should detect suspicious patterns', async () => {
      const suspiciousInteractions = [
        { type: 'input', field: 'search', value: '<script>', timestamp: 1000 },
        { type: 'click', element: 'submit', timestamp: 1100 },
        { type: 'input', field: 'search', value: ' UNION SELECT ', timestamp: 2000 }
      ];

      mockWorker.onmessage({ data: { type: 'pattern_recognition_result', result: {
        patterns: ['xss_attempt', 'sql_injection_attempt'],
        confidence: 0.95,
        anomalies: ['script_injection', 'sql_keywords']
      }}});

      const result = await mlWorker.recognizePatterns(suspiciousInteractions);

      expect(result.patterns).toContain('xss_attempt');
      expect(result.patterns).toContain('sql_injection_attempt');
      expect(result.confidence).toBe(0.95);
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle large datasets efficiently', async () => {
      const largeDataset = Array(10000).fill().map((_, i) => ({
        type: 'click',
        timestamp: Date.now() + i,
        position: { x: Math.random() * 1000, y: Math.random() * 1000 }
      }));

      const startTime = performance.now();

      mockWorker.onmessage({ data: { type: 'analysis_result', result: {
        isAnomaly: false,
        confidence: 0.8
      }}});

      await mlWorker.analyzeBehavior(largeDataset);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should maintain accuracy under load', async () => {
      const concurrentAnalyses = Array(10).fill().map(() =>
        mlWorker.analyzeBehavior([
          { type: 'click', timestamp: Date.now() },
          { type: 'scroll', timestamp: Date.now() + 100 }
        ])
      );

      // Mock responses for all concurrent requests
      for (let i = 0; i < 10; i++) {
        setTimeout(() => {
          mockWorker.onmessage({ data: { type: 'analysis_result', result: {
            isAnomaly: false,
            confidence: 0.9
          }}});
        }, i * 10);
      }

      const results = await Promise.all(concurrentAnalyses);

      results.forEach(result => {
        expect(result.isAnomaly).toBe(false);
        expect(result.confidence).toBe(0.9);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle worker errors gracefully', async () => {
      mockWorker.onerror(new ErrorEvent('error', {
        message: 'Worker computation failed'
      }));

      const promise = mlWorker.analyzeBehavior([]);

      await expect(promise).rejects.toThrow('Worker computation failed');
    });

    test('should handle malformed worker responses', async () => {
      mockWorker.onmessage({ data: null }); // Invalid response

      const promise = mlWorker.analyzeBehavior([]);

      await expect(promise).rejects.toThrow('Invalid worker response');
    });

    test('should handle worker termination', () => {
      mlWorker.terminate();

      expect(mockWorker.terminate).toHaveBeenCalled();
      expect(mlWorker.worker).toBeNull();
    });

    test('should reject operations after termination', async () => {
      mlWorker.terminate();

      await expect(mlWorker.analyzeBehavior([])).rejects.toThrow('Worker terminated');
    });
  });

  describe('Message Passing', () => {
    test('should send correct message format', () => {
      const testData = { key: 'value', number: 42 };

      mlWorker.sendMessage('test_type', testData);

      expect(mockWorker.postMessage).toHaveBeenCalledWith({
        type: 'test_type',
        data: testData,
        id: expect.any(String)
      });
    });

    test('should handle message responses correctly', async () => {
      const messageId = 'test-123';
      const expectedResult = { success: true };

      // Mock the message sending to capture the ID
      mockWorker.postMessage.mockImplementation((message) => {
        setTimeout(() => {
          mockWorker.onmessage({
            data: {
              type: 'response',
              id: message.id,
              result: expectedResult
            }
          });
        }, 0);
      });

      const result = await mlWorker.sendMessage('test', {});

      expect(result).toEqual(expectedResult);
    });

    test('should timeout long-running operations', async () => {
      mlWorker.timeout = 100; // Short timeout for testing

      const promise = mlWorker.sendMessage('slow_operation', {});

      await expect(promise).rejects.toThrow('Operation timeout');
    });
  });

  describe('Resource Management', () => {
    test('should clean up resources on termination', () => {
      mlWorker.terminate();

      expect(mockWorker.terminate).toHaveBeenCalled();
      expect(mlWorker.worker).toBeNull();
      expect(mlWorker.pendingRequests.size).toBe(0);
    });

    test('should handle multiple concurrent requests', async () => {
      const requests = Array(5).fill().map((_, i) =>
        mlWorker.sendMessage(`request_${i}`, { index: i })
      );

      // Resolve all requests
      requests.forEach((_, i) => {
        setTimeout(() => {
          mockWorker.onmessage({
            data: {
              type: 'response',
              id: `request_${i}`,
              result: { index: i, processed: true }
            }
          });
        }, i * 10);
      });

      const results = await Promise.all(requests);

      results.forEach((result, i) => {
        expect(result.index).toBe(i);
        expect(result.processed).toBe(true);
      });
    });

    test('should prevent memory leaks', () => {
      // Create many pending requests
      for (let i = 0; i < 100; i++) {
        mlWorker.sendMessage(`leak_test_${i}`, {});
      }

      expect(mlWorker.pendingRequests.size).toBe(100);

      // Terminate should clean up all pending requests
      mlWorker.terminate();

      expect(mlWorker.pendingRequests.size).toBe(0);
    });
  });
});