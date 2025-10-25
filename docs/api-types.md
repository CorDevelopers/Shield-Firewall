# TypeScript Types

This page documents all TypeScript interfaces and types used by Core Developer.

## Core Types

### ShieldOptions

Configuration options passed to the ShieldFirewall constructor.

```typescript
interface ShieldOptions {
  debug?: boolean;
  logLevel?: 'none' | 'error' | 'warn' | 'info' | 'debug';
  customLogger?: Logger;
}
```

### ShieldConfig

Main configuration interface for Core Developer.

```typescript
interface ShieldConfig {
  protectionLevel: 'basic' | 'strict' | 'maximum';
  features: {
    domProtection: boolean;
    networkInterception: boolean;
    behaviorAnalysis: boolean;
    predictiveDetection: boolean;
    autoRecovery: boolean;
    realTimeMonitoring: boolean;
  };
  threatDetection: {
    sensitivity: number;
    customPatterns: string[];
  };
  logging: {
    level: 'none' | 'standard' | 'detailed';
    maxEntries: number;
  };
}
```

## Threat Types

### ThreatType

Enumeration of all supported threat types.

```typescript
type ThreatType =
  | 'xss'           // Cross-Site Scripting
  | 'injection'     // SQL/NoSQL Injection
  | 'csrf'          // Cross-Site Request Forgery
  | 'crypto-mining' // Cryptocurrency Mining
  | 'behavior'      // Suspicious Behavior
  | 'network'       // Malicious Network Activity
  | 'custom';       // Custom Pattern Match
```

### ThreatSeverity

Severity levels for detected threats.

```typescript
type ThreatSeverity = 'low' | 'medium' | 'high' | 'critical';
```

### ThreatLogEntry

Structure for threat log entries.

```typescript
interface ThreatLogEntry {
  id: string;
  timestamp: Date;
  type: ThreatType;
  severity: ThreatSeverity;
  description: string;
  blocked: boolean;
  source?: string;
  userAgent?: string;
  url?: string;
  metadata?: Record<string, any>;
}
```

## Event Types

### ThreatEventDetail

Detail object for threat-related events.

```typescript
interface ThreatEventDetail extends ThreatLogEntry {
  // Inherits all ThreatLogEntry properties
}
```

### ConfigEventDetail

Detail object for configuration events.

```typescript
interface ConfigEventDetail {
  protectionLevel: string;
  features: Record<string, boolean>;
  threatDetection: {
    sensitivity: number;
    customPatterns: string[];
  };
  logging: {
    level: string;
    maxEntries: number;
  };
}
```

### RecoveryEventDetail

Detail object for recovery events.

```typescript
interface RecoveryEventDetail {
  reason: string;
  type: 'dom' | 'network' | 'behavior';
  success: boolean;
  timestamp: Date;
  affectedElements?: number;
  error?: string;
}
```

## Protection Types

### ProtectionLevel

Available protection levels.

```typescript
type ProtectionLevel = 'basic' | 'strict' | 'maximum';
```

### ProtectionFeatures

Features that can be enabled or disabled.

```typescript
interface ProtectionFeatures {
  domProtection: boolean;
  networkInterception: boolean;
  behaviorAnalysis: boolean;
  predictiveDetection: boolean;
  autoRecovery: boolean;
  realTimeMonitoring: boolean;
}
```

## Detection Types

### ThreatDetectionConfig

Configuration for threat detection.

```typescript
interface ThreatDetectionConfig {
  sensitivity: number;        // 0.1 to 1.0
  customPatterns: string[];   // Array of regex patterns
}
```

### PatternMatch

Result of pattern matching operations.

```typescript
interface PatternMatch {
  pattern: string;
  matched: boolean;
  groups?: RegExpMatchArray;
  index?: number;
}
```

## Logging Types

### LogLevel

Available logging levels.

```typescript
type LogLevel = 'none' | 'standard' | 'detailed';
```

### LoggingConfig

Configuration for logging.

```typescript
interface LoggingConfig {
  level: LogLevel;
  maxEntries: number;
  customLogger?: Logger;
}
```

