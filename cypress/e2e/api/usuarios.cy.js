const { buildUser } = require('../../support/utils/dataFactory');
const { HTTP_STATUS } = require('../../support/@enums/httpStatus');
const { TIMEOUTS } = require('../../support/@enums/timeouts');

describe('API - Usuários', () => {
  const apiUrl = Cypress.env('apiUrl');
  const createdUserIds = [];

  after(() => {
    createdUserIds.forEach((id) => cy.apiDeleteUser(id));
  });

  it(
    'cadastra um usuário com sucesso e confirma a persistência via GET',
    { tags: '@smoke' },
    () => {
      const user = buildUser();

      cy.step('POST /usuarios e validação do contrato de sucesso');
      cy.request('POST', `${apiUrl}/usuarios`, user).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.CREATED);
        expect(response.duration).to.be.lessThan(TIMEOUTS.API_RESPONSE_SLA_MS);
        expect(response.body.message).to.eq('Cadastro realizado com sucesso');
        cy.validateJsonSchema(response.body, 'cadastro-sucesso.schema.json');

        createdUserIds.push(response.body._id);

        cy.step('GET /usuarios/:id para confirmar a persistência');
        cy.request('GET', `${apiUrl}/usuarios/${response.body._id}`).then((getResponse) => {
          expect(getResponse.status).to.eq(HTTP_STATUS.OK);
          expect(getResponse.body).to.include({
            nome: user.nome,
            email: user.email,
            administrador: user.administrador,
          });
          cy.validateJsonSchema(getResponse.body, 'usuario.schema.json');
        });
      });
    },
  );

  it('não permite cadastrar dois usuários com o mesmo e-mail', { tags: '@regression' }, () => {
    const user = buildUser();

    cy.request('POST', `${apiUrl}/usuarios`, user).then((response) => {
      createdUserIds.push(response.body._id);

      cy.request({
        method: 'POST',
        url: `${apiUrl}/usuarios`,
        body: user,
        failOnStatusCode: false,
      }).then((duplicateResponse) => {
        expect(duplicateResponse.status).to.eq(HTTP_STATUS.BAD_REQUEST);
        expect(duplicateResponse.body.message).to.eq('Este email já está sendo usado');
      });
    });
  });

  it('retorna 400 ao buscar um usuário com ID inexistente', { tags: '@regression' }, () => {
    cy.request({
      method: 'GET',
      url: `${apiUrl}/usuarios/idInexistente123`,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(HTTP_STATUS.BAD_REQUEST);
      expect(response.body.message).to.eq('Usuário não encontrado');
    });
  });
});
