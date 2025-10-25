#!/usr/bin/env node

/**
 * Simple SHIELD.js Build Script
 * Creates basic distribution files
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const version = packageJson.version;

console.log(`Building SHIELD.js v${version}...`);

// Ensure dist directory exists
if (!existsSync('dist')) {
  mkdirSync('dist');
}

// For now, just copy the main file as the "minified" version
// In a real build, this would use proper bundling/minification
const mainFile = readFileSync('src/shield-firewall.js', 'utf8');

// Create a simple "minified" version (just removing some comments)
const minified = mainFile
  .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
  .replace(/\/\/.*$/gm, '') // Remove line comments
  .replace(/\s+/g, ' ') // Collapse whitespace
  .replace(/\s*([{}();,])\s*/g, '$1'); // Remove spaces around syntax

// Add banner
const banner = `/*! SHIELD.js v${version} | MIT License | https://github.com/shield-js/shield */\n`;

// Create UMD version
const umdWrapper = `
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis :
    global || self, global.ShieldFirewall = factory());
})(this, (function () { 'use strict';
  ${minified}
  return ShieldFirewall;
}));
`;

// Create ESM version
const esmVersion = `${banner}${minified}`;

// Write files
writeFileSync('dist/shield-firewall.min.js', banner + umdWrapper);
writeFileSync('dist/shield-firewall.esm.min.js', esmVersion);

// Copy documentation and other files
const filesToCopy = ['README.md', 'API.md', 'EXAMPLES.md'];
filesToCopy.forEach(file => {
  if (existsSync(file)) {
    copyFileSync(file, join('dist', file));
  }
});

// Create package.json for distribution
const distPackageJson = {
  name: 'shield-js',
  version: version,
  description: packageJson.description,
  main: 'shield-firewall.min.js',
  module: 'shield-firewall.esm.min.js',
  browser: 'shield-firewall.min.js',
  files: [
    'shield-firewall.min.js',
    'shield-firewall.esm.min.js',
    'README.md',
    'API.md',
    'EXAMPLES.md'
  ],
  keywords: packageJson.keywords,
  author: packageJson.author,
  license: packageJson.license,
  repository: packageJson.repository,
  bugs: packageJson.bugs,
  homepage: packageJson.homepage
};

writeFileSync('dist/package.json', JSON.stringify(distPackageJson, null, 2));

// Create CDN info
const cdnInfo = {
  version: version,
  timestamp: new Date().toISOString(),
  files: {
    umd: 'shield-firewall.min.js',
    esm: 'shield-firewall.esm.min.js'
  },
  cdn: {
    jsdelivr: `https://cdn.jsdelivr.net/npm/shield-js@${version}/shield-firewall.min.js`,
    unpkg: `https://unpkg.com/shield-js@${version}/shield-firewall.min.js`
  },
  size: {
    umd: umdWrapper.length,
    esm: esmVersion.length
  }
};

writeFileSync('dist/cdn.json', JSON.stringify(cdnInfo, null, 2));

console.log('Build completed successfully!');
console.log('Distribution files created in ./dist/');
console.log(`   - shield-firewall.min.js (${(umdWrapper.length / 1024).toFixed(1)} KB)`);
console.log(`   - shield-firewall.esm.min.js (${(esmVersion.length / 1024).toFixed(1)} KB)`);