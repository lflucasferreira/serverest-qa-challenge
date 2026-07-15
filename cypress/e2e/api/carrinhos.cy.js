const { HTTP_STATUS } = require('../../support/@enums/httpStatus');

describe('API - Carrinhos', () => {
  const apiUrl = Cypress.env('apiUrl');
  let adminToken;
  let adminId;
  let product;

  before(() => {
    cy.apiCreateAdminWithToken().then(({ admin, token }) => {
      adminId = admin._id;
      adminToken = token;
    });
  });

  beforeEach(() => {
    cy.apiCreateProduct(adminToken, { quantidade: 100 }).then((createdProduct) => {
      product = createdProduct;
    });
  });

  afterEach(() => {
    // Garante que nenhum carrinho fica aberto entre os testes (a API só permite um por usuário).
    cy.request({
      method: 'DELETE',
      url: `${apiUrl}/carrinhos/cancelar-compra`,
      headers: { Authorization: adminToken },
      failOnStatusCode: false,
    });
    cy.apiDeleteProduct(product?._id, adminToken);
  });

  after(() => {
    cy.apiDeleteUser(adminId);
  });

  it(
    'cria um carrinho, confirma seu conteúdo e conclui a compra debitando o estoque',
    { tags: '@smoke' },
    () => {
      cy.step('POST /carrinhos com o produto de teste');
      cy.request({
        method: 'POST',
        url: `${apiUrl}/carrinhos`,
        headers: { Authorization: adminToken },
        body: { produtos: [{ idProduto: product._id, quantidade: 3 }] },
      }).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.CREATED);
        const cartId = response.body._id;

        cy.step('GET /carrinhos/:id confirma o contrato e os valores calculados');
        cy.request({
          method: 'GET',
          url: `${apiUrl}/carrinhos/${cartId}`,
          headers: { Authorization: adminToken },
        }).then((getResponse) => {
          expect(getResponse.status).to.eq(HTTP_STATUS.OK);
          cy.validateJsonSchema(getResponse.body, 'carrinho.schema.json');
          expect(getResponse.body).to.include({
            precoTotal: product.preco * 3,
            quantidadeTotal: 3,
          });
        });

        cy.step('DELETE /carrinhos/concluir-compra debita o estoque e remove o carrinho');
        cy.request({
          method: 'DELETE',
          url: `${apiUrl}/carrinhos/concluir-compra`,
          headers: { Authorization: adminToken },
        }).then((concluirResponse) => {
          expect(concluirResponse.status).to.eq(HTTP_STATUS.OK);
          expect(concluirResponse.body.message).to.eq('Registro excluído com sucesso');
        });

        cy.request('GET', `${apiUrl}/produtos/${product._id}`).then((productResponse) => {
          expect(productResponse.body.quantidade).to.eq(100 - 3);
        });

        cy.request({
          method: 'GET',
          url: `${apiUrl}/carrinhos/${cartId}`,
          headers: { Authorization: adminToken },
          failOnStatusCode: false,
        }).then((getAfterResponse) => {
          expect(getAfterResponse.status).to.eq(HTTP_STATUS.BAD_REQUEST);
          expect(getAfterResponse.body.message).to.eq('Carrinho não encontrado');
        });
      });
    },
  );

  it('cancelar a compra devolve o estoque em vez de debitá-lo', { tags: '@regression' }, () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/carrinhos`,
      headers: { Authorization: adminToken },
      body: { produtos: [{ idProduto: product._id, quantidade: 5 }] },
    }).then((response) => {
      expect(response.status).to.eq(HTTP_STATUS.CREATED);

      cy.request({
        method: 'DELETE',
        url: `${apiUrl}/carrinhos/cancelar-compra`,
        headers: { Authorization: adminToken },
      }).then((cancelResponse) => {
        expect(cancelResponse.status).to.eq(HTTP_STATUS.OK);
        expect(cancelResponse.body.message).to.contain('reabastecido');
      });

      cy.request('GET', `${apiUrl}/produtos/${product._id}`).then((productResponse) => {
        expect(productResponse.body.quantidade, 'estoque não deveria ter sido debitado').to.eq(100);
      });
    });
  });

  it('não permite ter mais de um carrinho ativo por usuário', { tags: '@regression' }, () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/carrinhos`,
      headers: { Authorization: adminToken },
      body: { produtos: [{ idProduto: product._id, quantidade: 1 }] },
    }).then((response) => {
      expect(response.status).to.eq(HTTP_STATUS.CREATED);

      cy.request({
        method: 'POST',
        url: `${apiUrl}/carrinhos`,
        headers: { Authorization: adminToken },
        body: { produtos: [{ idProduto: product._id, quantidade: 1 }] },
        failOnStatusCode: false,
      }).then((duplicateResponse) => {
        expect(duplicateResponse.status).to.eq(HTTP_STATUS.BAD_REQUEST);
        expect(duplicateResponse.body.message).to.eq('Não é permitido ter mais de 1 carrinho');
      });
    });
  });
});
