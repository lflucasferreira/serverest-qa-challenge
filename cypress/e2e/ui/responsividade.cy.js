const { VIEWPORTS } = require('../../support/@enums/viewports');
const { useTestUser } = require('../../support/utils/testLifecycle');

describe('UI - Responsividade (mobile)', () => {
  const testUser = useTestUser();

  it(
    'colapsa a navegação atrás do menu hambúrguer e mantém a listagem de produtos utilizável em viewport mobile',
    { tags: '@regression' },
    () => {
      cy.viewport(...VIEWPORTS.MOBILE);
      cy.loginBySession(testUser.user.email, testUser.user.password);

      cy.get('.navbar-toggler').should('be.visible');
      cy.get('[data-testid="home"]').should('not.be.visible');

      cy.get('.card').should('have.length.greaterThan', 0);
      cy.get('[data-testid="pesquisar"]').should('be.visible');

      // Bug conhecido do front: o botão hambúrguer usa apenas classes do Bootstrap CSS
      // (data-toggle/data-target), mas a aplicação não carrega o JS do Bootstrap/jQuery que
      // implementa o comportamento de colapso - o bundle não contém nenhuma referência a
      // bootstrap/jquery/Collapse. Comparamos o atributo class do container do menu antes e
      // depois do clique (em vez de só reafirmar a visibilidade de um item específico), para
      // provar que o clique realmente não altera o estado do componente.
      cy.get('#navbarTogglerDemo01').invoke('attr', 'class').as('collapseClassBefore');
      cy.get('.navbar-toggler').click();
      cy.get('@collapseClassBefore').then((classBefore) => {
        cy.get('#navbarTogglerDemo01').should('have.attr', 'class', classBefore);
      });
    },
  );
});
