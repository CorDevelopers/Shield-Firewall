/**
 * Machine Learning Web Worker for SHIELD.js
 * Handles computationally intensive pattern matching and behavioral analysis
 * Runs in a separate thread to avoid blocking the main UI thread
 */

// Statistical functions for anomaly detection
class Statistics {
  static mean(values) {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  static variance(values) {
    const mean = this.mean(values);
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  static standardDeviation(values) {
    return Math.sqrt(this.variance(values));
  }

  static zScore(value, mean, stdDev) {
    return Math.abs((value - mean) / stdDev);
  }

  static percentile(values, p) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (upper >= sorted.length) return sorted[sorted.length - 1];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  static movingAverage(values, windowSize) {
    const result = [];
    for (let i = windowSize - 1; i < values.length; i++) {
      const window = values.slice(i - windowSize + 1, i + 1);
      result.push(this.mean(window));
    }
    return result;
  }
}

// Behavioral pattern analyzer
class BehavioralAnalyzer {
  constructor() {
    this.baseline = null;
    this.interactions = [];
    this.maxInteractions = 1000;
  }

  /**
   * Add interaction data for analysis
   * @param {Object} interaction - Interaction data
   */
  addInteraction(interaction) {
    this.interactions.push({
      timestamp: Date.now(),
      ...interaction
    });

    if (this.interactions.length > this.maxInteractions) {
      this.interactions.shift();
    }
  }

  /**
   * Build baseline from collected interactions
   * @param {number} minInteractions - Minimum interactions needed
   */
  buildBaseline(minInteractions = 100) {
    if (this.interactions.length < minInteractions) {
      return false;
    }

    const recent = this.interactions.slice(-minInteractions);

    this.baseline = {
      mouse: this.analyzeMousePatterns(recent),
      keyboard: this.analyzeKeyboardPatterns(recent),
      timing: this.analyzeTimingPatterns(recent),
      navigation: this.analyzeNavigationPatterns(recent),
      builtAt: Date.now(),
      sampleSize: recent.length
    };

    return true;
  }

  /**
   * Analyze mouse movement patterns
   * @param {Array} interactions - Interaction data
   * @returns {Object} Mouse pattern analysis
   */
  analyzeMousePatterns(interactions) {
    const mouseData = interactions.filter(i => i.type === 'mousemove' && i.velocity !== undefined);

    if (mouseData.length < 10) return null;

    const velocities = mouseData.map(d => d.velocity);
    const accelerations = mouseData.map(d => d.acceleration || 0);

    return {
      avgVelocity: Statistics.mean(velocities),
      stdVelocity: Statistics.standardDeviation(velocities),
      avgAcceleration: Statistics.mean(accelerations),
      stdAcceleration: Statistics.standardDeviation(accelerations),
      velocityPercentiles: {
        p25: Statistics.percentile(velocities, 25),
        p50: Statistics.percentile(velocities, 50),
        p75: Statistics.percentile(velocities, 75),
        p95: Statistics.percentile(velocities, 95)
      }
    };
  }

  /**
   * Analyze keyboard typing patterns
   * @param {Array} interactions - Interaction data
   * @returns {Object} Keyboard pattern analysis
   */
  analyzeKeyboardPatterns(interactions) {
    const keyData = interactions.filter(i => i.type === 'keydown' && i.key !== undefined);

    if (keyData.length < 20) return null;

    const intervals = [];
    for (let i = 1; i < keyData.length; i++) {
      intervals.push(keyData[i].timestamp - keyData[i-1].timestamp);
    }

    const keyFrequencies = {};
    keyData.forEach(k => {
      keyFrequencies[k.key] = (keyFrequencies[k.key] || 0) + 1;
    });

    return {
      avgInterval: Statistics.mean(intervals),
      stdInterval: Statistics.standardDeviation(intervals),
      totalKeys: keyData.length,
      uniqueKeys: Object.keys(keyFrequencies).length,
      keyFrequencies,
      intervalPercentiles: {
        p25: Statistics.percentile(intervals, 25),
        p50: Statistics.percentile(intervals, 50),
        p75: Statistics.percentile(intervals, 75)
      }
    };
  }

  /**
   * Analyze timing patterns
   * @param {Array} interactions - Interaction data
   * @returns {Object} Timing pattern analysis
   */
  analyzeTimingPatterns(interactions) {
    const timings = interactions.map(i => i.timestamp);
    const intervals = [];

    for (let i = 1; i < timings.length; i++) {
      intervals.push(timings[i] - timings[i-1]);
    }

    return {
      avgInterval: Statistics.mean(intervals),
      stdInterval: Statistics.standardDeviation(intervals),
      minInterval: Math.min(...intervals),
      maxInterval: Math.max(...intervals),
      intervalPercentiles: {
        p5: Statistics.percentile(intervals, 5),
        p25: Statistics.percentile(intervals, 25),
        p50: Statistics.percentile(intervals, 50),
        p75: Statistics.percentile(intervals, 75),
        p95: Statistics.percentile(intervals, 95)
      }
    };
  }

  /**
   * Analyze navigation patterns
   * @param {Array} interactions - Interaction data
   * @returns {Object} Navigation pattern analysis
   */
  analyzeNavigationPatterns(interactions) {
    const navData = interactions.filter(i => i.type === 'navigation');

    if (navData.length < 5) return null;

    const paths = navData.map(n => n.path || '');
    const timings = navData.map(n => n.duration || 0);

    return {
      avgPageDuration: Statistics.mean(timings),
      stdPageDuration: Statistics.standardDeviation(timings),
      commonPaths: this.getMostCommon(paths, 5),
      totalPages: navData.length
    };
  }

  /**
   * Get most common items in array
   * @param {Array} arr - Array to analyze
   * @param {number} n - Number of top items
   * @returns {Array} Most common items with counts
   */
  getMostCommon(arr, n = 5) {
    const counts = {};
    arr.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });

    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, n)
      .map(([item, count]) => ({ item, count }));
  }

  /**
   * Detect anomalies in new interaction
   * @param {Object} interaction - New interaction data
   * @returns {Object} Anomaly detection result
   */
  detectAnomaly(interaction) {
    if (!this.baseline) {
      return { isAnomaly: false, score: 0, reason: 'no_baseline' };
    }

    let totalScore = 0;
    const reasons = [];

    // Mouse anomaly detection
    if (interaction.type === 'mousemove' && interaction.velocity !== undefined) {
      const mouseBaseline = this.baseline.mouse;
      if (mouseBaseline) {
        const velocityZ = Statistics.zScore(
          interaction.velocity,
          mouseBaseline.avgVelocity,
          mouseBaseline.stdVelocity
        );

        if (velocityZ > 3) {
          totalScore += velocityZ;
          reasons.push('unusual_mouse_velocity');
        }

        if (interaction.acceleration !== undefined) {
          const accelZ = Statistics.zScore(
            interaction.acceleration,
            mouseBaseline.avgAcceleration,
            mouseBaseline.stdAcceleration
          );

          if (accelZ > 3) {
            totalScore += accelZ;
            reasons.push('unusual_mouse_acceleration');
          }
        }
      }
    }

    // Keyboard anomaly detection
    if (interaction.type === 'keydown') {
      const keyboardBaseline = this.baseline.keyboard;
      if (keyboardBaseline && interaction.interval !== undefined) {
        const intervalZ = Statistics.zScore(
          interaction.interval,
          keyboardBaseline.avgInterval,
          keyboardBaseline.stdInterval
        );

        if (intervalZ > 2.5) {
          totalScore += intervalZ;
          reasons.push('unusual_typing_interval');
        }
      }
    }

    // Timing anomaly detection
    const timingBaseline = this.baseline.timing;
    if (timingBaseline && interaction.interval !== undefined) {
      const timingZ = Statistics.zScore(
        interaction.interval,
        timingBaseline.avgInterval,
        timingBaseline.stdInterval
      );

      if (timingZ > 3) {
        totalScore += timingZ;
        reasons.push('unusual_timing_pattern');
      }
    }

    // Check for impossible human behaviors
    if (interaction.velocity > 5000) { // Extremely fast mouse movement
      totalScore += 5;
      reasons.push('impossible_mouse_speed');
    }

    if (interaction.interval < 10) { // Too fast typing
      totalScore += 3;
      reasons.push('impossible_typing_speed');
    }

    const isAnomaly = totalScore > 5;
    const severity = totalScore > 10 ? 'high' : totalScore > 5 ? 'medium' : 'low';

    return {
      isAnomaly,
      score: totalScore,
      severity,
      reasons,
      confidence: Math.min(totalScore / 10, 1)
    };
  }

  /**
   * Update baseline with new data
   * @param {number} weight - Weight for new data (0-1)
   */
  updateBaseline(weight = 0.1) {
    if (!this.baseline || this.interactions.length < 50) {
      return this.buildBaseline();
    }

    // Incremental update using weighted average
    const newBaseline = this.buildBaseline();
    if (!newBaseline) return false;

    // Merge baselines with weighting
    Object.keys(this.baseline).forEach(key => {
      if (typeof this.baseline[key] === 'object' && this.baseline[key] !== null) {
        Object.keys(this.baseline[key]).forEach(subKey => {
          if (typeof this.baseline[key][subKey] === 'number') {
            this.baseline[key][subKey] = this.baseline[key][subKey] * (1 - weight) +
                                       newBaseline[key][subKey] * weight;
          }
        });
      }
    });

    this.baseline.lastUpdated = Date.now();
    return true;
  }

  /**
   * Get baseline status
   * @returns {Object} Baseline status
   */
  getBaselineStatus() {
    return {
      hasBaseline: !!this.baseline,
      interactions: this.interactions.length,
      lastUpdated: this.baseline?.lastUpdated,
      sampleSize: this.baseline?.sampleSize,
      isReady: this.interactions.length >= 100
    };
  }
}

