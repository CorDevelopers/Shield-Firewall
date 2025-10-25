# Framework Integration Examples

This guide provides integration examples for popular JavaScript frameworks and libraries with Core Developer.

## React Integration

### Basic React Setup

```jsx
import React, { useEffect, useState } from 'react';
import { ShieldFirewall } from 'shield-firewall';

function App() {
  const [isProtected, setIsProtected] = useState(false);
  const [threats, setThreats] = useState([]);

  useEffect(() => {
    const initShield = async () => {
      try {
        const shield = new ShieldFirewall();

        await shield.configure({
          protectionLevel: 'strict',
          features: {
            domProtection: true,
            networkInterception: true,
            behaviorAnalysis: true,
            predictiveDetection: true,
            autoRecovery: true,
            realTimeMonitoring: true
          }
        });

        await shield.initialize();
        await shield.start();

        setIsProtected(true);

        // Listen for threats
        const handleThreat = (event) => {
          setThreats(prev => [...prev, event.detail]);
        };

        document.addEventListener('shield:threat-detected', handleThreat);

        return () => {
          document.removeEventListener('shield:threat-detected', handleThreat);
          shield.stop();
        };
      } catch (error) {
        console.error('Failed to initialize Core Developer:', error);
      }
    };

    initShield();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🛡️ Protected React App</h1>
        <div className={`status ${isProtected ? 'protected' : 'unprotected'}`}>
          Status: {isProtected ? 'Protected' : 'Initializing...'}
        </div>
      </header>

      <main>
        <div className="threat-log">
          <h2>Threat Log ({threats.length})</h2>
          {threats.slice(-5).map((threat, index) => (
            <div key={index} className="threat-item">
              <span className="threat-type">{threat.type}</span>
              <span className="threat-severity">{threat.severity}</span>
              <span className="threat-time">
                {new Date(threat.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
```

### React Hook for Security

```jsx
import { useEffect, useState, useCallback, createContext, useContext } from 'react';
import { ShieldFirewall } from 'shield-firewall';

// Security Context
const SecurityContext = createContext(null);

// Custom hook for security
export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within SecurityProvider');
  }
  return context;
};

// Security Provider Component
export const SecurityProvider = ({ children, config }) => {
  const [shield, setShield] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [threats, setThreats] = useState([]);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const initSecurity = async () => {
      try {
        const shieldInstance = new ShieldFirewall();

        await shieldInstance.configure(config || {
          protectionLevel: 'strict',
          features: {
            domProtection: true,
            networkInterception: true,
            behaviorAnalysis: true,
            predictiveDetection: true
          }
        });

        await shieldInstance.initialize();
        await shieldInstance.start();

        setShield(shieldInstance);
        setIsInitialized(true);
        setIsActive(true);

        // Set up event listeners
        const handleThreatDetected = (event) => {
          setThreats(prev => [event.detail, ...prev.slice(0, 99)]); // Keep last 100
        };

        const handleThreatBlocked = (event) => {
          console.log('Threat blocked:', event.detail);
        };

        document.addEventListener('shield:threat-detected', handleThreatDetected);
        document.addEventListener('shield:threat-blocked', handleThreatBlocked);

        return () => {
          document.removeEventListener('shield:threat-detected', handleThreatDetected);
          document.removeEventListener('shield:threat-blocked', handleThreatBlocked);
          shieldInstance.stop();
        };
      } catch (error) {
        console.error('Security initialization failed:', error);
      }
    };

    initSecurity();
  }, [config]);

  const scanElement = useCallback((element) => {
    if (shield && element) {
      return shield.validateContent(element.innerHTML);
    }
    return true;
  }, [shield]);

  const getThreatLog = useCallback(() => {
    return shield ? shield.getThreatLog() : [];
  }, [shield]);

  const value = {
    shield,
    isInitialized,
    isActive,
    threats,
    scanElement,
    getThreatLog
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};

// Usage in components
const SecureForm = () => {
  const { scanElement, threats } = useSecurity();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Scan form content before submission
    const isSafe = scanElement(e.target);
    if (!isSafe) {
      alert('Security threat detected in form data');
      return;
    }

    console.log('Form submitted safely:', formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        placeholder="Name"
      />
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        placeholder="Email"
      />
      <textarea
        value={formData.message}
        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
        placeholder="Message"
      />
      <button type="submit">Submit</button>

      {threats.length > 0 && (
        <div className="security-notice">
          ⚠️ {threats.length} security threat(s) detected
        </div>
      )}
    </form>
  );
};

// App component
const App = () => {
  return (
    <SecurityProvider>
      <div className="App">
        <h1>Secure React Application</h1>
        <SecureForm />
        <ThreatDashboard />
      </div>
    </SecurityProvider>
  );
};

const ThreatDashboard = () => {
  const { threats, getThreatLog } = useSecurity();

  return (
    <div className="threat-dashboard">
      <h2>Security Dashboard</h2>
      <div className="stats">
        <div>Active Threats: {threats.length}</div>
        <div>Total Logged: {getThreatLog().length}</div>
      </div>
      <div className="recent-threats">
        {threats.slice(0, 5).map((threat, index) => (
          <div key={index} className="threat">
            <span>{threat.type}</span>
            <span>{threat.severity}</span>
            <span>{new Date(threat.timestamp).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
```

