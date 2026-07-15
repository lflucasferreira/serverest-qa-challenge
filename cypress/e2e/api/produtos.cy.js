const { buildProduct } = require('../../support/utils/dataFactory');
const { HTTP_STATUS } = require('../../support/@enums/httpStatus');
const { TIMEOUTS } = require('../../support/@enums/timeouts');

describe('API - Produtos (rota administrativa)', () => {
  const apiUrl = Cypress.env('apiUrl');
  const createdUserIds = [];
  const createdProductIds = [];
  let adminToken;

  before(() => {
    cy.apiCreateAdmin()
      .then((admin) => {
        createdUserIds.push(admin._id);
        return cy.apiLogin(admin.email, admin.password);
      })
      .then((response) => {
        adminToken = response.body.authorization;
      });
  });

  after(() => {
    createdProductIds.forEach((id) => cy.apiDeleteProduct(id, adminToken));
    createdUserIds.forEach((id) => cy.apiDeleteUser(id));
  });

  it('cadastra um produto com sucesso usando token de administrador', { tags: '@smoke' }, () => {
    cy.apiCreateProduct(adminToken).then((product) => {
      expect(product.status).to.eq(HTTP_STATUS.CREATED);
      createdProductIds.push(product._id);
      cy.validateJsonSchema(
        { message: 'Cadastro realizado com sucesso', _id: product._id },
        'cadastro-sucesso.schema.json',
      );

      cy.request('GET', `${apiUrl}/produtos/${product._id}`).then((getResponse) => {
        expect(getResponse.status).to.eq(HTTP_STATUS.OK);
        expect(getResponse.body).to.include({ nome: product.nome, preco: product.preco });
      });
    });
  });

  it(
    'lista os produtos cadastrados respeitando o contrato de resposta',
    { tags: '@regression' },
    () => {
      cy.request('GET', `${apiUrl}/produtos`).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.OK);
        expect(response.duration).to.be.lessThan(TIMEOUTS.API_RESPONSE_SLA_MS);
        cy.validateJsonSchema(response.body, 'lista-produtos.schema.json');
      });
    },
  );

  it('não permite cadastrar dois produtos com o mesmo nome', { tags: '@regression' }, () => {
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
        expect(duplicateResponse.status).to.eq(HTTP_STATUS.BAD_REQUEST);
        expect(duplicateResponse.body.message).to.eq('Já existe produto com esse nome');
      });
    });
  });

  it('rejeita cadastro de produto sem token de autenticação', { tags: '@regression' }, () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/produtos`,
      body: buildProduct(),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(HTTP_STATUS.UNAUTHORIZED);
      expect(response.body.message).to.contain('Token de acesso ausente');
    });
  });

  it('rejeita cadastro de produto por usuário não administrador', { tags: '@regression' }, () => {
    cy.apiCreateUser()
      .then((user) => {
        createdUserIds.push(user._id);
        return cy.apiLogin(user.email, user.password);
      })
      .then((loginResponse) =>
        cy.request({
          method: 'POST',
          url: `${apiUrl}/produtos`,
          headers: { Authorization: loginResponse.body.authorization },
          body: buildProduct(),
          failOnStatusCode: false,
        }),
      )
      .then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.FORBIDDEN);
        expect(response.body.message).to.eq('Rota exclusiva para administradores');
      });
  });
});
