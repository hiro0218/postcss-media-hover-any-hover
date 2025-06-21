const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  // Import eslint:recommended configuration
  js.configs.recommended,
  // Project-specific configuration
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      // Add Node.js and ES6 global variables
      globals: {
        ...globals.node,
        ...globals.es2021,
        // Add custom global variables if needed
      },
    },
    files: ['**/*.js'],
    ignores: ['node_modules/**'],
    rules: {},
  },
];