## Vue.js Integration

### Vue 3 Composition API

```vue
<template>
  <div id="app">
    <header>
      <h1>🛡️ Protected Vue App</h1>
      <div :class="['status', { protected: isProtected }]">
        Status: {{ isProtected ? 'Protected' : 'Initializing...' }}
      </div>
    </header>

    <main>
      <SecureForm />
      <ThreatMonitor :threats="threats" />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { ShieldFirewall } from 'shield-firewall';

const isProtected = ref(false);
const threats = ref([]);
let shield = null;

const initSecurity = async () => {
  try {
    shield = new ShieldFirewall();

    await shield.configure({
      protectionLevel: 'strict',
      features: {
        domProtection: true,
        networkInterception: true,
        behaviorAnalysis: true,
        predictiveDetection: true,
        autoRecovery: true
      }
    });

    await shield.initialize();
    await shield.start();

    isProtected.value = true;

    // Set up event listeners
    document.addEventListener('shield:threat-detected', handleThreat);
    document.addEventListener('shield:threat-blocked', handleBlocked);

  } catch (error) {
    console.error('Security initialization failed:', error);
  }
};

const handleThreat = (event) => {
  threats.value.unshift(event.detail);
  if (threats.value.length > 50) {
    threats.value = threats.value.slice(0, 50);
  }
};

const handleBlocked = (event) => {
  console.log('Threat blocked:', event.detail);
};

onMounted(() => {
  initSecurity();
});

onUnmounted(() => {
  if (shield) {
    document.removeEventListener('shield:threat-detected', handleThreat);
    document.removeEventListener('shield:threat-blocked', handleBlocked);
    shield.stop();
  }
});
</script>

<style>
.status {
  padding: 0.5rem;
  border-radius: 4px;
  background: #ff6b6b;
  color: white;
}

.status.protected {
  background: #51cf66;
}
</style>
```

### Secure Form Component

