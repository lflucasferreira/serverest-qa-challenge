const { useTestUser } = require('../../support/utils/testLifecycle');

describe('UI - Acessibilidade (axe-core)', { tags: ['@regression', '@a11y'] }, () => {
  const testUser = useTestUser();

  it('login não tem violações de acessibilidade além das já conhecidas (ver a11yConfig.js)', () => {
    cy.visit('/login');
    cy.checkA11yPage();
  });

  it('cadastro não tem violações de acessibilidade além das já conhecidas (ver a11yConfig.js)', () => {
    cy.visit('/cadastrarusuarios');
    cy.checkA11yPage();
  });

  it('Home não tem violações de acessibilidade além das já conhecidas (ver a11yConfig.js)', () => {
    cy.loginBySession(testUser.user.email, testUser.user.password);
    cy.checkA11yPage();
  });
});
