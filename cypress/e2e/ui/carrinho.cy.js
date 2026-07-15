const HomePage = require('../../pages/HomePage');
const CartPage = require('../../pages/CartPage');

describe('UI - Lista de compras', () => {
  let user;
  let admin;
  let adminToken;
  let product;

  before(() => {
    cy.apiCreateUser().then((createdUser) => {
      user = createdUser;
    });

    cy.apiCreateAdmin()
      .then((createdAdmin) => {
        admin = createdAdmin;
        return cy.apiLogin(admin.email, admin.password);
      })
      .then((response) => {
        adminToken = response.body.authorization;
        return cy.apiCreateProduct(adminToken);
      })
      .then((createdProduct) => {
        product = createdProduct;
      });
  });

  after(() => {
    cy.apiDeleteProduct(product?._id, adminToken);
    cy.apiDeleteUser(user?._id);
    cy.apiDeleteUser(admin?._id);
  });

  it('adiciona um produto pesquisado à lista de compras', () => {
    cy.loginBySession(user.email, user.password);
    cy.url().should('include', '/home');

    HomePage.search(product.nome);
    HomePage.getProductCardByName(product.nome).should('be.visible');
    HomePage.addProductToListByName(product.nome);

    cy.url().should('include', '/minhaListaDeProdutos');
    CartPage.getProductNames().should('contain.text', product.nome);
    CartPage.getQuantity().should('contain.text', 'Total: 1');
  });

  it('incrementa a quantidade do produto na lista de compras', () => {
    cy.loginBySession(user.email, user.password);
    HomePage.search(product.nome);
    HomePage.addProductToListByName(product.nome);

    cy.url().should('include', '/minhaListaDeProdutos');
    CartPage.increaseQuantity();
    CartPage.getQuantity().should('contain.text', 'Total: 2');
  });
});