```vue
<template>
  <form @submit.prevent="handleSubmit" class="secure-form">
    <div class="form-group">
      <label for="name">Name:</label>
      <input
        id="name"
        v-model="formData.name"
        type="text"
        @input="validateField"
      />
    </div>

    <div class="form-group">
      <label for="email">Email:</label>
      <input
        id="email"
        v-model="formData.email"
        type="email"
        @input="validateField"
      />
    </div>

    <div class="form-group">
      <label for="message">Message:</label>
      <textarea
        id="message"
        v-model="formData.message"
        @input="validateField"
      ></textarea>
    </div>

    <button type="submit" :disabled="!isFormValid">Submit</button>

    <div v-if="securityWarnings.length" class="security-warnings">
      <h3>Security Warnings</h3>
      <ul>
        <li v-for="warning in securityWarnings" :key="warning.id">
          {{ warning.message }}
        </li>
      </ul>
    </div>
  </form>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ShieldFirewall } from 'shield-firewall';

const formData = ref({
  name: '',
  email: '',
  message: ''
});

const securityWarnings = ref([]);
const shield = new ShieldFirewall();

const isFormValid = computed(() => {
  return formData.value.name && formData.value.email && securityWarnings.value.length === 0;
});

const validateField = async (event) => {
  const field = event.target;
  const value = field.value;

  // Real-time validation
  const isSafe = await shield.validateContent(value);

  if (!isSafe) {
    addWarning(field.id, `Potentially unsafe content in ${field.id}`);
  } else {
    removeWarning(field.id);
  }
};

const addWarning = (fieldId, message) => {
  removeWarning(fieldId); // Remove existing warning for this field
  securityWarnings.value.push({
    id: fieldId,
    message,
    timestamp: new Date()
  });
};

const removeWarning = (fieldId) => {
  securityWarnings.value = securityWarnings.value.filter(w => w.id !== fieldId);
};

const handleSubmit = async () => {
  // Final validation before submission
  const formElement = document.querySelector('.secure-form');
  const isSafe = await shield.validateContent(formElement.innerHTML);

  if (!isSafe) {
    alert('Security threat detected. Please review your input.');
    return;
  }

  console.log('Form submitted safely:', formData.value);

  // Reset form
  formData.value = { name: '', email: '', message: '' };
  securityWarnings.value = [];
};
</script>

<style scoped>
.secure-form {
  max-width: 500px;
  margin: 2rem auto;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

input, textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  background: #007bff;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.security-warnings {
  margin-top: 1rem;
  padding: 1rem;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
}

.security-warnings ul {
  margin: 0;
  padding-left: 1.5rem;
}
</style>
```

## Angular Integration

### Angular Service

```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ShieldFirewall } from 'shield-firewall';

@Injectable({
  providedIn: 'root'
})
export class SecurityService {
  private shield: ShieldFirewall | null = null;
  private threatsSubject = new BehaviorSubject<any[]>([]);
  private isInitializedSubject = new BehaviorSubject<boolean>(false);

  public threats$ = this.threatsSubject.asObservable();
  public isInitialized$ = this.isInitializedSubject.asObservable();

  async initialize(config?: any) {
    try {
      this.shield = new ShieldFirewall();

      const defaultConfig = {
        protectionLevel: 'strict',
        features: {
          domProtection: true,
          networkInterception: true,
          behaviorAnalysis: true,
          predictiveDetection: true,
          autoRecovery: true,
          realTimeMonitoring: true
        },
        ...config
      };

      await this.shield.configure(defaultConfig);
      await this.shield.initialize();
      await this.shield.start();

      this.setupEventListeners();
      this.isInitializedSubject.next(true);

    } catch (error) {
      console.error('Security service initialization failed:', error);
      throw error;
    }
  }

  private setupEventListeners() {
    document.addEventListener('shield:threat-detected', (event) => {
      const currentThreats = this.threatsSubject.value;
      this.threatsSubject.next([event.detail, ...currentThreats.slice(0, 99)]);
    });
  }

  async validateContent(content: string): Promise<boolean> {
    if (!this.shield) return true;
    return this.shield.validateContent(content);
  }

  getThreatLog() {
    return this.shield ? this.shield.getThreatLog() : [];
  }

  destroy() {
    if (this.shield) {
      this.shield.stop();
      this.shield = null;
    }
    this.isInitializedSubject.next(false);
  }
}
```

### Angular Component

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SecurityService } from './security.service';

