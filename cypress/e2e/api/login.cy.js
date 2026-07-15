const { HTTP_STATUS } = require('../../support/@enums/httpStatus');
const { TIMEOUTS } = require('../../support/@enums/timeouts');
const { useTestUser } = require('../../support/utils/testLifecycle');

describe('API - Login', () => {
  const apiUrl = Cypress.env('apiUrl');
  const testUser = useTestUser();

  it('autentica com sucesso e retorna um token de autorização', { tags: '@smoke' }, () => {
    cy.step('POST /login e validação do contrato de sucesso');
    cy.request('POST', `${apiUrl}/login`, {
      email: testUser.user.email,
      password: testUser.user.password,
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
      body: { email: testUser.user.email, password: 'senha-incorreta' },
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
