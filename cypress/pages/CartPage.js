class CartPage {
  visit() {
    cy.visit('/minhaListaDeProdutos');
    return this;
  }

  getProductNames() {
    return cy.get('[data-testid="shopping-cart-product-name"]');
  }

  getQuantity() {
    return cy.get('[data-testid="shopping-cart-product-quantity"]');
  }

  increaseQuantity() {
    cy.get('[data-testid="product-increase-quantity"]').click();
    return this;
  }

  decreaseQuantity() {
    cy.get('[data-testid="product-decrease-quantity"]').click();
    return this;
  }

  clearList() {
    cy.get('[data-testid="limparLista"]').click();
    return this;
  }
}

module.exports = new CartPage();
