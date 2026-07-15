const { HTTP_STATUS } = require('../../support/@enums/httpStatus');
const { TIMEOUTS } = require('../../support/@enums/timeouts');

describe('API - Login', () => {
  const apiUrl = Cypress.env('apiUrl');
  let user;

  before(() => {
    cy.apiCreateUser().then((createdUser) => {
      user = createdUser;
    });
  });

  after(() => {
    cy.apiDeleteUser(user?._id);
  });

  it('autentica com sucesso e retorna um token de autorização', { tags: '@smoke' }, () => {
    cy.request('POST', `${apiUrl}/login`, {
      email: user.email,
      password: user.password,
    }).then((response) => {
      expect(response.status).to.eq(HTTP_STATUS.OK);
      expect(response.duration).to.be.lessThan(TIMEOUTS.API_RESPONSE_SLA_MS);
      expect(response.body.message).to.eq('Login realizado com sucesso');
      cy.validateJsonSchema(response.body, 'login-sucesso.schema.json');
    });
  });

  it('rejeita login com senha incorreta', { tags: '@regression' }, () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/login`,
      body: { email: user.email, password: 'senha-incorreta' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(HTTP_STATUS.UNAUTHORIZED);
      expect(response.body.message).to.eq('Email e/ou senha inválidos');
    });
  });

  it('rejeita login de usuário inexistente', { tags: '@regression' }, () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/login`,
      body: { email: 'usuario.inexistente@teste.com', password: 'qualquerSenha' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(HTTP_STATUS.UNAUTHORIZED);
      expect(response.body.message).to.eq('Email e/ou senha inválidos');
    });
  });
});
