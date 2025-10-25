/**
 * Behavioral Learning Engine for SHIELD.js
 * AI-powered user behavior profiling and anomaly detection
 * Uses Web Worker for performance and integrates with local storage
 */

import logger from '../utils/logger.js';
import storageManager from '../utils/storage.js';

class BehaviorLearningEngine {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
    this.interactions = [];
    this.maxInteractions = 1000;
    this.baseline = null;
    this.learningMode = true;
    this.sensitivity = 0.7; // 0-1 scale
    this.pendingRequests = new Map();
    this.requestId = 0;

    this.initWorker();
  }

  /**
   * Initialize the Web Worker
   */
  async initWorker() {
    try {
      this.worker = new Worker('./workers/ml-worker.js');

      this.worker.onmessage = (event) => {
        this.handleWorkerMessage(event);
      };

      this.worker.onerror = (error) => {
        logger.error('ML Worker error', { error: error.message });
      };

      // Initialize worker
      await this.sendToWorker('initialize');

      this.isInitialized = true;
      logger.info('Behavioral Learning Engine initialized');
    } catch (error) {
      logger.error('Failed to initialize ML Worker', {}, error);
      // Fallback to main thread processing
      this.isInitialized = false;
    }
  }

  /**
   * Send message to worker
   * @param {string} type - Message type
   * @param {Object} data - Message data
   * @returns {Promise} Response promise
   */
  sendToWorker(type, data = {}) {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not available'));
        return;
      }

      const id = ++this.requestId;
      this.pendingRequests.set(id, { resolve, reject });

      this.worker.postMessage({
        type,
        data,
        id
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Worker request timeout'));
        }
      }, 30000);
    });
  }

  /**
   * Handle messages from worker
   * @param {MessageEvent} event - Worker message
   */
  handleWorkerMessage(event) {
    const { type, id, success, data, error } = event.data;

    if (type === 'result') {
      const pending = this.pendingRequests.get(id);
      if (pending) {
        this.pendingRequests.delete(id);
        if (success) {
          pending.resolve(data);
        } else {
          pending.reject(new Error(error));
        }
      }
    } else if (type === 'initialized') {
      logger.debug('ML Worker initialized successfully');
    }
  }

  /**
   * Record user interaction
   * @param {string} type - Interaction type
   * @param {Object} data - Interaction data
   */
  async recordInteraction(type, data = {}) {
    const interaction = {
      type,
      timestamp: Date.now(),
      ...data
    };

    // Add timing information
    if (this.interactions.length > 0) {
      const lastInteraction = this.interactions[this.interactions.length - 1];
      interaction.interval = interaction.timestamp - lastInteraction.timestamp;
    }

    this.interactions.push(interaction);

    // Maintain buffer size
    if (this.interactions.length > this.maxInteractions) {
      this.interactions.shift();
    }

    // Send to worker for analysis
    if (this.isInitialized) {
      try {
        await this.sendToWorker('add_interaction', interaction);
      } catch (error) {
        logger.debug('Worker interaction recording failed, continuing', { error: error.message });
      }
    }

    // Auto-save interactions periodically
    if (this.interactions.length % 100 === 0) {
      this.saveInteractions();
    }
  }

  /**
   * Build behavioral baseline
   * @param {number} minInteractions - Minimum interactions needed
   * @returns {Promise<boolean>} Success status
   */
  async buildBaseline(minInteractions = 100) {
    if (this.interactions.length < minInteractions) {
      logger.debug('Not enough interactions for baseline', {
        current: this.interactions.length,
        required: minInteractions
      });
      return false;
    }

    try {
      if (this.isInitialized) {
        const success = await this.sendToWorker('build_baseline', { minInteractions });
        if (success) {
          this.baseline = await this.getBaselineStatus();
          await this.saveBaseline();
          logger.info('Behavioral baseline built successfully');
          return true;
        }
      } else {
        // Fallback baseline building
        this.baseline = this.buildBaselineFallback();
        await this.saveBaseline();
        return true;
      }
    } catch (error) {
      logger.error('Failed to build baseline', {}, error);
      return false;
    }

    return false;
  }

  /**
   * Fallback baseline building for when worker is unavailable
   * @returns {Object} Baseline data
   */
  buildBaselineFallback() {
    const recent = this.interactions.slice(-100);

    return {
      mouse: this.analyzeMousePatternsFallback(recent),
      keyboard: this.analyzeKeyboardPatternsFallback(recent),
      timing: this.analyzeTimingPatternsFallback(recent),
      builtAt: Date.now(),
      sampleSize: recent.length
    };
  }

  /**
   * Simple mouse pattern analysis fallback
   * @param {Array} interactions - Interaction data
   * @returns {Object} Mouse patterns
   */
  analyzeMousePatternsFallback(interactions) {
    const mouseData = interactions.filter(i => i.type === 'mousemove' && i.velocity !== undefined);

    if (mouseData.length < 10) return null;

    const velocities = mouseData.map(d => d.velocity);
    const avgVelocity = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;

    return {
      avgVelocity,
      sampleSize: velocities.length
    };
  }

  /**
   * Simple keyboard pattern analysis fallback
   * @param {Array} interactions - Interaction data
   * @returns {Object} Keyboard patterns
   */
  analyzeKeyboardPatternsFallback(interactions) {
    const keyData = interactions.filter(i => i.type === 'keydown');

    if (keyData.length < 20) return null;

    const intervals = [];
    for (let i = 1; i < keyData.length; i++) {
      intervals.push(keyData[i].timestamp - keyData[i-1].timestamp);
    }

    const avgInterval = intervals.reduce((sum, v) => sum + v, 0) / intervals.length;

    return {
      avgInterval,
      sampleSize: keyData.length
    };
  }

  /**
   * Simple timing pattern analysis fallback
   * @param {Array} interactions - Interaction data
   * @returns {Object} Timing patterns
   */
  analyzeTimingPatternsFallback(interactions) {
    const intervals = [];
    for (let i = 1; i < interactions.length; i++) {
      intervals.push(interactions[i].timestamp - interactions[i-1].timestamp);
    }

    const avgInterval = intervals.reduce((sum, v) => sum + v, 0) / intervals.length;

    return {
      avgInterval,
      sampleSize: intervals.length
    };
  }

  /**
   * Detect behavioral anomalies
   * @param {Object} interaction - Current interaction
   * @returns {Promise<Object>} Anomaly detection result
   */
  async detectAnomaly(interaction) {
    if (!this.baseline) {
      return { isAnomaly: false, score: 0, reason: 'no_baseline' };
    }

    try {
      if (this.isInitialized) {
        return await this.sendToWorker('detect_anomaly', interaction);
      } else {
        return this.detectAnomalyFallback(interaction);
      }
    } catch (error) {
      logger.debug('Worker anomaly detection failed, using fallback', { error: error.message });
      return this.detectAnomalyFallback(interaction);
    }
  }

  /**
   * Fallback anomaly detection
   * @param {Object} interaction - Current interaction
   * @returns {Object} Anomaly result
   */
  detectAnomalyFallback(interaction) {
    if (!this.baseline) {
      return { isAnomaly: false, score: 0, reason: 'no_baseline' };
    }

    let score = 0;
    const reasons = [];

    // Simple velocity check
    if (interaction.type === 'mousemove' && interaction.velocity !== undefined) {
      const mouseBaseline = this.baseline.mouse;
      if (mouseBaseline && mouseBaseline.avgVelocity) {
        const deviation = Math.abs(interaction.velocity - mouseBaseline.avgVelocity);
        const relativeDeviation = deviation / mouseBaseline.avgVelocity;

        if (relativeDeviation > 2) {
          score += relativeDeviation;
          reasons.push('unusual_velocity');
        }
      }
    }

    // Simple timing check
    if (interaction.interval !== undefined) {
      const timingBaseline = this.baseline.timing;
      if (timingBaseline && timingBaseline.avgInterval) {
        const deviation = Math.abs(interaction.interval - timingBaseline.avgInterval);
        const relativeDeviation = deviation / timingBaseline.avgInterval;

        if (relativeDeviation > 1.5) {
          score += relativeDeviation * 0.5;
          reasons.push('unusual_timing');
        }
      }
    }

    const isAnomaly = score > this.sensitivity * 3;

    return {
      isAnomaly,
      score,
      severity: score > 2 ? 'high' : score > 1 ? 'medium' : 'low',
      reasons,
      confidence: Math.min(score / 5, 1)
    };
  }

  /**
   * Detect bot-like behavior
   * @param {Array} interactions - Recent interactions
   * @returns {Promise<Object>} Bot detection result
   */
  async detectBot(interactions = null) {
    const data = interactions || this.interactions.slice(-50);

    if (data.length < 20) {
      return { isBot: false, score: 0, reason: 'insufficient_data' };
    }

    try {
      if (this.isInitialized) {
        return await this.sendToWorker('detect_bot', { interactions: data });
      } else {
        return this.detectBotFallback(data);
      }
    } catch (error) {
      logger.debug('Worker bot detection failed, using fallback', { error: error.message });
      return this.detectBotFallback(data);
    }
  }

  /**
   * Fallback bot detection
   * @param {Array} interactions - Interaction data
   * @returns {Object} Bot detection result
   */
  detectBotFallback(interactions) {
    let score = 0;
    const reasons = [];

    // Check for perfect timing
    const intervals = [];
    for (let i = 1; i < interactions.length; i++) {
      intervals.push(interactions[i].timestamp - interactions[i-1].timestamp);
    }

    if (intervals.length > 10) {
      const avgInterval = intervals.reduce((sum, v) => sum + v, 0) / intervals.length;
      const variance = intervals.reduce((sum, v) => sum + Math.pow(v - avgInterval, 2), 0) / intervals.length;
      const cv = Math.sqrt(variance) / avgInterval;

      if (cv < 0.1) { // Very low variance indicates bot-like behavior
        score += 0.5;
        reasons.push('perfect_timing');
      }
    }

    // Check for repetitive patterns
    if (interactions.length > 20) {
      const recent = interactions.slice(-10);
      const previous = interactions.slice(-20, -10);

      let similarity = 0;
      for (let i = 0; i < recent.length && i < previous.length; i++) {
        if (recent[i].type === previous[i].type) {
          similarity++;
        }
      }

      const similarityRatio = similarity / Math.min(recent.length, previous.length);
      if (similarityRatio > 0.8) {
        score += similarityRatio * 0.3;
        reasons.push('repetitive_patterns');
      }
    }

    return {
      isBot: score > 0.4,
      score,
      reasons,
      confidence: score
    };
  }

  /**
   * Update baseline with new learning data
   * @param {number} weight - Learning weight (0-1)
   * @returns {Promise<boolean>} Success status
   */
  async updateBaseline(weight = 0.1) {
    if (!this.baseline) {
      return this.buildBaseline();
    }

    try {
      if (this.isInitialized) {
        const success = await this.sendToWorker('update_baseline', { weight });
        if (success) {
          this.baseline = await this.getBaselineStatus();
          await this.saveBaseline();
          return true;
        }
      } else {
        // Simple baseline update
        const newBaseline = this.buildBaselineFallback();
        if (newBaseline) {
          // Weighted update
          Object.keys(this.baseline).forEach(key => {
            if (this.baseline[key] && typeof this.baseline[key] === 'object') {
              Object.keys(this.baseline[key]).forEach(subKey => {
                if (typeof this.baseline[key][subKey] === 'number' && newBaseline[key][subKey]) {
                  this.baseline[key][subKey] = this.baseline[key][subKey] * (1 - weight) +
                                             newBaseline[key][subKey] * weight;
                }
              });
            }
          });
          this.baseline.lastUpdated = Date.now();
          await this.saveBaseline();
          return true;
        }
      }
    } catch (error) {
      logger.error('Failed to update baseline', {}, error);
      return false;
    }

    return false;
  }

  /**
   * Get baseline status
   * @returns {Promise<Object>} Baseline status
   */
  async getBaselineStatus() {
    try {
      if (this.isInitialized) {
        return await this.sendToWorker('get_baseline_status');
      } else {
        return {
          hasBaseline: !!this.baseline,
          interactions: this.interactions.length,
          lastUpdated: this.baseline?.lastUpdated,
          sampleSize: this.baseline?.sampleSize,
          isReady: this.interactions.length >= 100
        };
      }
    } catch (error) {
      return {
        hasBaseline: false,
        interactions: this.interactions.length,
        error: error.message
      };
    }
  }

  /**
   * Load saved interactions and baseline from storage
   * @returns {Promise<void>}
   */
  async loadFromStorage() {
    try {
      const profile = await storageManager.getBehaviorProfile('current');
      if (profile) {
        this.interactions = profile.interactions || [];
        this.baseline = profile.baseline || null;
        logger.info('Loaded behavioral data from storage', {
          interactions: this.interactions.length,
          hasBaseline: !!this.baseline
        });
      }
    } catch (error) {
      logger.error('Failed to load behavioral data from storage', {}, error);
    }
  }

  /**
   * Save current interactions and baseline to storage
   * @returns {Promise<void>}
   */
  async saveInteractions() {
    try {
      const profile = {
        id: 'current',
        userId: 'current',
        interactions: this.interactions.slice(-500), // Save last 500 interactions
        baseline: this.baseline,
        lastSaved: Date.now()
      };

      await storageManager.storeBehaviorProfile(profile);
    } catch (error) {
      logger.error('Failed to save interactions', {}, error);
    }
  }

  /**
   * Save baseline to storage
   * @returns {Promise<void>}
   */
  async saveBaseline() {
    await this.saveInteractions(); // Baseline is saved as part of profile
  }

  /**
   * Set learning mode
   * @param {boolean} enabled - Whether learning mode is enabled
   */
  setLearningMode(enabled) {
    this.learningMode = enabled;
    logger.info('Learning mode ' + (enabled ? 'enabled' : 'disabled'));
  }

  /**
   * Set detection sensitivity
   * @param {number} sensitivity - Sensitivity level (0-1)
   */
  setSensitivity(sensitivity) {
    this.sensitivity = Math.max(0, Math.min(1, sensitivity));
    logger.info('Detection sensitivity set to', { sensitivity: this.sensitivity });
  }

  /**
   * Get engine status
   * @returns {Object} Engine status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      interactions: this.interactions.length,
      hasBaseline: !!this.baseline,
      learningMode: this.learningMode,
      sensitivity: this.sensitivity,
      workerAvailable: !!this.worker
    };
  }

  /**
   * Reset the engine (clear all data)
   * @returns {Promise<void>}
   */
  async reset() {
    this.interactions = [];
    this.baseline = null;

    try {
      await storageManager.clearStore('behaviorProfiles');
      logger.info('Behavioral learning engine reset');
    } catch (error) {
      logger.error('Failed to clear stored behavioral data', {}, error);
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    this.pendingRequests.clear();
    this.interactions = [];
    this.baseline = null;
  }
}

export default BehaviorLearningEngine;