@Component({
  selector: 'app-secure-form',
  template: `
    <div class="secure-form-container">
      <h2>Secure Contact Form</h2>

      <div *ngIf="!isInitialized" class="loading">
        Initializing security...
      </div>

      <form [formGroup]="contactForm" (ngSubmit)="onSubmit()" *ngIf="isInitialized">
        <div class="form-group">
          <label for="name">Name:</label>
          <input
            id="name"
            type="text"
            formControlName="name"
            (input)="validateField('name')"
            [class.danger]="hasSecurityWarning('name')"
          />
          <div *ngIf="hasSecurityWarning('name')" class="warning">
            ⚠️ Security concern detected
          </div>
        </div>

        <div class="form-group">
          <label for="email">Email:</label>
          <input
            id="email"
            type="email"
            formControlName="email"
            (input)="validateField('email')"
            [class.danger]="hasSecurityWarning('email')"
          />
          <div *ngIf="hasSecurityWarning('email')" class="warning">
            ⚠️ Security concern detected
          </div>
        </div>

        <div class="form-group">
          <label for="message">Message:</label>
          <textarea
            id="message"
            formControlName="message"
            (input)="validateField('message')"
            [class.danger]="hasSecurityWarning('message')"
          ></textarea>
          <div *ngIf="hasSecurityWarning('message')" class="warning">
            ⚠️ Security concern detected
          </div>
        </div>

        <button type="submit" [disabled]="!contactForm.valid || hasSecurityWarnings()">
          Submit
        </button>
      </form>

      <div class="threat-summary" *ngIf="threats.length > 0">
        <h3>Security Summary</h3>
        <p>{{ threats.length }} threat(s) detected</p>
        <ul>
          <li *ngFor="let threat of threats.slice(0, 5)">
            {{ threat.type }} - {{ threat.severity }} at {{ threat.timestamp | date:'shortTime' }}
          </li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .secure-form-container {
      max-width: 600px;
      margin: 2rem auto;
      padding: 2rem;
      border: 1px solid #ddd;
      border-radius: 8px;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: bold;
    }

    input, textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }

    input.danger, textarea.danger {
      border-color: #dc3545;
      background-color: #f8d7da;
    }

    .warning {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    button {
      background: #007bff;
      color: white;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
    }

    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .threat-summary {
      margin-top: 2rem;
      padding: 1rem;
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 4px;
    }

    .loading {
      text-align: center;
      padding: 2rem;
      color: #666;
    }
  `]
})
export class SecureFormComponent implements OnInit, OnDestroy {
  contactForm: FormGroup;
  isInitialized = false;
  threats: any[] = [];
  securityWarnings: { [key: string]: boolean } = {};

  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private securityService: SecurityService
  ) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      message: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.subscriptions.push(
      this.securityService.isInitialized$.subscribe(initialized => {
        this.isInitialized = initialized;
      }),

      this.securityService.threats$.subscribe(threats => {
        this.threats = threats;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async validateField(fieldName: string) {
    const value = this.contactForm.get(fieldName)?.value || '';
    const isSafe = await this.securityService.validateContent(value);

    this.securityWarnings[fieldName] = !isSafe;
  }

  hasSecurityWarning(fieldName: string): boolean {
    return this.securityWarnings[fieldName] || false;
  }

  hasSecurityWarnings(): boolean {
    return Object.values(this.securityWarnings).some(warning => warning);
  }

  async onSubmit() {
    if (this.contactForm.valid && !this.hasSecurityWarnings()) {
      console.log('Form submitted safely:', this.contactForm.value);

      // Reset form
      this.contactForm.reset();
      this.securityWarnings = {};
    }
  }
}
```

## Svelte Integration

### Svelte Store for Security

```javascript
// stores/security.js
import { writable } from 'svelte/store';
import { ShieldFirewall } from 'shield-firewall';

export const securityStore = (() => {
  const { subscribe, set, update } = writable({
    isInitialized: false,
    isActive: false,
    threats: [],
    threatLog: []
  });

  let shield = null;

  return {
    subscribe,

    async initialize(config = {}) {
      try {
        shield = new ShieldFirewall();

        const defaultConfig = {
          protectionLevel: 'strict',
          features: {
            domProtection: true,
            networkInterception: true,
            behaviorAnalysis: true,
            predictiveDetection: true
          },
          ...config
        };

        await shield.configure(defaultConfig);
        await shield.initialize();
        await shield.start();

        // Set up event listeners
        document.addEventListener('shield:threat-detected', handleThreat);
        document.addEventListener('shield:threat-blocked', handleBlocked);

        update(state => ({
          ...state,
          isInitialized: true,
          isActive: true
        }));

      } catch (error) {
        console.error('Security initialization failed:', error);
        throw error;
      }
    },

    async validateContent(content) {
      if (!shield) return true;
      return shield.validateContent(content);
    },

    getThreatLog() {
      return shield ? shield.getThreatLog() : [];
    },

    destroy() {
      if (shield) {
        document.removeEventListener('shield:threat-detected', handleThreat);
        document.removeEventListener('shield:threat-blocked', handleBlocked);
        shield.stop();
        shield = null;
      }

      set({
        isInitialized: false,
        isActive: false,
        threats: [],
        threatLog: []
      });
    }
  };

  function handleThreat(event) {
    update(state => ({
      ...state,
      threats: [event.detail, ...state.threats.slice(0, 99)]
    }));
  }

  function handleBlocked(event) {
    console.log('Threat blocked:', event.detail);
  }
})();
```

### Svelte Component

```svelte
<script>
  import { onMount, onDestroy } from 'svelte';
  import { securityStore } from './stores/security.js';

  let formData = {
    name: '',
    email: '',
    message: ''
  };

  let securityWarnings = {};
  let isSubmitting = false;

  onMount(async () => {
    await securityStore.initialize();
  });

  onDestroy(() => {
    securityStore.destroy();
  });

  async function validateField(fieldName, value) {
    const isSafe = await securityStore.validateContent(value);
    securityWarnings = {
      ...securityWarnings,
      [fieldName]: !isSafe
    };
  }

  function hasSecurityWarnings() {
    return Object.values(securityWarnings).some(warning => warning);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    isSubmitting = true;

    // Final validation
    const isFormSafe = await securityStore.validateContent(
      JSON.stringify(formData)
    );

    if (!isFormSafe || hasSecurityWarnings()) {
      alert('Security threat detected. Please review your input.');
      isSubmitting = false;
      return;
    }

    try {
      // Submit form data
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Message sent successfully!');
        formData = { name: '', email: '', message: '' };
        securityWarnings = {};
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to send message. Please try again.');
    }

    isSubmitting = false;
  }
</script>

<div class="secure-form">
  <h2>Secure Contact Form</h2>

  <form on:submit={handleSubmit}>
    <div class="form-group">
      <label for="name">Name:</label>
      <input
        id="name"
        type="text"
        bind:value={formData.name}
        on:input={(e) => validateField('name', e.target.value)}
        class:danger={securityWarnings.name}
      />
      {#if securityWarnings.name}
        <div class="warning">⚠️ Security concern detected</div>
      {/if}
    </div>

    <div class="form-group">
      <label for="email">Email:</label>
      <input
        id="email"
        type="email"
        bind:value={formData.email}
        on:input={(e) => validateField('email', e.target.value)}
        class:danger={securityWarnings.email}
      />
      {#if securityWarnings.email}
        <div class="warning">⚠️ Security concern detected</div>
      {/if}
    </div>

    <div class="form-group">
      <label for="message">Message:</label>
      <textarea
        id="message"
        bind:value={formData.message}
        on:input={(e) => validateField('message', e.target.value)}
        class:danger={securityWarnings.message}
      ></textarea>
      {#if securityWarnings.message}
        <div class="warning">⚠️ Security concern detected</div>
      {/if}
    </div>

    <button type="submit" disabled={isSubmitting || hasSecurityWarnings()}>
      {isSubmitting ? 'Submitting...' : 'Submit'}
    </button>
  </form>
</div>

<style>
  .secure-form {
    max-width: 500px;
    margin: 2rem auto;
    padding: 2rem;
    border: 1px solid #ddd;
    border-radius: 8px;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
  }

  input, textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }

  input.danger, textarea.danger {
    border-color: #dc3545;
    background-color: #f8d7da;
  }

  .warning {
    color: #dc3545;
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }

  button {
    background: #007bff;
    color: white;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }

  button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
</style>
```

## Next.js Integration

### Next.js API Route Protection

```javascript
// pages/api/secure-endpoint.js
import { ShieldFirewall } from 'shield-firewall';

let shield = null;

async function initShield() {
  if (!shield) {
    shield = new ShieldFirewall();
    await shield.configure({
      protectionLevel: 'strict',
      features: {
        networkInterception: true,
        behaviorAnalysis: true
      }
    });
    await shield.initialize();
    await shield.start();
  }
  return shield;
}

export default async function handler(req, res) {
  // Initialize security on first request
  const security = await initShield();

  // Validate request
  const isSafe = await security.validateContent(JSON.stringify(req.body));
  if (!isSafe) {
    return res.status(400).json({
      error: 'Security threat detected in request'
    });
  }

  // Process request
  try {
    const result = await processSecureRequest(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

### Next.js Page with Security

```jsx
// pages/secure-page.js
import { useEffect, useState } from 'react';
import { ShieldFirewall } from 'shield-firewall';

export default function SecurePage() {
  const [isProtected, setIsProtected] = useState(false);
  const [threats, setThreats] = useState([]);

  useEffect(() => {
    const initSecurity = async () => {
      const shield = new ShieldFirewall();

      await shield.configure({
        protectionLevel: 'strict',
        features: {
          domProtection: true,
          networkInterception: true,
          behaviorAnalysis: true,
          predictiveDetection: true
        }
      });

      await shield.initialize();
      await shield.start();

      setIsProtected(true);

      // Set up threat monitoring
      document.addEventListener('shield:threat-detected', (event) => {
        setThreats(prev => [event.detail, ...prev.slice(0, 9)]);
      });
    };

    initSecurity();
  }, []);

  return (
    <div className="container">
      <head>
        <title>Secure Next.js Page</title>
      </head>

      <main>
        <h1>🛡️ Secure Next.js Application</h1>

        <div className={`status ${isProtected ? 'protected' : 'initializing'}`}>
          Security Status: {isProtected ? 'Active' : 'Initializing...'}
        </div>

        <SecureForm />

        {threats.length > 0 && (
          <div className="threat-panel">
            <h2>Security Alerts ({threats.length})</h2>
            <div className="threat-list">
              {threats.map((threat, index) => (
                <div key={index} className="threat-item">
                  <span className="threat-type">{threat.type}</span>
                  <span className="threat-severity">{threat.severity}</span>
                  <span className="threat-time">
                    {new Date(threat.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SecureForm() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [warnings, setWarnings] = useState({});

  const validateField = async (field, value) => {
    const shield = new ShieldFirewall();
    const isSafe = await shield.validateContent(value);

    setWarnings(prev => ({
      ...prev,
      [field]: !isSafe
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasWarnings = Object.values(warnings).some(w => w);
    if (hasWarnings) {
      alert('Please fix security concerns before submitting');
      return;
    }

    // Submit to API
    const response = await fetch('/api/secure-endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      alert('Submitted successfully!');
      setFormData({ name: '', email: '', message: '' });
      setWarnings({});
    } else {
      alert('Submission failed due to security concerns');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="secure-form">
      <div className="form-group">
        <label>Name:</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, name: e.target.value }));
            validateField('name', e.target.value);
          }}
          className={warnings.name ? 'danger' : ''}
        />
        {warnings.name && <span className="warning">⚠️ Security concern</span>}
      </div>

      <div className="form-group">
        <label>Email:</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, email: e.target.value }));
            validateField('email', e.target.value);
          }}
          className={warnings.email ? 'danger' : ''}
        />
        {warnings.email && <span className="warning">⚠️ Security concern</span>}
      </div>

      <div className="form-group">
        <label>Message:</label>
        <textarea
          value={formData.message}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, message: e.target.value }));
            validateField('message', e.target.value);
          }}
          className={warnings.message ? 'danger' : ''}
        />
        {warnings.message && <span className="warning">⚠️ Security concern</span>}
      </div>

      <button type="submit" disabled={Object.values(warnings).some(w => w)}>
        Submit Securely
      </button>
    </form>
  );
}
```