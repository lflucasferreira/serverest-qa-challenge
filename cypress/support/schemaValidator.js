const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

/**
 * Valida um objeto de resposta da API contra um JSON Schema em cypress/fixtures/schemas.
 * Falha com a lista completa de violações (não só a primeira) quando o contrato diverge.
 */
Cypress.Commands.add('validateJsonSchema', (payload, schemaFixtureName) => {
  cy.fixture(`schemas/${schemaFixtureName}`).then((schema) => {
    const validate = ajv.compile(schema);
    const valid = validate(payload);
    const errors = valid ? '' : ajv.errorsText(validate.errors, { separator: '\n' });
    expect(valid, `Schema '${schemaFixtureName}' inválido:\n${errors}`).to.be.true;
  });
});
