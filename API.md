# SHIELD.js API Documentation

## Table of Contents
- [Overview](#overview)
- [Core Classes](#core-classes)
  - [ShieldFirewall](#shieldfirewall)
  - [CryptoUtils](#cryptoutils)
  - [StorageManager](#storagemanager)
  - [Logger](#logger)
  - [ThreatPatterns](#threatpatterns)
- [Protection Engines](#protection-engines)
  - [BehaviorEngine](#behaviorengine)
  - [DOMProtector](#domprotector)
  - [ThreatDetector](#threatdetector)
  - [NetworkInterceptor](#networkinterceptor)
  - [RecoveryEngine](#recoveryengine)
- [Configuration](#configuration)
- [Events](#events)
- [Error Handling](#error-handling)

## Overview

SHIELD.js provides a comprehensive API for client-side web application security. All classes are designed with a modular architecture allowing for selective feature usage.

## Core Classes

### ShieldFirewall

The main firewall class that orchestrates all protection components.

#### Constructor
```javascript
new ShieldFirewall(options?: ShieldOptions)
```

**Parameters:**
- `options` (optional): Initial configuration options

#### Methods

##### `initialize(): Promise<boolean>`
Initializes the firewall and all components.

**Returns:** Promise resolving to `true` if initialization successful

**Example:**
```javascript
const shield = new ShieldFirewall();
const success = await shield.initialize();
```

##### `start(): Promise<boolean>`
Starts active protection monitoring.

**Returns:** Promise resolving to `true` if started successfully

##### `stop(): Promise<boolean>`
Stops protection monitoring.

**Returns:** Promise resolving to `true` if stopped successfully

##### `configure(config: Partial<ShieldConfig>): Promise<boolean>`
Updates firewall configuration.

**Parameters:**
- `config`: Partial configuration object

**Returns:** Promise resolving to `true` if configuration updated

##### `getStatus(): ShieldStatus`
Returns current firewall status.

**Returns:** Status object with initialization state, active components, and statistics

##### `scan(element?: HTMLElement): Promise<ScanResult>`
Performs security scan on element or document.

**Parameters:**
- `element` (optional): Element to scan, defaults to document

**Returns:** Scan results with threats found and actions taken

##### `createSnapshot(name: string): string`
Creates DOM snapshot for recovery.

**Parameters:**
- `name`: Snapshot identifier

**Returns:** Snapshot ID

##### `restoreFromSnapshot(snapshotId: string): Promise<boolean>`
Restores DOM from snapshot.

**Parameters:**
- `snapshotId`: ID of snapshot to restore

**Returns:** Promise resolving to `true` if restored successfully

##### `getConfig(): ShieldConfig`
Returns current configuration.

**Returns:** Complete configuration object

##### `reset(): Promise<boolean>`
Resets firewall to default state.

**Returns:** Promise resolving to `true` if reset successful

### CryptoUtils

Handles encryption, decryption, and cryptographic operations.

#### Constructor
```javascript
new CryptoUtils()
```

#### Methods

##### `generateKey(): Promise<CryptoKey>`
Generates AES-GCM encryption key.

**Returns:** Promise resolving to CryptoKey

##### `deriveKeyFromPassword(password: string, salt?: Uint8Array): Promise<CryptoKey>`
Derives key from password using PBKDF2.

**Parameters:**
- `password`: Password string
- `salt` (optional): Salt for key derivation

**Returns:** Promise resolving to CryptoKey

##### `encrypt(data: string, key: CryptoKey): Promise<string>`
Encrypts data using AES-GCM.

**Parameters:**
- `data`: Data to encrypt
- `key`: Encryption key

**Returns:** Promise resolving to encrypted data (base64)

##### `decrypt(encryptedData: string, key: CryptoKey): Promise<string>`
Decrypts data.

**Parameters:**
- `encryptedData`: Encrypted data (base64)
- `key`: Decryption key

**Returns:** Promise resolving to decrypted data

##### `hash(data: string): Promise<string>`
Generates SHA-256 hash.

**Parameters:**
- `data`: Data to hash

**Returns:** Promise resolving to hex hash

### StorageManager

Manages encrypted local storage using IndexedDB.

#### Constructor
```javascript
new StorageManager(crypto: CryptoUtils)
```

**Parameters:**
- `crypto`: CryptoUtils instance for encryption

#### Methods

##### `initialize(): Promise<boolean>`
Initializes storage database.

**Returns:** Promise resolving to `true` if initialized

##### `storeBehaviorProfile(profile: BehaviorProfile): Promise<boolean>`
Stores user behavior profile.

**Parameters:**
- `profile`: Behavior profile data

##### `getBehaviorProfile(userId: string): Promise<BehaviorProfile | null>`
Retrieves behavior profile.

**Parameters:**
- `userId`: User identifier

**Returns:** Promise resolving to profile or null

##### `logThreat(threat: ThreatData): Promise<boolean>`
Logs threat detection.

**Parameters:**
- `threat`: Threat information

##### `getThreatLogs(filter?: ThreatFilter): Promise<ThreatData[]>`
Retrieves threat logs.

**Parameters:**
- `filter` (optional): Filter criteria

**Returns:** Promise resolving to array of threats

##### `storeConfig(config: ShieldConfig): Promise<boolean>`
Stores configuration.

**Parameters:**
- `config`: Configuration object

##### `getConfig(): Promise<ShieldConfig | null>`
Retrieves configuration.

**Returns:** Promise resolving to configuration or null

### Logger

Handles structured logging and threat persistence.

#### Constructor
```javascript
new Logger(storage: StorageManager)
```

**Parameters:**
- `storage`: StorageManager instance

#### Methods

##### `debug(message: string, data?: any): void`
Logs debug message.

##### `info(message: string, data?: any): void`
Logs info message.

##### `warn(message: string, data?: any): void`
Logs warning message.

##### `error(message: string, error?: Error): void`
Logs error message.

##### `threatDetected(threat: ThreatData): Promise<void>`
Logs threat detection with persistence.

**Parameters:**
- `threat`: Threat information

##### `getStats(): ThreatStats`
Returns threat statistics.

**Returns:** Statistics object with counts and trends

##### `setLevel(level: LogLevel): void`
Sets logging level.

**Parameters:**
- `level`: Log level ('debug' | 'info' | 'warn' | 'error')

### ThreatPatterns

Manages threat detection patterns and signatures.

#### Constructor
```javascript
new ThreatPatterns()
```

#### Methods

##### `detectXSS(content: string): ThreatResult`
Detects XSS patterns.

**Parameters:**
- `content`: Content to analyze

**Returns:** Detection result with score and details

##### `detectSQLInjection(content: string): ThreatResult`
Detects SQL injection patterns.

**Parameters:**
- `content`: Content to analyze

**Returns:** Detection result

##### `detectCSRF(content: string): ThreatResult`
Detects CSRF patterns.

**Parameters:**
- `content`: Content to analyze

**Returns:** Detection result

##### `analyzeContent(content: string): ContentAnalysis`
Performs comprehensive content analysis.

**Parameters:**
- `content`: Content to analyze

**Returns:** Analysis with all threat types checked

## Protection Engines

### BehaviorEngine

AI-powered user behavior analysis.

#### Constructor
```javascript
new BehaviorEngine(mlWorker: MLWorker, storage: StorageManager, logger: Logger)
```

#### Methods

##### `recordInteraction(interaction: UserInteraction): void`
Records user interaction for analysis.

##### `detectAnomaly(interactions: UserInteraction[]): Promise<AnomalyResult>`
Detects behavioral anomalies.

##### `detectBot(interactions: UserInteraction[]): Promise<BotResult>`
Detects bot behavior patterns.

##### `getProfile(): BehaviorProfile`
Returns current behavior profile.

### DOMProtector

Real-time DOM monitoring and protection.

#### Constructor
```javascript
new DOMProtector(logger: Logger, patterns: ThreatPatterns)
```

#### Methods

##### `startMonitoring(): void`
Starts DOM mutation monitoring.

##### `stopMonitoring(): void`
Stops DOM monitoring.

##### `sanitizeHTML(html: string): string`
Sanitizes HTML content.

##### `scanElement(element: HTMLElement): ScanResult`
Scans element for threats.

### ThreatDetector

Predictive threat detection engine.

#### Constructor
```javascript
new ThreatDetector(logger: Logger, patterns: ThreatPatterns, crypto: CryptoUtils)
```

#### Methods

##### `analyzeRequest(request: RequestData): ThreatResult`
Analyzes network request.

##### `generateRequestFingerprint(request: RequestData): string`
Generates request fingerprint.

##### `checkThreatSignatures(content: string): ThreatResult`
Checks content against threat signatures.

### NetworkInterceptor

Network request monitoring and interception.

#### Constructor
```javascript
new NetworkInterceptor(threatDetector: ThreatDetector, logger: Logger)
```

#### Methods

##### `startInterception(): void`
Starts network interception.

##### `stopInterception(): void`
Stops network interception.

##### `isRateLimited(url: string): boolean`
Checks if URL is rate limited.

##### `analyzeOutgoingRequest(request: RequestData): Promise<AnalysisResult>`
Analyzes outgoing request.

### RecoveryEngine

Auto-recovery and DOM restoration.

#### Constructor
```javascript
new RecoveryEngine(domProtector: DOMProtector, logger: Logger, storage: StorageManager)
```

#### Methods

##### `createSnapshot(name: string): string`
Creates DOM snapshot.

##### `restoreFromSnapshot(snapshotId: string): Promise<boolean>`
Restores from snapshot.

##### `quarantineElement(element: HTMLElement, reason: string): string`
Quarantines suspicious element.

##### `restoreFromQuarantine(quarantineId: string): boolean`
Restores from quarantine.

## Configuration

### ShieldConfig Interface

```typescript
interface ShieldConfig {
  protectionLevel: 'basic' | 'balanced' | 'strict' | 'paranoid';
  features: {
    domProtection: boolean;
    networkInterception: boolean;
    behaviorAnalysis: boolean;
    predictiveDetection: boolean;
    autoRecovery: boolean;
  };
  threatDetection: {
    sensitivity: number; // 0.0 - 1.0
    blockUnknown: boolean;
    customPatterns: string[];
  };
  privacy: {
    anonymizeLogs: boolean;
    telemetry: boolean;
    dataRetention: number; // days
  };
  ui: {
    showDashboard: boolean;
    dashboardPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    theme: 'light' | 'dark' | 'auto';
  };
}
```

### Protection Levels

- **Basic**: Essential protection with minimal performance impact
- **Balanced**: Good protection-performance balance (default)
- **Strict**: High security with moderate performance impact
- **Paranoid**: Maximum security with potential performance impact

## Events

SHIELD.js emits custom events for integration:

```javascript
// Listen for threat detection
document.addEventListener('shield:threat-detected', (event) => {
  console.log('Threat detected:', event.detail);
});

// Listen for protection status changes
document.addEventListener('shield:status-changed', (event) => {
  console.log('Status changed:', event.detail);
});

// Listen for configuration updates
document.addEventListener('shield:config-updated', (event) => {
  console.log('Config updated:', event.detail);
});
```

### Event Types

- `shield:threat-detected`: Fired when threat is detected
- `shield:status-changed`: Fired when protection status changes
- `shield:config-updated`: Fired when configuration is updated
- `shield:scan-completed`: Fired when manual scan completes
- `shield:recovery-triggered`: Fired when auto-recovery activates

## Error Handling

SHIELD.js provides comprehensive error handling:

```javascript
try {
  await shield.initialize();
  await shield.start();
} catch (error) {
  if (error.name === 'ShieldInitializationError') {
    console.error('Failed to initialize SHIELD:', error.message);
  } else if (error.name === 'ShieldConfigurationError') {
    console.error('Configuration error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Error Types

- `ShieldInitializationError`: Firewall initialization failed
- `ShieldConfigurationError`: Invalid configuration
- `ShieldStorageError`: Storage operation failed
- `ShieldCryptoError`: Cryptographic operation failed
- `ShieldNetworkError`: Network interception failed

### Graceful Degradation

SHIELD.js is designed to fail gracefully:

```javascript
// Component failures don't stop the entire system
const shield = new ShieldFirewall();
await shield.initialize();

// If ML worker fails, basic pattern matching still works
// If storage fails, in-memory logging continues
// If DOM monitoring fails, network protection continues
```

## Type Definitions

### Core Types

```typescript
interface ThreatData {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  content: string;
  timestamp: number;
  blocked: boolean;
  metadata?: Record<string, any>;
}

interface UserInteraction {
  type: string;
  element: string;
  timestamp: number;
  position?: { x: number; y: number };
  metadata?: Record<string, any>;
}

interface ThreatResult {
  detected: boolean;
  score: number;
  type: string;
  details: Record<string, any>;
}

interface ScanResult {
  threats: ThreatData[];
  scannedElements: number;
  scanTime: number;
  actions: string[];
}
```

This documentation covers the complete SHIELD.js API. For more examples and advanced usage, see the [examples directory](../examples/) and [test suite](../test/).