// Pattern matching for bot detection
class BotDetector {
  constructor() {
    this.patterns = {
      repetitive: {
        threshold: 0.8, // 80% similarity
        window: 10 // Check last 10 interactions
      },
      linear: {
        threshold: 0.9, // 90% linear correlation
        minPoints: 5
      },
      timing: {
        maxVariance: 0.1, // Maximum allowed variance for perfect timing
        minSamples: 20
      }
    };
  }

  /**
   * Detect repetitive patterns
   * @param {Array} interactions - Recent interactions
   * @returns {Object} Detection result
   */
  detectRepetitivePatterns(interactions) {
    if (interactions.length < this.patterns.repetitive.window * 2) {
      return { detected: false, score: 0 };
    }

    const recent = interactions.slice(-this.patterns.repetitive.window);
    const previous = interactions.slice(-this.patterns.repetitive.window * 2, -this.patterns.repetitive.window);

    let similarity = 0;
    let comparisons = 0;

    // Compare patterns between windows
    for (let i = 0; i < Math.min(recent.length, previous.length); i++) {
      if (recent[i].type === previous[i].type) {
        similarity++;
      }
      comparisons++;
    }

    const score = comparisons > 0 ? similarity / comparisons : 0;
    const detected = score >= this.patterns.repetitive.threshold;

    return {
      detected,
      score,
      type: 'repetitive'
    };
  }

