const js = require('@eslint/js');
const cypressPlugin = require('eslint-plugin-cypress');
const prettierConfig = require('eslint-config-prettier');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  {
    ignores: ['node_modules/', 'cypress/videos/', 'cypress/screenshots/', 'mochawesome-report/'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
  },
  {
    ...cypressPlugin.configs.recommended,
    files: ['cypress/**/*.js'],
    rules: {
      ...cypressPlugin.configs.recommended.rules,
      'no-unused-expressions': 'off',
    },
  },
  prettierConfig,
];
