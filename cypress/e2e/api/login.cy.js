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

  it('autentica com sucesso e retorna um token de autorização', () => {
    cy.request('POST', `${apiUrl}/login`, {
      email: user.email,
      password: user.password,
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.message).to.eq('Login realizado com sucesso');
      expect(response.body.authorization).to.match(/^Bearer .+/);
    });
  });

  it('rejeita login com senha incorreta', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/login`,
      body: { email: user.email, password: 'senha-incorreta' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body.message).to.eq('Email e/ou senha inválidos');
    });
  });

  it('rejeita login de usuário inexistente', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/login`,
      body: { email: 'usuario.inexistente@teste.com', password: 'qualquerSenha' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body.message).to.eq('Email e/ou senha inválidos');
    });
  });
});
