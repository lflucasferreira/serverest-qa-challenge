class CadastroPage {
  visit() {
    cy.visit('/cadastrarusuarios');
    return this;
  }

  fillNome(nome) {
    cy.get('[data-testid="nome"]').clear();
    cy.get('[data-testid="nome"]').type(nome);
    return this;
  }

  fillEmail(email) {
    cy.get('[data-testid="email"]').clear();
    cy.get('[data-testid="email"]').type(email);
    return this;
  }

  fillPassword(password) {
    cy.get('[data-testid="password"]').clear();
    cy.get('[data-testid="password"]').type(password);
    return this;
  }

  toggleAdministrador() {
    cy.get('[data-testid="checkbox"]').click();
    return this;
  }

  submit() {
    cy.get('[data-testid="cadastrar"]').click();
    return this;
  }

  cadastrar({ nome, email, password, administrador = false }) {
    this.fillNome(nome).fillEmail(email).fillPassword(password);
    if (administrador) this.toggleAdministrador();
    this.submit();
    return this;
  }

  getErrorAlert() {
    return cy.get('.alert');
  }
}

module.exports = new CadastroPage();
