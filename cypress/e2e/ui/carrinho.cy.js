const HomePage = require('../../pages/HomePage');
const CartPage = require('../../pages/CartPage');
const { HTTP_STATUS } = require('../../support/@enums/httpStatus');

describe('UI - Lista de compras', () => {
  const apiUrl = Cypress.env('apiUrl');
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

  it('adiciona um produto pesquisado à lista de compras', { tags: '@smoke' }, () => {
    cy.intercept('GET', `${apiUrl}/produtos`).as('listarProdutos');

    cy.loginBySession(user.email, user.password);
    cy.url().should('include', '/home');

    cy.wait('@listarProdutos').then(({ response }) => {
      expect(response.statusCode).to.eq(HTTP_STATUS.OK);
      cy.validateJsonSchema(response.body, 'lista-produtos.schema.json');
    });

    cy.intercept('GET', `${apiUrl}/produtos?nome=*`).as('buscarProdutos');
    HomePage.search(product.nome);

    cy.wait('@buscarProdutos').then(({ request, response }) => {
      expect(request.query.nome).to.eq(product.nome);
      expect(response.statusCode).to.eq(HTTP_STATUS.OK);
      expect(response.body.produtos).to.have.length(1);
      expect(response.body.produtos[0]).to.include({ nome: product.nome, preco: product.preco });
    });

    HomePage.getProductCardByName(product.nome).should('be.visible');
    HomePage.addProductToListByName(product.nome);

    cy.url().should('include', '/minhaListaDeProdutos');
    CartPage.getProductNames().should('contain.text', product.nome);
    CartPage.getQuantity().should('contain.text', 'Total: 1');
  });

  it('incrementa a quantidade do produto na lista de compras', { tags: '@regression' }, () => {
    cy.loginBySession(user.email, user.password);
    HomePage.search(product.nome);
    HomePage.addProductToListByName(product.nome);

    cy.url().should('include', '/minhaListaDeProdutos');
    CartPage.increaseQuantity();
    CartPage.getQuantity().should('contain.text', 'Total: 2');
  });
});
