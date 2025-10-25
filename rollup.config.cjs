const terser = require('@rollup/plugin-terser');
const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const json = require('@rollup/plugin-json');
const fs = require('fs');

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

module.exports = {
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
      banner: `/*! SHIELD.js v${packageJson.version} | MIT License */`
    },
    {
      file: 'dist/shield-firewall.esm.min.js',
      format: 'esm',
      sourcemap: true,
      banner: `/*! SHIELD.js v${packageJson.version} | MIT License */`
    }
  ]
};