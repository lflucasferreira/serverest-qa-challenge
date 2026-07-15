const { buildProduct } = require('../../support/utils/dataFactory');

describe('API - Produtos (rota administrativa)', () => {
  const apiUrl = Cypress.env('apiUrl');
  const createdUserIds = [];
  const createdProductIds = [];
  let adminToken;

  before(() => {
    cy.apiCreateAdmin().then((admin) => {
      createdUserIds.push(admin._id);
      cy.apiLogin(admin.email, admin.password).then((response) => {
        adminToken = response.body.authorization;
      });
    });
  });

  after(() => {
    createdProductIds.forEach((id) => cy.apiDeleteProduct(id, adminToken));
    createdUserIds.forEach((id) => cy.apiDeleteUser(id));
  });

  it('cadastra um produto com sucesso usando token de administrador', () => {
    cy.apiCreateProduct(adminToken).then((product) => {
      expect(product.status).to.eq(201);
      createdProductIds.push(product._id);

      cy.request('GET', `${apiUrl}/produtos/${product._id}`).then((getResponse) => {
        expect(getResponse.status).to.eq(200);
        expect(getResponse.body).to.include({ nome: product.nome, preco: product.preco });
      });
    });
  });

  it('não permite cadastrar dois produtos com o mesmo nome', () => {
    const product = buildProduct();

    cy.apiCreateProduct(adminToken, product).then((created) => {
      createdProductIds.push(created._id);

      cy.request({
        method: 'POST',
        url: `${apiUrl}/produtos`,
        headers: { Authorization: adminToken },
        body: product,
        failOnStatusCode: false,
      }).then((duplicateResponse) => {
        expect(duplicateResponse.status).to.eq(400);
        expect(duplicateResponse.body.message).to.eq('Já existe produto com esse nome');
      });
    });
  });

  it('rejeita cadastro de produto sem token de autenticação', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/produtos`,
      body: buildProduct(),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body.message).to.contain('Token de acesso ausente');
    });
  });

  it('rejeita cadastro de produto por usuário não administrador', () => {
    cy.apiCreateUser().then((user) => {
      createdUserIds.push(user._id);

      cy.apiLogin(user.email, user.password).then((loginResponse) => {
        cy.request({
          method: 'POST',
          url: `${apiUrl}/produtos`,
          headers: { Authorization: loginResponse.body.authorization },
          body: buildProduct(),
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(403);
          expect(response.body.message).to.eq('Rota exclusiva para administradores');
        });
      });
    });
  });
});
