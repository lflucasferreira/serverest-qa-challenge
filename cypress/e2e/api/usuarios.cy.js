const { buildUser } = require('../../support/utils/dataFactory');

describe('API - Usuários', () => {
  const apiUrl = Cypress.env('apiUrl');
  const createdUserIds = [];

  after(() => {
    createdUserIds.forEach((id) => cy.apiDeleteUser(id));
  });

  it('cadastra um usuário com sucesso e confirma a persistência via GET', () => {
    const user = buildUser();

    cy.request('POST', `${apiUrl}/usuarios`, user).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body.message).to.eq('Cadastro realizado com sucesso');
      expect(response.body._id).to.be.a('string');

      createdUserIds.push(response.body._id);

      cy.request('GET', `${apiUrl}/usuarios/${response.body._id}`).then((getResponse) => {
        expect(getResponse.status).to.eq(200);
        expect(getResponse.body).to.include({
          nome: user.nome,
          email: user.email,
          administrador: user.administrador,
        });
      });
    });
  });

  it('não permite cadastrar dois usuários com o mesmo e-mail', () => {
    const user = buildUser();

    cy.request('POST', `${apiUrl}/usuarios`, user).then((response) => {
      createdUserIds.push(response.body._id);

      cy.request({
        method: 'POST',
        url: `${apiUrl}/usuarios`,
        body: user,
        failOnStatusCode: false,
      }).then((duplicateResponse) => {
        expect(duplicateResponse.status).to.eq(400);
        expect(duplicateResponse.body.message).to.eq('Este email já está sendo usado');
      });
    });
  });

  it('retorna 400 ao buscar um usuário com ID inexistente', () => {
    cy.request({
      method: 'GET',
      url: `${apiUrl}/usuarios/idInexistente123`,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.message).to.eq('Usuário não encontrado');
    });
  });
});
