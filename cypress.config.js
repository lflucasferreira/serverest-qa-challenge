const { defineConfig } = require('cypress');
const cypressMochawesomeReporterPlugin = require('cypress-mochawesome-reporter/plugin');
const { TIMEOUTS } = require('./cypress/support/@enums/timeouts');

module.exports = defineConfig({
  expose: { grepFilterSpecs: true, grepOmitFiltered: true },
  video: true,
  screenshotOnRunFailure: true,
  defaultCommandTimeout: TIMEOUTS.DEFAULT_COMMAND,
  requestTimeout: TIMEOUTS.API_REQUEST,
  // Sem retries em nenhum modo: um teste que só passa na segunda tentativa é flakiness real,
  // não deve ser mascarada por um retry automático - precisa falhar visivelmente e ser investigada.
  retries: {
    runMode: 0,
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
      require('@bahmutov/cy-grep/src/plugin')(config);
      return config;
    },
  },
});
