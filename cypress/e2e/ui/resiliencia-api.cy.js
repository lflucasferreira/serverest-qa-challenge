const HomePage = require('../../pages/HomePage');
const { HTTP_STATUS } = require('../../support/@enums/httpStatus');

describe('UI - Resiliência a falhas da API', () => {
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
    'não trata o erro quando GET /produtos falha - nenhum produto é exibido e nenhuma mensagem de erro aparece',
    { tags: '@regression' },
    () => {
      // Bug conhecido do front: o catch de getProdutos() só faz console.error(e.message) e não
      // devolve um fallback, então o .then() seguinte quebra em "Cannot read properties of
      // undefined (reading 'data')". Sem esse listener o Cypress falharia o teste por exceção não
      // tratada da aplicação; aqui documentamos e validamos o estado resultante em vez de mascarar o bug.
      cy.on('uncaught:exception', (err) => {
        if (err.message.includes("Cannot read properties of undefined (reading 'data')")) {
          return false;
        }
        return true;
      });

      cy.intercept('GET', `${apiUrl}/produtos`, {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        body: { message: 'Erro interno simulado' },
      }).as('produtosComErro');

      cy.loginBySession(user.email, user.password);
      cy.wait('@produtosComErro');

      HomePage.getLoadingIndicator().should('not.exist');
      cy.get('.card').should('not.exist');
      cy.contains('Nenhum produto foi encontrado').should('not.exist');
    },
  );
});