### Logger

Custom logger interface.

```typescript
interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}
```

## Network Types

### NetworkRequest

Structure for intercepted network requests.

```typescript
interface NetworkRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: Date;
}
```

### NetworkResponse

Structure for intercepted network responses.

```typescript
interface NetworkResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: Date;
}
```

## DOM Types

### DOMElement

Extended DOM element with security metadata.

```typescript
interface DOMElement extends Element {
  _shieldId?: string;
  _shieldProtected?: boolean;
  _shieldOriginalContent?: string;
}
```

### DOMMutation

Structure for DOM mutation events.

```typescript
interface DOMMutation {
  type: 'added' | 'removed' | 'modified';
  target: Element;
  timestamp: Date;
  changes?: {
    attribute?: string;
    oldValue?: string;
    newValue?: string;
  };
}
```

## Behavior Analysis Types

### UserBehavior

Structure for user behavior tracking.

```typescript
interface UserBehavior {
  type: 'click' | 'scroll' | 'keypress' | 'mousemove' | 'touch';
  timestamp: Date;
  target?: Element;
  position?: { x: number; y: number };
  metadata?: Record<string, any>;
}
```

### BehaviorPattern

Pattern detected in user behavior.

```typescript
interface BehaviorPattern {
  type: 'bot' | 'automated' | 'suspicious' | 'normal';
  confidence: number; // 0.0 to 1.0
  indicators: string[];
  timestamp: Date;
}
```

## Recovery Types

### RecoveryAction

Actions that can be taken during recovery.

```typescript
type RecoveryAction =
  | 'restore-dom'
  | 'block-request'
  | 'isolate-element'
  | 'reset-behavior'
  | 'custom';
```

### RecoveryResult

Result of a recovery operation.

```typescript
interface RecoveryResult {
  action: RecoveryAction;
  success: boolean;
  timestamp: Date;
  affectedElements: number;
  error?: string;
  metadata?: Record<string, any>;
}
```

## Utility Types

### DeepPartial

Makes all properties of T optional recursively.

```typescript
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
```

### Nullable

Makes all properties of T nullable.

```typescript
type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};
```

### RequiredKeys

Extracts required keys from T.

```typescript
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];
```

## Error Types

### ShieldError

Custom error class for Core Developer.

```typescript
class ShieldError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'low' | 'medium' | 'high'
  ) {
    super(message);
    this.name = 'ShieldError';
  }
}
```

### ErrorCode

Available error codes.

```typescript
type ErrorCode =
  | 'CONFIG_INVALID'
  | 'INITIALIZATION_FAILED'
  | 'PROTECTION_START_FAILED'
  | 'NETWORK_INTERCEPTION_FAILED'
  | 'DOM_PROTECTION_FAILED'
  | 'RECOVERY_FAILED'
  | 'UNKNOWN_ERROR';
```

## Configuration Presets

### ProtectionPreset

Predefined protection configurations.

```typescript
interface ProtectionPreset {
  name: string;
  description: string;
  config: ShieldConfig;
}
```

### PresetCollection

Collection of available presets.

```typescript
const PRESETS: Record<string, ProtectionPreset> = {
  basic: {
    name: 'Basic Protection',
    description: 'Minimal performance impact with essential security',
    config: { /* ... */ }
  },
  strict: {
    name: 'Strict Protection',
    description: 'Balanced security and performance',
    config: { /* ... */ }
  },
  maximum: {
    name: 'Maximum Protection',
    description: 'Highest security level',
    config: { /* ... */ }
  }
};
```

## Export Types

```typescript
// Main exports
export {
  ShieldFirewall,
  type ShieldOptions,
  type ShieldConfig,
  type ThreatLogEntry,
  type ThreatType,
  type ThreatSeverity,
  ShieldError,
  type ErrorCode
};

// Event exports
export type {
  ThreatEventDetail,
  ConfigEventDetail,
  RecoveryEventDetail
};

// Utility exports
export type {
  DeepPartial,
  Nullable,
  RequiredKeys,
  ProtectionLevel,
  LogLevel
};
```