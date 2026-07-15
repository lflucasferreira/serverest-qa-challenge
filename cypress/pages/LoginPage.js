class LoginPage {
  visit() {
    cy.visit('/login');
    return this;
  }

  fillEmail(email) {
    cy.get('[data-testid="email"]').clear();
    cy.get('[data-testid="email"]').type(email);
    return this;
  }

  fillPassword(password) {
    cy.get('[data-testid="senha"]').clear();
    cy.get('[data-testid="senha"]').type(password);
    return this;
  }

  submit() {
    cy.get('[data-testid="entrar"]').click();
    return this;
  }

  login(email, password) {
    this.fillEmail(email).fillPassword(password).submit();
    return this;
  }

  goToCadastro() {
    cy.get('[data-testid="cadastrar"]').click();
    return this;
  }

  getErrorAlert() {
    return cy.get('.alert');
  }
}

module.exports = new LoginPage();