  /**
   * Detect linear mouse movements (bots often move in straight lines)
   * @param {Array} mouseData - Mouse movement data
   * @returns {Object} Detection result
   */
  detectLinearMovements(mouseData) {
    const points = mouseData.filter(d => d.x !== undefined && d.y !== undefined);

    if (points.length < this.patterns.linear.minPoints) {
      return { detected: false, score: 0 };
    }

    // Calculate linearity using correlation coefficient
    const x = points.map(p => p.x);
    const y = points.map(p => p.y);

    const correlation = this.pearsonCorrelation(x, y);
    const linearity = Math.abs(correlation);

    const detected = linearity >= this.patterns.linear.threshold;

    return {
      detected,
      score: linearity,
      type: 'linear_movement',
      correlation
    };
  }

  /**
   * Detect perfect timing patterns (bots have exact intervals)
   * @param {Array} timings - Timing intervals
   * @returns {Object} Detection result
   */
  detectPerfectTiming(timings) {
    if (timings.length < this.patterns.timing.minSamples) {
      return { detected: false, score: 0 };
    }

    const variance = Statistics.variance(timings);
    const mean = Statistics.mean(timings);
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 0; // Coefficient of variation

    const detected = cv <= this.patterns.timing.maxVariance;

    return {
      detected,
      score: 1 - cv, // Higher score = more perfect timing
      type: 'perfect_timing',
      coefficientOfVariation: cv
    };
  }

