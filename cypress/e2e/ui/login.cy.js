const LoginPage = require('../../pages/LoginPage');
const HomePage = require('../../pages/HomePage');

describe('UI - Login', () => {
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

  it('efetua login com credenciais válidas e acessa a Home', () => {
    cy.intercept('POST', `${apiUrl}/login`).as('login');

    LoginPage.visit().login(user.email, user.password);

    cy.wait('@login').then(({ request, response }) => {
      expect(request.headers['content-type']).to.include('application/json');
      expect(request.body).to.deep.equal({ email: user.email, password: user.password });

      expect(response.statusCode).to.eq(200);
      expect(response.body.message).to.eq('Login realizado com sucesso');
      expect(response.body.authorization).to.match(/^Bearer .+/);
    });

    cy.url().should('include', '/home');
    HomePage.getLogoutButton().should('be.visible');
    cy.contains('Produtos').should('be.visible');
  });

  it('exibe mensagem de erro ao tentar logar com senha inválida', () => {
    cy.intercept('POST', `${apiUrl}/login`).as('login');

    LoginPage.visit().login(user.email, 'senha-incorreta');

    cy.wait('@login').then(({ response }) => {
      expect(response.statusCode).to.eq(401);
      expect(response.body.message).to.eq('Email e/ou senha inválidos');
    });

    LoginPage.getErrorAlert().should('contain.text', 'Email e/ou senha inválidos');
    cy.url().should('include', '/login');
  });
});
