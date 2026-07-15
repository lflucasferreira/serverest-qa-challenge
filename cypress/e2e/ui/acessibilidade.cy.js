describe('UI - Acessibilidade (axe-core)', { tags: ['@regression', '@a11y'] }, () => {
  let user;

  after(() => {
    cy.apiDeleteUser(user?._id);
  });

  it('página de login não tem novas violações de acessibilidade', () => {
    cy.visit('/login');
    cy.checkA11yPage();
  });

  it('página de cadastro não tem novas violações de acessibilidade', () => {
    cy.visit('/cadastrarusuarios');
    cy.checkA11yPage();
  });

  it('Home não tem novas violações de acessibilidade', () => {
    cy.apiCreateUser().then((createdUser) => {
      user = createdUser;
      cy.loginBySession(user.email, user.password);
      cy.checkA11yPage();
    });
  });
});
