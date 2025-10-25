/**
 * IndexedDB storage manager for SHIELD.js
 * Provides encrypted local storage for behavior profiles, threat logs, and configuration
 */

import cryptoUtils from './crypto.js';

class StorageManager {
  constructor() {
    this.dbName = 'SHIELD_Firewall_DB';
    this.version = 1;
    this.db = null;
    this.stores = {
      behaviorProfiles: 'behaviorProfiles',
      threatLog: 'threatLog',
      configuration: 'configuration'
    };
    this.encryptionKey = null;
  }

  /**
   * Initialize the database
   * @returns {Promise<void>}
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('SHIELD Database initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Behavior profiles store
        if (!db.objectStoreNames.contains(this.stores.behaviorProfiles)) {
          const behaviorStore = db.createObjectStore(this.stores.behaviorProfiles, { keyPath: 'id' });
          behaviorStore.createIndex('userId', 'userId', { unique: false });
          behaviorStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        }

        // Threat log store
        if (!db.objectStoreNames.contains(this.stores.threatLog)) {
          const threatStore = db.createObjectStore(this.stores.threatLog, { keyPath: 'id' });
          threatStore.createIndex('timestamp', 'timestamp', { unique: false });
          threatStore.createIndex('type', 'type', { unique: false });
          threatStore.createIndex('severity', 'severity', { unique: false });
        }

        // Configuration store
        if (!db.objectStoreNames.contains(this.stores.configuration)) {
          db.createObjectStore(this.stores.configuration, { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Set encryption key for data storage
   * @param {CryptoKey} key - Encryption key
   */
  setEncryptionKey(key) {
    this.encryptionKey = key;
  }

  /**
   * Generate and set a new encryption key
   * @returns {Promise<CryptoKey>} Generated key
   */
  async generateEncryptionKey() {
    this.encryptionKey = await cryptoUtils.generateKey('storage');
    return this.encryptionKey;
  }

