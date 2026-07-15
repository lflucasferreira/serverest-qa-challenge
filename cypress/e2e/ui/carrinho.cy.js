const HomePage = require('../../pages/HomePage');
const CartPage = require('../../pages/CartPage');
const { HTTP_STATUS } = require('../../support/@enums/httpStatus');
const { useTestUser } = require('../../support/utils/testLifecycle');

describe('UI - Lista de compras', () => {
  const apiUrl = Cypress.env('apiUrl');
  const testUser = useTestUser();
  let admin;
  let adminToken;
  let product;

  before(() => {
    cy.apiCreateAdminWithToken()
      .then(({ admin: createdAdmin, token }) => {
        admin = createdAdmin;
        adminToken = token;
        return cy.apiCreateProduct(adminToken);
      })
      .then((createdProduct) => {
        product = createdProduct;
      });
  });

  after(() => {
    cy.apiDeleteProduct(product?._id, adminToken);
    cy.apiDeleteUser(admin?._id);
  });

  it('adiciona um produto pesquisado à lista de compras', { tags: '@smoke' }, () => {
    cy.step('Loga e confirma o carregamento da listagem de produtos');
    cy.intercept('GET', `${apiUrl}/produtos`).as('listarProdutos');
    cy.loginBySession(testUser.user.email, testUser.user.password);
    cy.url().should('include', '/home');

    cy.wait('@listarProdutos').then(({ response }) => {
      expect(response.statusCode).to.eq(HTTP_STATUS.OK);
      cy.validateJsonSchema(response.body, 'lista-produtos.schema.json');
    });

    cy.step('Busca o produto criado para o teste');
    cy.intercept('GET', `${apiUrl}/produtos?nome=*`).as('buscarProdutos');
    HomePage.search(product.nome);

    cy.wait('@buscarProdutos').then(({ request, response }) => {
      expect(request.query.nome).to.eq(product.nome);
      expect(response.statusCode).to.eq(HTTP_STATUS.OK);
      // Filtra pelo nome exato em vez de assumir length(1): o endpoint faz busca por
      // substring num banco público compartilhado, então outro produto criado em paralelo
      // poderia, em tese, também combinar com o termo pesquisado.
      const encontrado = response.body.produtos.find((p) => p.nome === product.nome);
      expect(encontrado, `produto "${product.nome}" na resposta da busca`).to.include({
        nome: product.nome,
        preco: product.preco,
      });
    });

    cy.step('Adiciona o produto à lista de compras e confirma a quantidade');
    HomePage.getProductCardByName(product.nome).should('be.visible');
    HomePage.addProductToListByName(product.nome);

    cy.url().should('include', '/minhaListaDeProdutos');
    CartPage.getProductNames().should('contain.text', product.nome);
    CartPage.getQuantity().should('contain.text', 'Total: 1');
  });

  it('incrementa a quantidade do produto na lista de compras', { tags: '@regression' }, () => {
    cy.loginBySession(testUser.user.email, testUser.user.password);
    HomePage.search(product.nome);
    HomePage.addProductToListByName(product.nome);

    cy.url().should('include', '/minhaListaDeProdutos');
    CartPage.increaseQuantity();
    CartPage.getQuantity().should('contain.text', 'Total: 2');
  });
});
