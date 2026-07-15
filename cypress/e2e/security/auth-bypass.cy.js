const { HTTP_STATUS } = require('../../support/@enums/httpStatus');
const { buildProduct } = require('../../support/utils/dataFactory');

const BAD_TOKEN = 'Bearer token.completamente.invalido.123';

describe('Security - Controle de acesso e autenticação', { tags: '@security' }, () => {
  const apiUrl = Cypress.env('apiUrl');
  let adminToken;
  let adminId;

  before(() => {
    cy.apiCreateAdminWithToken().then(({ admin, token }) => {
      adminId = admin._id;
      adminToken = token;
    });
  });

  after(() => {
    cy.apiDeleteUser(adminId);
  });

  // Mapeamos todos os endpoints do swagger.json (POST /login, GET/POST /usuarios, GET /produtos,
  // GET /carrinhos etc. são intencionalmente públicos e não entram aqui) e testamos cada rota que
  // deveria exigir autenticação, tanto sem enviar token quanto com um token inválido/adulterado.
  describe('BUG CONHECIDO: PUT e DELETE /usuarios/{id} não aplicam nenhuma autenticação', () => {
    it('PUT altera qualquer conta sem enviar nenhum token, inclusive promovendo a administrador', () => {
      cy.apiCreateUser().then((victim) => {
        cy.request({
          method: 'PUT',
          url: `${apiUrl}/usuarios/${victim._id}`,
          body: {
            nome: 'Conta comprometida via PUT sem token',
            email: victim.email,
            password: victim.password,
            administrador: 'true',
          },
        }).then((response) => {
          expect(response.status, 'deveria ser 401, mas a rota não checa autenticação').to.eq(
            HTTP_STATUS.OK,
          );
        });

        cy.request('GET', `${apiUrl}/usuarios/${victim._id}`).then((response) => {
          expect(response.body.administrador).to.eq('true');
        });

        cy.apiDeleteUser(victim._id);
      });
    });

    it('PUT altera qualquer conta mesmo com um token inválido/adulterado', () => {
      cy.apiCreateUser().then((victim) => {
        cy.request({
          method: 'PUT',
          url: `${apiUrl}/usuarios/${victim._id}`,
          headers: { Authorization: BAD_TOKEN },
          body: {
            nome: 'Conta comprometida via PUT com token inválido',
            email: victim.email,
            password: victim.password,
            administrador: victim.administrador,
          },
        }).then((response) => {
          expect(response.status, 'deveria ser 401, mas a rota não valida o token recebido').to.eq(
            HTTP_STATUS.OK,
          );
        });

        cy.apiDeleteUser(victim._id);
      });
    });

    it('DELETE remove qualquer conta sem enviar nenhum token', () => {
      cy.apiCreateUser().then((victim) => {
        cy.request({ method: 'DELETE', url: `${apiUrl}/usuarios/${victim._id}` }).then(
          (response) => {
            expect(response.status, 'deveria ser 401, mas a rota não checa autenticação').to.eq(
              HTTP_STATUS.OK,
            );
          },
        );

        cy.request({
          method: 'GET',
          url: `${apiUrl}/usuarios/${victim._id}`,
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status, 'usuário deveria ter deixado de existir').to.eq(
            HTTP_STATUS.BAD_REQUEST,
          );
        });
      });
    });

    it('DELETE remove qualquer conta mesmo com um token inválido/adulterado', () => {
      cy.apiCreateUser().then((victim) => {
        cy.request({
          method: 'DELETE',
          url: `${apiUrl}/usuarios/${victim._id}`,
          headers: { Authorization: BAD_TOKEN },
        }).then((response) => {
          expect(response.status, 'deveria ser 401, mas a rota não valida o token recebido').to.eq(
            HTTP_STATUS.OK,
          );
        });
      });
    });
  });

  describe('Rotas administrativas de produtos e carrinhos permanecem corretamente protegidas', () => {
    [
      { label: 'sem enviar nenhum token', headers: {} },
      { label: 'com um token inválido/adulterado', headers: { Authorization: BAD_TOKEN } },
    ].forEach(({ label, headers }) => {
      it(`rejeita POST /produtos ${label}`, () => {
        cy.request({
          method: 'POST',
          url: `${apiUrl}/produtos`,
          headers,
          body: buildProduct(),
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(HTTP_STATUS.UNAUTHORIZED);
        });
      });

      it(`rejeita PUT /produtos/:id ${label}`, () => {
        cy.apiCreateProduct(adminToken).then((product) => {
          cy.request({
            method: 'PUT',
            url: `${apiUrl}/produtos/${product._id}`,
            headers,
            body: {
              nome: 'não deveria conseguir alterar',
              preco: product.preco,
              descricao: product.descricao,
              quantidade: product.quantidade,
            },
            failOnStatusCode: false,
          }).then((response) => {
            expect(response.status).to.eq(HTTP_STATUS.UNAUTHORIZED);
          });
          cy.apiDeleteProduct(product._id, adminToken);
        });
      });

      it(`rejeita DELETE /produtos/:id ${label}`, () => {
        cy.apiCreateProduct(adminToken).then((product) => {
          cy.request({
            method: 'DELETE',
            url: `${apiUrl}/produtos/${product._id}`,
            headers,
            failOnStatusCode: false,
          }).then((response) => {
            expect(response.status).to.eq(HTTP_STATUS.UNAUTHORIZED);
          });
          cy.apiDeleteProduct(product._id, adminToken);
        });
      });

      it(`rejeita POST /carrinhos ${label}`, () => {
        cy.apiCreateProduct(adminToken).then((product) => {
          cy.request({
            method: 'POST',
            url: `${apiUrl}/carrinhos`,
            headers,
            body: { produtos: [{ idProduto: product._id, quantidade: 1 }] },
            failOnStatusCode: false,
          }).then((response) => {
            expect(response.status).to.eq(HTTP_STATUS.UNAUTHORIZED);
          });
          cy.apiDeleteProduct(product._id, adminToken);
        });
      });

      it(`rejeita DELETE /carrinhos/concluir-compra ${label}`, () => {
        cy.request({
          method: 'DELETE',
          url: `${apiUrl}/carrinhos/concluir-compra`,
          headers,
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(HTTP_STATUS.UNAUTHORIZED);
        });
      });

      it(`rejeita DELETE /carrinhos/cancelar-compra ${label}`, () => {
        cy.request({
          method: 'DELETE',
          url: `${apiUrl}/carrinhos/cancelar-compra`,
          headers,
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(HTTP_STATUS.UNAUTHORIZED);
        });
      });
    });
  });
});
