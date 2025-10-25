import { rollup } from 'rollup';
import { terser } from 'rollup-plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

// Rollup configuration
const config = {
  input: 'src/shield-firewall.js',
  external: [], // No external dependencies for pure client-side bundle
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs(),
    json(),
    terser({
      compress: {
        drop_console: false, // Keep console logs for debugging
        drop_debugger: true,
        pure_funcs: ['console.debug']
      },
      mangle: {
        properties: {
          regex: /^_[A-Za-z]/ // Mangle private properties starting with _
        }
      },
      format: {
        comments: /^!/ // Keep license comments
      }
    })
  ],
  output: [
    {
      file: 'dist/shield-firewall.min.js',
      format: 'umd',
      name: 'ShieldFirewall',
      sourcemap: true,
      banner: `/*! SHIELD.js v${packageJson.version} | MIT License | https://github.com/shield-js/shield */`
    },
    {
      file: 'dist/shield-firewall.esm.min.js',
      format: 'es',
      sourcemap: true,
      banner: `/*! SHIELD.js v${packageJson.version} | MIT License | https://github.com/shield-js/shield */`
    }
  ]
};

// Build function
async function build() {
  console.log('Building SHIELD.js...');

  try {
    // Ensure dist directory exists
    if (!existsSync('dist')) {
      mkdirSync('dist');
    }

    // Create bundle
    const bundle = await rollup(config);

    // Generate outputs
    for (const output of config.output) {
      await bundle.write(output);
      console.log(`✓ Generated ${output.file}`);
    }

    await bundle.close();

    // Create additional distribution files
    await createDistFiles();

    console.log('✓ Build completed successfully!');
    console.log('📦 Distribution files created in ./dist/');

  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

// Create additional distribution files
async function createDistFiles() {
  const version = packageJson.version;

  // Create package.json for npm distribution
  const distPackageJson = {
    name: 'shield-js',
    version: version,
    description: packageJson.description,
    main: 'shield-firewall.min.js',
    module: 'shield-firewall.esm.min.js',
    browser: 'shield-firewall.min.js',
    types: './types/index.d.ts',
    files: [
      'shield-firewall.min.js',
      'shield-firewall.esm.min.js',
      'shield-firewall.min.js.map',
      'shield-firewall.esm.min.js.map'
    ],
    keywords: packageJson.keywords,
    author: packageJson.author,
    license: packageJson.license,
    repository: packageJson.repository,
    bugs: packageJson.bugs,
    homepage: packageJson.homepage,
    peerDependencies: {},
    dependencies: {}
  };

  writeFileSync('dist/package.json', JSON.stringify(distPackageJson, null, 2));

  // Create README for distribution
  const distReadme = `# SHIELD.js

> AI-Powered Client-Side Web Application Firewall

[![Version](https://img.shields.io/badge/version-${version}-blue.svg)](https://github.com/shield-js/shield)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

\`\`\`bash
npm install shield-js
\`\`\`

## Quick Start

\`\`\`javascript
import ShieldFirewall from 'shield-js';

const shield = new ShieldFirewall();
await shield.initialize();
await shield.start();

console.log('SHIELD.js protection active!');
\`\`\`

## Features

- Zero-dependency, client-side protection
- AI-powered behavioral analysis
- Real-time DOM monitoring and sanitization
- Predictive threat detection
- Network request interception
- Auto-recovery from attacks
- Visual dashboard and alerts
- Flexible configuration system

## Documentation

For complete documentation, visit: [https://shield-js.github.io/docs](https://shield-js.github.io/docs)

## License

MIT License - see the [LICENSE](LICENSE) file for details.
`;

  writeFileSync('dist/README.md', distReadme);

  // Create CDN-ready version info
  const cdnInfo = {
    version: version,
    files: {
      umd: 'shield-firewall.min.js',
      esm: 'shield-firewall.esm.min.js'
    },
    integrity: {
      umd: await generateIntegrity('dist/shield-firewall.min.js'),
      esm: await generateIntegrity('dist/shield-firewall.esm.min.js')
    },
    cdn: {
      jsdelivr: `https://cdn.jsdelivr.net/npm/shield-js@${version}/shield-firewall.min.js`,
      unpkg: `https://unpkg.com/shield-js@${version}/shield-firewall.min.js`
    }
  };

  writeFileSync('dist/cdn.json', JSON.stringify(cdnInfo, null, 2));

  console.log('✓ Distribution files created');
}

// Generate SRI integrity hash
async function generateIntegrity(filePath) {
  const crypto = await import('crypto');
  const fileContent = readFileSync(filePath);
  const hash = crypto.createHash('sha384').update(fileContent).digest('base64');
  return `sha384-${hash}`;
}

// Run build if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  build();
}

export { build, config };