class HomePage {
  visit() {
    cy.visit('/home');
    return this;
  }

  getLogoutButton() {
    return cy.get('[data-testid="logout"]');
  }

  logout() {
    this.getLogoutButton().click();
    return this;
  }

  search(term) {
    cy.get('[data-testid="pesquisar"]').clear();
    cy.get('[data-testid="pesquisar"]').type(term);
    cy.get('[data-testid="botaoPesquisar"]').click();
    return this;
  }

  getProductCardByName(name) {
    return cy.contains('.card', name);
  }

  addProductToListByName(name) {
    this.getProductCardByName(name).within(() => {
      cy.get('[data-testid="adicionarNaLista"]').click();
    });
    return this;
  }

  goToListaDeCompras() {
    cy.get('[data-testid="lista-de-compras"]').click();
    return this;
  }
}

module.exports = new HomePage();
