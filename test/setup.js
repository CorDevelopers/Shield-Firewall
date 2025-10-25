/**
 * Jest Test Setup
 * Global test configuration and mocks
 */

// Mock Web APIs that might not be available in test environment
global.fetch = jest.fn();
global.Request = jest.fn();
global.Response = jest.fn();
global.Headers = jest.fn();

// Mock Web Crypto API
global.crypto = {
  subtle: {
    digest: jest.fn(() => Promise.resolve(new Uint8Array(32).buffer)),
    generateKey: jest.fn(() => Promise.resolve({
      type: 'secret',
      algorithm: { name: 'AES-GCM', length: 256 },
      extractable: true,
      usages: ['encrypt', 'decrypt']
    })),
    encrypt: jest.fn(() => Promise.resolve(new Uint8Array(64).buffer)),
    decrypt: jest.fn(() => Promise.resolve(new Uint8Array(32).buffer)),
    importKey: jest.fn(() => Promise.resolve({
      type: 'secret',
      algorithm: { name: 'AES-GCM', length: 256 }
    })),
    deriveKey: jest.fn(() => Promise.resolve({
      type: 'secret',
      algorithm: { name: 'AES-GCM', length: 256 }
    }))
  },
  getRandomValues: jest.fn((array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  })
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

// Mock Web Workers
global.Worker = jest.fn(() => ({
  postMessage: jest.fn(),
  onmessage: null,
  onerror: null,
  terminate: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}));

// Mock MutationObserver
global.MutationObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(() => [])
}));

// Mock Performance API
global.performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn()
};

// Mock localStorage
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};

// Mock sessionStorage
global.sessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};

// Mock URL APIs
global.URL = jest.fn();
global.URLSearchParams = jest.fn();

// Mock DOM elements and events
global.document = {
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    addEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(),
      toggle: jest.fn()
    },
    style: {},
    innerHTML: '',
    textContent: ''
  },
  head: {
    appendChild: jest.fn()
  },
  documentElement: {
    outerHTML: '<html><body></body></html>',
    innerHTML: ''
  },
  createElement: jest.fn(() => ({
    setAttribute: jest.fn(),
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(),
      toggle: jest.fn()
    },
    style: {},
    innerHTML: '',
    textContent: '',
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => [])
  })),
  createTextNode: jest.fn(() => ({
    textContent: ''
  })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn()
};

global.window = {
  fetch: global.fetch,
  Request: global.Request,
  Response: global.Response,
  Headers: global.Headers,
  crypto: global.crypto,
  indexedDB: global.indexedDB,
  Worker: global.Worker,
  MutationObserver: global.MutationObserver,
  performance: global.performance,
  localStorage: global.localStorage,
  sessionStorage: global.sessionStorage,
  URL: global.URL,
  URLSearchParams: global.URLSearchParams,
  document: global.document,
  location: {
    href: 'https://example.com',
    protocol: 'https:',
    host: 'example.com',
    pathname: '/',
    search: '',
    hash: ''
  },
  navigator: {
    userAgent: 'Jest Test Environment',
    platform: 'test',
    cookieEnabled: true,
    onLine: true
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  setTimeout: global.setTimeout,
  clearTimeout: global.clearTimeout,
  setInterval: global.setInterval,
  clearInterval: global.clearInterval
};

// Mock XMLHttpRequest
global.XMLHttpRequest = jest.fn(() => ({
  open: jest.fn(),
  send: jest.fn(),
  setRequestHeader: jest.fn(),
  abort: jest.fn(),
  readyState: 4,
  status: 200,
  responseText: '',
  response: null,
  onreadystatechange: null,
  onload: null,
  onerror: null
}));

// Mock Event constructors
global.Event = jest.fn((type) => ({
  type,
  target: null,
  currentTarget: null,
  preventDefault: jest.fn(),
  stopPropagation: jest.fn()
}));

global.CustomEvent = jest.fn((type, options) => ({
  type,
  detail: options?.detail || null,
  target: null,
  currentTarget: null,
  preventDefault: jest.fn(),
  stopPropagation: jest.fn()
}));

// Mock console methods to avoid noise during tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Add custom matchers
expect.extend({
  toBeValidThreatResult(received) {
    const pass = received &&
      typeof received.detected === 'boolean' &&
      typeof received.score === 'number' &&
      received.score >= 0 && received.score <= 1;

    return {
      message: () => `expected ${received} to be a valid threat result`,
      pass
    };
  },

  toBeValidEncryptionResult(received) {
    const pass = received &&
      typeof received === 'string' &&
      received.length > 0;

    return {
      message: () => `expected ${received} to be a valid encryption result`,
      pass
    };
  }
});

// Global test utilities
global.testUtils = {
  // Create mock threat data
  createMockThreat: (overrides = {}) => ({
    type: 'xss',
    severity: 'high',
    source: 'dom',
    content: '<script>alert(1)</script>',
    timestamp: Date.now(),
    blocked: true,
    ...overrides
  }),

  // Create mock user interaction
  createMockInteraction: (overrides = {}) => ({
    type: 'click',
    element: 'button',
    timestamp: Date.now(),
    position: { x: 100, y: 200 },
    ...overrides
  }),

  // Create mock DOM element
  createMockElement: (tagName = 'div', overrides = {}) => ({
    tagName: tagName.toUpperCase(),
    innerHTML: '',
    textContent: '',
    attributes: {},
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn(),
      toggle: jest.fn()
    },
    style: {},
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    ...overrides
  }),

  // Simulate async delay
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Generate random test data
  generateRandomData: (size) => {
    return Array(size).fill().map(() => Math.random().toString(36).substring(2));
  }
};