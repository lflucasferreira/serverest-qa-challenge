const { defineConfig } = require('cypress');
const cypressMochawesomeReporterPlugin = require('cypress-mochawesome-reporter/plugin');

module.exports = defineConfig({
  video: true,
  screenshotOnRunFailure: true,
  defaultCommandTimeout: 8000,
  requestTimeout: 10000,
  retries: {
    runMode: 2,
    openMode: 0,
  },
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    reportDir: 'mochawesome-report',
    charts: true,
    embeddedScreenshots: true,
    inlineAssets: true,
    reportPageTitle: 'ServeRest QA Challenge - Relatório de Execução',
    overwrite: false,
    html: true,
    json: true,
  },
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'https://front.serverest.dev',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    env: {
      apiUrl: process.env.CYPRESS_API_URL || 'https://serverest.dev',
    },
    setupNodeEvents(on, config) {
      cypressMochawesomeReporterPlugin(on);
      return config;
    },
  },
});
