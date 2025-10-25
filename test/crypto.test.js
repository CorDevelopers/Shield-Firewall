/**
 * Crypto Utilities Test Suite
 * Tests for encryption, decryption, and security functions
 */

import cryptoUtils from '../src/utils/crypto.js';

describe('CryptoUtils', () => {
  let cryptoUtilsInstance;

  beforeEach(() => {
    cryptoUtilsInstance = cryptoUtils;
  });

  describe('Key Generation', () => {
    test('should generate encryption key', async () => {
      const key = await cryptoUtilsInstance.generateKey();
      expect(key).toBeDefined();
      expect(key.type).toBe('secret');
      expect(key.algorithm.name).toBe('AES-GCM');
    });

    test('should generate key from password', async () => {
      const password = 'test-password-123';
      const key = await cryptoUtilsInstance.generateKeyFromPassword(password);
      expect(key).toBeDefined();
      expect(key.type).toBe('secret');
      expect(key.algorithm.name).toBe('AES-GCM');
    });

    test('should generate different keys for different passwords', async () => {
      const password1 = 'password1';
      const password2 = 'password2';
      const key1 = await cryptoUtilsInstance.generateKeyFromPassword(password1);
      const key2 = await cryptoUtilsInstance.generateKeyFromPassword(password2);
      expect(key1).not.toEqual(key2);
    });
  });

  describe('Encryption/Decryption', () => {
    test('should encrypt and decrypt data correctly', async () => {
      const data = 'Hello, World!';
      const key = await cryptoUtilsInstance.generateKey();
      const encrypted = await cryptoUtilsInstance.encrypt(data, key);
      const decrypted = await cryptoUtilsInstance.decrypt(encrypted, key);
      expect(decrypted).toBe(data);
    });

    test('should handle different data types', async () => {
      const testData = [
        'string data',
        { object: 'data', number: 42 },
        [1, 2, 3, 'four'],
        null,
        undefined
      ];

      const key = await cryptoUtilsInstance.generateKey();

      for (const data of testData) {
        const encrypted = await cryptoUtilsInstance.encrypt(data, key);
        const decrypted = await cryptoUtilsInstance.decrypt(encrypted, key);
        expect(decrypted).toEqual(data);
      }
    });

    test('should fail decryption with wrong key', async () => {
      const data = 'Secret message';
      const key1 = await cryptoUtilsInstance.generateKey();
      const key2 = await cryptoUtilsInstance.generateKey();
      const encrypted = await cryptoUtilsInstance.encrypt(data, key1);

      await expect(cryptoUtilsInstance.decrypt(encrypted, key2)).rejects.toThrow();
    });
  });

  describe('Hashing', () => {
    test('should generate SHA-256 hash', async () => {
      const data = 'test data';
      const hash = await cryptoUtilsInstance.hash(data);
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA-256 produces 64 character hex string
    });

    test('should generate consistent hashes', async () => {
      const data = 'consistent data';
      const hash1 = await cryptoUtilsInstance.hash(data);
      const hash2 = await cryptoUtilsInstance.hash(data);
      expect(hash1).toBe(hash2);
    });

    test('should generate different hashes for different data', async () => {
      const data1 = 'data one';
      const data2 = 'data two';
      const hash1 = await cryptoUtilsInstance.hash(data1);
      const hash2 = await cryptoUtilsInstance.hash(data2);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Security Properties', () => {
    test('should use secure random values', async () => {
      const key1 = await cryptoUtilsInstance.generateKey();
      const key2 = await cryptoUtilsInstance.generateKey();
      expect(key1).not.toEqual(key2);
    });

    test('should implement proper key derivation', async () => {
      const password = 'test-password';
      const salt = 'test-salt';
      const key1 = await cryptoUtilsInstance.generateKeyFromPassword(password, salt);
      const key2 = await cryptoUtilsInstance.generateKeyFromPassword(password, salt);
      expect(key1).toEqual(key2); // Same password and salt should produce same key
    });

    test('should handle large data encryption', async () => {
      const largeData = 'x'.repeat(10000); // 10KB of data
      const key = await cryptoUtilsInstance.generateKey();
      const encrypted = await cryptoUtilsInstance.encrypt(largeData, key);
      const decrypted = await cryptoUtilsInstance.decrypt(encrypted, key);
      expect(decrypted).toBe(largeData);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid key gracefully', async () => {
      const data = 'test data';
      const invalidKey = 'not-a-key';

      await expect(cryptoUtilsInstance.encrypt(data, invalidKey)).rejects.toThrow();
      await expect(cryptoUtilsInstance.decrypt(data, invalidKey)).rejects.toThrow();
    });

    test('should handle corrupted encrypted data', async () => {
      const data = 'test data';
      const key = await cryptoUtilsInstance.generateKey();
      const encrypted = await cryptoUtilsInstance.encrypt(data, key);

      // Corrupt the encrypted data
      const corrupted = encrypted.slice(0, -10) + 'corrupted';

      await expect(cryptoUtilsInstance.decrypt(corrupted, key)).rejects.toThrow();
    });

    test('should handle empty data', async () => {
      const key = await cryptoUtilsInstance.generateKey();
      const encrypted = await cryptoUtilsInstance.encrypt('', key);
      const decrypted = await cryptoUtilsInstance.decrypt(encrypted, key);
      expect(decrypted).toBe('');
    });
  });

  describe('Performance Benchmarks', () => {
    test('should meet encryption performance requirements', async () => {
      const data = 'x'.repeat(1000); // 1KB data
      const key = await cryptoUtilsInstance.generateKey();

      const startTime = Date.now();
      for (let i = 0; i < 10; i++) {
        await cryptoUtilsInstance.encrypt(data, key);
      }
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should encrypt 10KB in less than 100ms (reasonable performance)
      expect(totalTime).toBeLessThan(100);
    });

    test('should meet decryption performance requirements', async () => {
      const data = 'x'.repeat(1000); // 1KB data
      const key = await cryptoUtilsInstance.generateKey();
      const encrypted = await cryptoUtilsInstance.encrypt(data, key);

      const startTime = Date.now();
      for (let i = 0; i < 10; i++) {
        await cryptoUtilsInstance.decrypt(encrypted, key);
      }
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should decrypt 10KB in less than 100ms (reasonable performance)
      expect(totalTime).toBeLessThan(100);
    });
  });

  describe('Encryption/Decryption', () => {
    test('should encrypt and decrypt data correctly', async () => {
      const data = 'sensitive information';
      const key = await cryptoUtils.generateKey();

      const encrypted = await cryptoUtils.encrypt(data, key);
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe(data);

      const decrypted = await cryptoUtils.decrypt(encrypted, key);
      expect(decrypted).toBe(data);
    });

    test('should handle different data types', async () => {
      const testData = [
        'string data',
        JSON.stringify({ key: 'value', number: 42 }),
        'special characters: !@#$%^&*()',
        'unicode: 你好世界'
      ];

      const key = await cryptoUtils.generateKey();

      for (const data of testData) {
        const encrypted = await cryptoUtils.encrypt(data, key);
        const decrypted = await cryptoUtils.decrypt(encrypted, key);
        expect(decrypted).toBe(data);
      }
    });

    test('should fail decryption with wrong key', async () => {
      const data = 'secret data';
      const key1 = await cryptoUtils.generateKey();
      const key2 = await cryptoUtils.generateKey();

      const encrypted = await cryptoUtils.encrypt(data, key1);

      await expect(cryptoUtils.decrypt(encrypted, key2)).rejects.toThrow();
    });
  });

  describe('Hashing', () => {
    test('should generate SHA-256 hash', async () => {
      const data = 'test data for hashing';
      const hash = await cryptoUtils.hash(data);
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA-256 produces 64 character hex string
    });

    test('should generate consistent hashes', async () => {
      const data = 'consistent data';
      const hash1 = await cryptoUtils.hash(data);
      const hash2 = await cryptoUtils.hash(data);
      expect(hash1).toBe(hash2);
    });

    test('should generate different hashes for different data', async () => {
      const hash1 = await cryptoUtils.hash('data1');
      const hash2 = await cryptoUtils.hash('data2');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Security Properties', () => {
    test('should use secure random values', () => {
      const random1 = cryptoUtils.generateRandomBytes(32);
      const random2 = cryptoUtils.generateRandomBytes(32);
      expect(random1).not.toEqual(random2);
      expect(random1.length).toBe(32);
      expect(random2.length).toBe(32);
    });

    test('should implement proper key derivation', async () => {
      const password = 'weak-password';
      const salt = cryptoUtils.generateRandomBytes(16);

      const key1 = await cryptoUtils.deriveKeyFromPassword(password, salt);
      const key2 = await cryptoUtils.deriveKeyFromPassword(password, salt);

      // Same password and salt should produce same key
      expect(key1).toEqual(key2);

      // Different salt should produce different key
      const differentSalt = cryptoUtils.generateRandomBytes(16);
      const key3 = await cryptoUtils.deriveKeyFromPassword(password, differentSalt);
      expect(key1).not.toEqual(key3);
    });

    test('should handle large data encryption', async () => {
      const largeData = 'x'.repeat(1000000); // 1MB of data
      const key = await cryptoUtils.generateKey();

      const startTime = performance.now();
      const encrypted = await cryptoUtils.encrypt(largeData, key);
      const decrypted = await cryptoUtils.decrypt(encrypted, key);
      const endTime = performance.now();

      expect(decrypted).toBe(largeData);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid key gracefully', async () => {
      const data = 'test data';
      const invalidKey = 'not-a-key';

      await expect(cryptoUtils.encrypt(data, invalidKey)).rejects.toThrow();
      await expect(cryptoUtils.decrypt(data, invalidKey)).rejects.toThrow();
    });

    test('should handle corrupted encrypted data', async () => {
      const data = 'test data';
      const key = await cryptoUtils.generateKey();
      const encrypted = await cryptoUtils.encrypt(data, key);

      // Corrupt the encrypted data
      const corrupted = encrypted.substring(0, encrypted.length - 5) + 'xxxxx';

      await expect(cryptoUtils.decrypt(corrupted, key)).rejects.toThrow();
    });

    test('should handle empty data', async () => {
      const key = await cryptoUtils.generateKey();

      const encrypted = await cryptoUtils.encrypt('', key);
      const decrypted = await cryptoUtils.decrypt(encrypted, key);

      expect(decrypted).toBe('');
    });
  });

  describe('Performance Benchmarks', () => {
    test('should meet encryption performance requirements', async () => {
      const key = await cryptoUtils.generateKey();
      const data = 'x'.repeat(10000); // 10KB

      const startTime = performance.now();
      for (let i = 0; i < 100; i++) {
        await cryptoUtils.encrypt(data, key);
      }
      const endTime = performance.now();

      const totalTime = endTime - startTime;
      const avgTime = totalTime / 100;

      expect(avgTime).toBeLessThan(50); // Less than 50ms per encryption
    });

    test('should meet decryption performance requirements', async () => {
      const key = await cryptoUtils.generateKey();
      const data = 'x'.repeat(10000);
      const encrypted = await cryptoUtils.encrypt(data, key);

      const startTime = performance.now();
      for (let i = 0; i < 100; i++) {
        await cryptoUtils.decrypt(encrypted, key);
      }
      const endTime = performance.now();

      const totalTime = endTime - startTime;
      const avgTime = totalTime / 100;

      expect(avgTime).toBeLessThan(50); // Less than 50ms per decryption
    });
  });
});