  /**
   * Calculate Pearson correlation coefficient
   * @param {Array} x - X values
   * @param {Array} y - Y values
   * @returns {number} Correlation coefficient
   */
  pearsonCorrelation(x, y) {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Comprehensive bot detection
   * @param {Array} interactions - All recent interactions
   * @returns {Object} Bot detection result
   */
  detectBot(interactions) {
    const results = {
      isBot: false,
      score: 0,
      reasons: [],
      confidence: 0
    };

    // Check different bot detection methods
    const repetitive = this.detectRepetitivePatterns(interactions);
    if (repetitive.detected) {
      results.score += repetitive.score * 0.4;
      results.reasons.push('repetitive_patterns');
    }

    const mouseData = interactions.filter(i => i.type === 'mousemove');
    const linear = this.detectLinearMovements(mouseData);
    if (linear.detected) {
      results.score += linear.score * 0.3;
      results.reasons.push('linear_movements');
    }

    const timings = [];
    for (let i = 1; i < interactions.length; i++) {
      timings.push(interactions[i].timestamp - interactions[i-1].timestamp);
    }

    const timing = this.detectPerfectTiming(timings);
    if (timing.detected) {
      results.score += timing.score * 0.3;
      results.reasons.push('perfect_timing');
    }

    results.isBot = results.score >= 0.6; // 60% confidence threshold
    results.confidence = results.score;

    return results;
  }
}

// Main worker class
class MLWorker {
  constructor() {
    this.behavioralAnalyzer = new BehavioralAnalyzer();
    this.botDetector = new BotDetector();
    this.isInitialized = false;
  }

  /**
   * Initialize the worker
   */
  initialize() {
    this.isInitialized = true;
    this.postMessage({
      type: 'initialized',
      data: { status: 'ready' }
    });
  }

  /**
   * Process incoming messages
   * @param {MessageEvent} event - Worker message event
   */
  onMessage(event) {
    const { type, data, id } = event.data;

    try {
      let result;

      switch (type) {
      case 'initialize':
        result = this.initialize();
        break;

      case 'add_interaction':
        result = this.behavioralAnalyzer.addInteraction(data);
        break;

      case 'build_baseline':
        result = this.behavioralAnalyzer.buildBaseline(data.minInteractions);
        break;

      case 'detect_anomaly':
        result = this.behavioralAnalyzer.detectAnomaly(data);
        break;

      case 'detect_bot':
        result = this.botDetector.detectBot(data.interactions);
        break;

      case 'update_baseline':
        result = this.behavioralAnalyzer.updateBaseline(data.weight);
        break;

      case 'get_baseline_status':
        result = this.behavioralAnalyzer.getBaselineStatus();
        break;

      case 'analyze_patterns':
        result = this.analyzePatterns(data);
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
      }

      this.postMessage({
        type: 'result',
        id,
        success: true,
        data: result
      });

    } catch (error) {
      this.postMessage({
        type: 'result',
        id,
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Advanced pattern analysis
   * @param {Object} data - Analysis data
   * @returns {Object} Analysis result
   */
  analyzePatterns(data) {
    const { interactions, analysisType } = data;

    switch (analysisType) {
    case 'comprehensive':
      return {
        anomaly: this.behavioralAnalyzer.detectAnomaly(interactions[interactions.length - 1]),
        bot: this.botDetector.detectBot(interactions),
        baseline: this.behavioralAnalyzer.getBaselineStatus()
      };

    case 'behavioral':
      return {
        baseline: this.behavioralAnalyzer.baseline,
        patterns: {
          mouse: this.behavioralAnalyzer.analyzeMousePatterns(interactions),
          keyboard: this.behavioralAnalyzer.analyzeKeyboardPatterns(interactions),
          timing: this.behavioralAnalyzer.analyzeTimingPatterns(interactions)
        }
      };

    default:
      return { error: 'Unknown analysis type' };
    }
  }

  /**
   * Post message to main thread
   * @param {Object} message - Message to send
   */
  postMessage(message) {
    self.postMessage(message);
  }
}

// Worker instance
const mlWorker = new MLWorker();

// Message handler
self.onmessage = (event) => {
  mlWorker.onMessage(event);
};

// Export for potential import
export default MLWorker;