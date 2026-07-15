const HomePage = require('../../pages/HomePage');
const { HTTP_STATUS } = require('../../support/@enums/httpStatus');
const { useTestUser } = require('../../support/utils/testLifecycle');

describe('UI - Resiliência a falhas da API', () => {
  const apiUrl = Cypress.env('apiUrl');
  const testUser = useTestUser();

  it(
    'não trata o erro quando GET /produtos falha - nenhum produto é exibido e nenhuma mensagem de erro aparece',
    { tags: '@regression' },
    () => {
      // Bug conhecido do front: o catch de getProdutos() só faz console.error(e.message) e não
      // devolve um fallback, então o .then() seguinte quebra tentando ler a propriedade "data"
      // de undefined. A frase exata do TypeError varia entre versões do V8/Chromium (ex.:
      // "Cannot read property 'data' of undefined" vs "Cannot read properties of undefined
      // (reading 'data')"), então checamos os fragmentos estáveis em vez do texto completo.
      // Sem esse listener o Cypress falharia o teste por exceção não tratada da aplicação;
      // aqui documentamos e validamos o estado resultante em vez de mascarar o bug.
      cy.on('uncaught:exception', (err) => {
        if (err.message.includes('undefined') && err.message.includes("'data'")) {
          return false;
        }
        return true;
      });

      cy.intercept('GET', `${apiUrl}/produtos`, {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        body: { message: 'Erro interno simulado' },
      }).as('produtosComErro');

      cy.loginBySession(testUser.user.email, testUser.user.password);
      cy.wait('@produtosComErro');

      HomePage.getLoadingIndicator().should('not.exist');
      cy.get('.card').should('not.exist');
      cy.contains('Nenhum produto foi encontrado').should('not.exist');
    },
  );
});
