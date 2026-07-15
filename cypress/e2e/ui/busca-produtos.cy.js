const { faker } = require('@faker-js/faker');
const HomePage = require('../../pages/HomePage');
const { TIMEOUTS } = require('../../support/@enums/timeouts');

describe('UI - Busca de produtos (estados de UI)', () => {
  const apiUrl = Cypress.env('apiUrl');
  let user;

  before(() => {
    cy.apiCreateUser().then((createdUser) => {
      user = createdUser;
    });
  });

  after(() => {
    cy.apiDeleteUser(user?._id);
  });

  it(
    'exibe o indicador de carregamento enquanto a busca está em andamento',
    { tags: '@regression' },
    () => {
      cy.intercept('GET', `${apiUrl}/produtos?nome=*`, (req) => {
        req.continue((res) => {
          res.setDelay(TIMEOUTS.SIMULATED_LATENCY_MS);
        });
      }).as('buscaLenta');

      cy.loginBySession(user.email, user.password);
      HomePage.search('Logitech');

      HomePage.getLoadingIndicator().should('be.visible');
      cy.wait('@buscaLenta');
      HomePage.getLoadingIndicator().should('not.exist');
    },
  );

  it(
    'exibe a mensagem de estado vazio quando a busca não encontra produtos',
    { tags: '@regression' },
    () => {
      const termoInexistente = faker.string.alphanumeric(20);

      cy.loginBySession(user.email, user.password);
      HomePage.search(termoInexistente);

      HomePage.getEmptyStateMessage().should('be.visible');
      cy.get('.card').should('not.exist');
    },
  );
});
