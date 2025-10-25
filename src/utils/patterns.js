/**
 * Threat patterns and signatures database for SHIELD.js
 * Contains regex patterns and rules for detecting various attack types
 */

class ThreatPatterns {
  constructor() {
    this.patterns = {
      xss: {
        // Basic XSS patterns
        scriptTags: /<script[^>]*>[\s\S]*?<\/script>/gi,
        javascriptUrls: /javascript:[^"'\s]*/gi,
        eventHandlers: /on\w+\s*=\s*["'][^"']*["']/gi,
        imgOnerror: /<img[^>]*onerror\s*=\s*["'][^"']*["'][^>]*>/gi,
        svgOnload: /<svg[^>]*onload\s*=\s*["'][^"']*["'][^>]*>/gi,

        // Advanced XSS patterns
        dataUrls: /data:text\/html[^"'\s]*/gi,
        vbscript: /vbscript:[^"'\s]*/gi,
        expression: /expression\s*\([^)]*\)/gi,
        cssExpression: /css\s*expression\s*\([^)]*\)/gi,

        // DOM-based XSS patterns
        documentWrite: /document\.write\s*\([^)]*\)/gi,
        innerHTML: /\.innerHTML\s*=\s*[^;]+/gi,
        outerHTML: /\.outerHTML\s*=\s*[^;]+/gi,
        insertAdjacentHTML: /\.insertAdjacentHTML\s*\([^)]*\)/gi,
      },

      injection: {
        // SQL Injection patterns
        sqlUnion: /\bunion\s+select\b/gi,
        sqlDrop: /\bdrop\s+table\b/gi,
        sqlInsert: /\binsert\s+into\b/gi,
        sqlDelete: /\bdelete\s+from\b/gi,
        sqlUpdate: /\bupdate\s+[^set]*\bset\b/gi,
        sqlComment: /\/\*[\s\S]*?\*\//g,
        sqlSemicolon: /;\s*(select|insert|update|delete|drop|create|alter)/gi,

        // NoSQL Injection patterns
        mongodbOperators: new RegExp(
          '(\\$where|\\$regex|\\$ne|\\$gt|\\$lt|\\$in|\\$nin|' +
          '\\$or|\\$and|\\$not|\\$nor|\\$exists|\\$type|\\$mod|\\$size|\\$all|\\$elemMatch)',
          'gi'
        ),
        javascriptInjection: /\{\s*\$func\s*:\s*function\s*\([^}]*\}/gi,

        // LDAP Injection patterns
        ldapWildcards: /\*\([^)]*\)/g,
        ldapOperators: /(\||&|!|\(|\))/g,

        // Command Injection patterns
        shellCommands: /(\||&|;|\$\(|`)/g,
        pathTraversal: /(\.\.\/|\.\.\\)/g,
        fileInclusion: /(include|require)\s*\([^)]*\)/gi,
      },

      csrf: {
        // CSRF patterns
        /* eslint-disable no-useless-escape */
        formWithoutToken: new RegExp(
          '<form[^>]*method\\s*=\\s*["\']post["\'][^>]*>' +
          '(?![\s\S]*name\\s*=\\s*["\']csrf["\'])',
          'gi'
        ),
        /* eslint-enable no-useless-escape */
        /* eslint-disable no-useless-escape */
        ajaxWithoutToken: new RegExp(
          '\\$?\\.ajax\\s*\\(\\s*\\{[^}]*url\\s*:\\s*["\'][^"\']*["\'][^}]*' +
          'method\\s*:\\s*["\'](post|put|patch|delete)["\'][^}]*\\}' +
          '(?![\s\S]*headers\\s*:\\s*\\{[^}]*[Xx]-[Cc][Ss][Rr][Ff]-[Tt]oken)',
          'gi'
        ),
        /* eslint-enable no-useless-escape */
      },

      cryptoMining: {
        // Crypto mining patterns
        coinHive: /coinhive\.com|authedmine\.com/gi,
        webAssemblyMining: /WebAssembly\.instantiate\s*\([^)]*mining[^)]*\)/gi,
        cpuIntensive: /while\s*\(\s*true\s*\)\s*\{[^}]*\}/gi,
        miningLibs: /(miner|mining|cryptonight|monero)/gi,
      },

      fingerprinting: {
        // Browser fingerprinting patterns
        canvasFingerprint: /canvas\.toDataURL\s*\(\s*\)/gi,
        webglFingerprint: /getParameter\s*\(\s*WEBGL/gi,
        fontFingerprint: /measureText\s*\([^)]*\)/gi,
        timingFingerprint: /performance\.now\s*\(\s*\)/gi,
      },

      keylogger: {
        // Keylogger detection patterns
        globalKeydown: /document\.addEventListener\s*\(\s*['"]keydown['"]/gi,
        keypressCapture: /window\.onkeypress\s*=/gi,
        clipboardAccess: /navigator\.clipboard/gi,
        passwordFieldMonitor: /input\[type\s*=\s*["']password["']\]/gi,
      },

      clickjacking: {
        // Clickjacking patterns
        iframeOverlay: new RegExp(
          '<iframe[^>]*style\\s*=\\s*["\'][^"\']*position\\s*:\\s*absolute' +
          '[^"\']*["\'][^>]*>',
          'gi'
        ),
        transparentDiv: /<div[^>]*style\s*=\s*["'][^"']*opacity\s*:\s*0[^"']*["'][^>]*>/gi,
        zIndexHigh: /z-index\s*:\s*\d{4,}/gi,
      },

      sessionHijacking: {
        // Session hijacking patterns
        cookieStealing: /document\.cookie/gi,
        localStorageAccess: /localStorage\.getItem\s*\(\s*['"]session['"]/gi,
        sessionStorageAccess: /sessionStorage\.getItem\s*\(\s*['"]session['"]/gi,
      },

      general: {
        // General malicious patterns
        base64Encoded: /[A-Za-z0-9+/]{100,}=*$/g, // Long base64 strings
        hexEncoded: /[0-9a-fA-F]{100,}/g, // Long hex strings
        suspiciousUrls: /(javascript|data|vbscript):/gi,
        evalUsage: /\beval\s*\(/gi,
        functionConstructor: /new\s+Function\s*\(/gi,
        setTimeoutString: /setTimeout\s*\(\s*['"]/gi,
        setIntervalString: /setInterval\s*\(\s*['"]/gi,
      }
    };

    this.threatScores = {
      xss: 90,
      injection: 85,
      csrf: 70,
      cryptoMining: 95,
      fingerprinting: 60,
      keylogger: 80,
      clickjacking: 75,
      sessionHijacking: 85,
      general: 50
    };

    this.compiledPatterns = new Map();
    this.compilePatterns();
  }

  /**
   * Compile all regex patterns for better performance
   */
  compilePatterns() {
    for (const [category, patterns] of Object.entries(this.patterns)) {
      for (const [name, pattern] of Object.entries(patterns)) {
        this.compiledPatterns.set(`${category}.${name}`, pattern);
      }
    }
  }

  /**
   * Test content against all threat patterns
   * @param {string} content - Content to test
   * @returns {Array} Array of detected threats
   */
  detectThreats(content) {
    const threats = [];

    for (const [patternKey, regex] of this.compiledPatterns) {
      const matches = content.match(regex);
      if (matches) {
        const [category, name] = patternKey.split('.');
        threats.push({
          category,
          pattern: name,
          matches: matches.length,
          score: this.threatScores[category] || 50,
          severity: this.getSeverity(this.threatScores[category]),
          details: matches.slice(0, 5) // First 5 matches
        });
      }
    }

    return threats;
  }

  /**
   * Test content against specific threat category
   * @param {string} content - Content to test
   * @param {string} category - Threat category
   * @returns {Array} Array of detected threats in category
   */
  detectCategoryThreats(content, category) {
    if (!this.patterns[category]) {
      return [];
    }

    const threats = [];
    const patterns = this.patterns[category];

    for (const [name, regex] of Object.entries(patterns)) {
      const matches = content.match(regex);
      if (matches) {
        threats.push({
          category,
          pattern: name,
          matches: matches.length,
          score: this.threatScores[category] || 50,
          severity: this.getSeverity(this.threatScores[category]),
          details: matches.slice(0, 5)
        });
      }
    }

    return threats;
  }

  /**
   * Calculate overall threat score for content
   * @param {string} content - Content to test
   * @returns {Object} Threat analysis result
   */
  analyzeContent(content) {
    const threats = this.detectThreats(content);
    const totalScore = threats.reduce((sum, threat) => sum + threat.score, 0);
    const maxScore = Math.max(...threats.map(t => t.score), 0);
    const threatCount = threats.length;

    return {
      threats,
      totalScore,
      maxScore,
      threatCount,
      riskLevel: this.getRiskLevel(totalScore, threatCount),
      recommendedAction: this.getRecommendedAction(totalScore, threatCount)
    };
  }

  /**
   * Get severity level based on score
   * @param {number} score - Threat score
   * @returns {string} Severity level
   */
  getSeverity(score) {
    if (score >= 90) return 'critical';
    if (score >= 75) return 'high';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'low';
    return 'info';
  }

  /**
   * Get risk level based on total score and threat count
   * @param {number} totalScore - Total threat score
   * @param {number} threatCount - Number of threats
   * @returns {string} Risk level
   */
  getRiskLevel(totalScore, threatCount) {
    if (totalScore >= 200 || threatCount >= 5) return 'high';
    if (totalScore >= 100 || threatCount >= 3) return 'medium';
    if (totalScore >= 50 || threatCount >= 1) return 'low';
    return 'none';
  }

  /**
   * Get recommended action based on analysis
   * @param {number} totalScore - Total threat score
   * @param {number} threatCount - Number of threats
   * @returns {string} Recommended action
   */
  getRecommendedAction(totalScore, threatCount) {
    if (totalScore >= 200 || threatCount >= 5) return 'block';
    if (totalScore >= 100 || threatCount >= 3) return 'quarantine';
    if (totalScore >= 50 || threatCount >= 1) return 'monitor';
    return 'allow';
  }

  /**
   * Add custom threat pattern
   * @param {string} category - Threat category
   * @param {string} name - Pattern name
   * @param {RegExp} pattern - Regex pattern
   * @param {number} score - Threat score
   */
  addPattern(category, name, pattern, score = 50) {
    if (!this.patterns[category]) {
      this.patterns[category] = {};
      this.threatScores[category] = score;
    }

    this.patterns[category][name] = pattern;
    this.compiledPatterns.set(`${category}.${name}`, pattern);
  }

  /**
   * Remove threat pattern
   * @param {string} category - Threat category
   * @param {string} name - Pattern name
   */
  removePattern(category, name) {
    if (this.patterns[category] && this.patterns[category][name]) {
      delete this.patterns[category][name];
      this.compiledPatterns.delete(`${category}.${name}`);
    }
  }

  /**
   * Get all patterns for a category
   * @param {string} category - Threat category
   * @returns {Object} Patterns object
   */
  getPatterns(category) {
    return this.patterns[category] || {};
  }

  /**
   * Update threat score for a category
   * @param {string} category - Threat category
   * @param {number} score - New score
   */
  updateThreatScore(category, score) {
    this.threatScores[category] = score;
  }
}

// Export singleton instance
const threatPatterns = new ThreatPatterns();
export default threatPatterns;