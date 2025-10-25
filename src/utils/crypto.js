/**
 * Cryptographic utilities for SHIELD.js
 * Provides encryption/decryption for local data storage
 * Uses Web Crypto API for secure client-side operations
 */

class CryptoUtils {
  constructor() {
    this.keyStore = new Map();
    this.algorithm = {
      name: 'AES-GCM',
      length: 256
    };
  }

  /**
   * Generate a new encryption key
   * @param {string} keyId - Unique identifier for the key (optional)
   * @returns {Promise<CryptoKey>} Generated key
   */
  async generateKey(keyId = 'default') {
    try {
      const key = await globalThis.crypto.subtle.generateKey(
        this.algorithm,
        true, // extractable
        ['encrypt', 'decrypt']
      );
      this.keyStore.set(keyId, key);
      return key;
    } catch (error) {
      console.error('Failed to generate encryption key:', error);
      throw new Error('Key generation failed');
    }
  }

  /**
   * Derive a key from password using PBKDF2
   * @param {string} password - User password
   * @param {string} salt - Salt for key derivation
   * @returns {Promise<CryptoKey>} Derived key
   */
  async deriveKeyFromPassword(password, salt) {
    try {
      const encoder = new TextEncoder();
      const keyMaterial = await globalThis.crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      const saltBuffer = encoder.encode(salt);

      return await globalThis.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: saltBuffer,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        this.algorithm,
        false,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.error('Failed to derive key from password:', error);
      throw new Error('Key derivation failed');
    }
  }

  /**
   * Encrypt data using AES-GCM
   * @param {CryptoKey} key - Encryption key
   * @param {string|object} data - Data to encrypt
   * @returns {Promise<string>} Base64 encoded encrypted data with IV
   */
  async encrypt(key, data) {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(typeof data === 'string' ? data : JSON.stringify(data));

      const iv = globalThis.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM

      const encrypted = await globalThis.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        dataBuffer
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      // Convert to base64 for storage
      return this.arrayBufferToBase64(combined);
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt data using AES-GCM
   * @param {CryptoKey} key - Decryption key
   * @param {string} encryptedData - Base64 encoded encrypted data with IV
   * @returns {Promise<string|object>} Decrypted data
   */
  async decrypt(key, encryptedData) {
    try {
      const combined = this.base64ToArrayBuffer(encryptedData);
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const decrypted = await globalThis.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      const decryptedString = decoder.decode(decrypted);

      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(decryptedString);
      } catch {
        return decryptedString;
      }
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Generate a cryptographically secure random salt
   * @param {number} length - Length of salt in bytes
   * @returns {string} Base64 encoded salt
   */
  generateSalt(length = 16) {
    const salt = crypto.getRandomValues(new Uint8Array(length));
    return this.arrayBufferToBase64(salt);
  }

  /**
   * Create a hash of data using SHA-256
   * @param {string} data - Data to hash
   * @returns {Promise<string>} Hex encoded hash
   */
  async hash(data) {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', dataBuffer);
      return this.arrayBufferToHex(hashBuffer);
    } catch (error) {
      console.error('Hashing failed:', error);
      throw new Error('Hashing failed');
    }
  }

  /**
   * Generate a unique identifier
   * @returns {string} UUID v4
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Convert ArrayBuffer to base64
   * @param {ArrayBuffer} buffer - Buffer to convert
   * @returns {string} Base64 string
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 to ArrayBuffer
   * @param {string} base64 - Base64 string
   * @returns {ArrayBuffer} Buffer
   */
  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Convert ArrayBuffer to hex
   * @param {ArrayBuffer} buffer - Buffer to convert
   * @returns {string} Hex string
   */
  arrayBufferToHex(buffer) {
    const byteArray = new Uint8Array(buffer);
    const hexCodes = [...byteArray].map(value => {
      const hexCode = value.toString(16);
      const paddedHexCode = hexCode.padStart(2, '0');
      return paddedHexCode;
    });
    return hexCodes.join('');
  }

  /**
   * Get or create a key for a specific purpose
   * @param {string} purpose - Purpose identifier
   * @returns {Promise<CryptoKey>} Key for the purpose
   */
  async getKeyForPurpose(purpose) {
    if (this.keyStore.has(purpose)) {
      return this.keyStore.get(purpose);
    }

    // Generate a new key for this purpose
    const key = await this.generateKey(purpose);
    return key;
  }

  /**
   * Generate a key from password (alias for deriveKeyFromPassword for compatibility)
   * @param {string} password - User password
   * @param {string|Uint8Array} salt - Salt for key derivation
   * @returns {Promise<CryptoKey>} Derived key
   */
  async generateKeyFromPassword(password, salt) {
    return this.deriveKeyFromPassword(password, salt);
  }

  /**
   * Generate random bytes
   * @param {number} length - Number of bytes to generate
   * @returns {Uint8Array} Random bytes
   */
  generateRandomBytes(length) {
    const array = new Uint8Array(length);
    globalThis.crypto.getRandomValues(array);
    return array;
  }
}

// Export singleton instance
const cryptoUtils = new CryptoUtils();
export default cryptoUtils;