  /**
   * Store behavior profile data
   * @param {Object} profile - Behavior profile data
   * @returns {Promise<void>}
   */
  async storeBehaviorProfile(profile) {
    if (!this.db) await this.init();
    if (!this.encryptionKey) await this.generateEncryptionKey();

    const encryptedData = await cryptoUtils.encrypt(this.encryptionKey, profile);

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.stores.behaviorProfiles], 'readwrite');
      const store = transaction.objectStore(this.stores.behaviorProfiles);

      const request = store.put({
        id: profile.id || cryptoUtils.generateUUID(),
        data: encryptedData,
        userId: profile.userId,
        lastUpdated: Date.now(),
        version: 1
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Retrieve behavior profile data
   * @param {string} profileId - Profile ID
   * @returns {Promise<Object|null>} Decrypted profile data
   */
  async getBehaviorProfile(profileId) {
    if (!this.db) await this.init();
    if (!this.encryptionKey) await this.generateEncryptionKey();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.stores.behaviorProfiles], 'readonly');
      const store = transaction.objectStore(this.stores.behaviorProfiles);

      const request = store.get(profileId);

      request.onsuccess = async () => {
        if (request.result) {
          try {
            const decryptedData = await cryptoUtils.decrypt(this.encryptionKey, request.result.data);
            resolve(decryptedData);
          } catch (error) {
            console.error('Failed to decrypt behavior profile:', error);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all behavior profiles for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of behavior profiles
   */
  async getBehaviorProfiles(userId) {
    if (!this.db) await this.init();
    if (!this.encryptionKey) await this.generateEncryptionKey();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.stores.behaviorProfiles], 'readonly');
      const store = transaction.objectStore(this.stores.behaviorProfiles);
      const index = store.index('userId');

      const request = index.getAll(userId);

      request.onsuccess = async () => {
        const profiles = [];
        for (const item of request.result) {
          try {
            const decryptedData = await cryptoUtils.decrypt(this.encryptionKey, item.data);
            profiles.push(decryptedData);
          } catch (error) {
            console.error('Failed to decrypt profile:', error);
          }
        }
        resolve(profiles);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Log a threat event
   * @param {Object} threat - Threat data
   * @returns {Promise<void>}
   */
  async logThreat(threat) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.stores.threatLog], 'readwrite');
      const store = transaction.objectStore(this.stores.threatLog);

      const threatEntry = {
        id: cryptoUtils.generateUUID(),
        timestamp: Date.now(),
        type: threat.type || 'unknown',
        severity: threat.severity || 'low',
        details: threat.details || {},
        action: threat.action || 'logged',
        url: threat.url || window.location.href,
        userAgent: navigator.userAgent,
        ...threat
      };

      const request = store.put(threatEntry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get threat logs with optional filtering
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of threat logs
   */
  async getThreatLogs(filters = {}) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.stores.threatLog], 'readonly');
      const store = transaction.objectStore(this.stores.threatLog);

      let request;
      if (filters.type) {
        const index = store.index('type');
        request = index.getAll(filters.type);
      } else if (filters.severity) {
        const index = store.index('severity');
        request = index.getAll(filters.severity);
      } else if (filters.since) {
        const index = store.index('timestamp');
        const range = IDBKeyRange.lowerBound(filters.since);
        request = index.openCursor(range);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        let results = request.result;

        // Handle cursor results
        if (results && typeof results.continue === 'function') {
          results = [];
          let cursor = request.result;
          while (cursor) {
            results.push(cursor.value);
            cursor = cursor.continue();
          }
        }

        // Apply additional filters
        if (filters.limit) {
          results = results.slice(-filters.limit);
        }

        resolve(results || []);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Store configuration data
   * @param {string} key - Configuration key
   * @param {any} value - Configuration value
   * @returns {Promise<void>}
   */
  async setConfig(key, value) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.stores.configuration], 'readwrite');
      const store = transaction.objectStore(this.stores.configuration);

      const request = store.put({
        key,
        value,
        updatedAt: Date.now()
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get configuration data
   * @param {string} key - Configuration key
   * @returns {Promise<any>} Configuration value
   */
  async getConfig(key) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.stores.configuration], 'readonly');
      const store = transaction.objectStore(this.stores.configuration);

      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result ? request.result.value : null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all configuration data
   * @returns {Promise<Object>} Configuration object
   */
  async getAllConfig() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.stores.configuration], 'readonly');
      const store = transaction.objectStore(this.stores.configuration);

      const request = store.getAll();

      request.onsuccess = () => {
        const config = {};
        request.result.forEach(item => {
          config[item.key] = item.value;
        });
        resolve(config);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all data from a store
   * @param {string} storeName - Store name
   * @returns {Promise<void>}
   */
  async clearStore(storeName) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all stored data
   * @returns {Promise<void>}
   */
  async clearAllData() {
    for (const storeName of Object.values(this.stores)) {
      await this.clearStore(storeName);
    }
  }

  /**
   * Get storage statistics
   * @returns {Promise<Object>} Storage statistics
   */
  async getStorageStats() {
    if (!this.db) await this.init();

    const stats = {};

    for (const [storeKey, storeName] of Object.entries(this.stores)) {
      const count = await this.getStoreCount(storeName);
      stats[storeKey] = { count };
    }

    return stats;
  }

  /**
   * Get count of items in a store
   * @param {string} storeName - Store name
   * @returns {Promise<number>} Item count
   */
  async getStoreCount(storeName) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);

      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Export all data for backup
   * @returns {Promise<Object>} Exported data
   */
  async exportData() {
    if (!this.db) await this.init();

    const data = {
      behaviorProfiles: [],
      threatLog: [],
      configuration: {},
      exportDate: Date.now(),
      version: this.version
    };

    // Export behavior profiles
    for (const [storeKey, storeName] of Object.entries(this.stores)) {
      if (storeName === this.stores.behaviorProfiles) {
        const profiles = await this.getBehaviorProfiles('current'); // Assuming single user for now
        data.behaviorProfiles = profiles;
      } else if (storeName === this.stores.threatLog) {
        data.threatLog = await this.getThreatLogs();
      } else if (storeName === this.stores.configuration) {
        data.configuration = await this.getAllConfig();
      }
    }

    return data;
  }

  /**
   * Initialize the database (alias for init for compatibility)
   * @returns {Promise<void>}
   */
  async initialize() {
    return this.init();
  }
}

// Export singleton instance
const storageManager = new StorageManager();
export default storageManager;