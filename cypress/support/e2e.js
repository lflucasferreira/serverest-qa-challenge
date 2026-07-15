require('cypress-mochawesome-reporter/register');
require('cypress-axe');
require('cypress-plugin-steps');
require('@bahmutov/cy-grep')();
require('./commands');
require('./schemaValidator');
