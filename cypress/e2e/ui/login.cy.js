const LoginPage = require('../../pages/LoginPage');
const HomePage = require('../../pages/HomePage');
const { HTTP_STATUS } = require('../../support/@enums/httpStatus');

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

  it('efetua login com credenciais válidas e acessa a Home', { tags: '@smoke' }, () => {
    cy.step('Preenche e submete o formulário de login');
    cy.intercept('POST', `${apiUrl}/login`).as('login');
    LoginPage.visit().login(user.email, user.password);

    cy.step('Valida o payload enviado e a resposta da API');
    cy.wait('@login').then(({ request, response }) => {
      expect(request.headers['content-type']).to.include('application/json');
      expect(request.body).to.deep.equal({ email: user.email, password: user.password });

      expect(response.statusCode).to.eq(HTTP_STATUS.OK);
      expect(response.body.message).to.eq('Login realizado com sucesso');
      cy.validateJsonSchema(response.body, 'login-sucesso.schema.json');
    });

    cy.step('Confirma o acesso autenticado à Home');
    cy.url().should('include', '/home');
    HomePage.getLogoutButton().should('be.visible');
    cy.contains('Produtos').should('be.visible');
  });

  it('exibe mensagem de erro ao tentar logar com senha inválida', { tags: '@regression' }, () => {
    cy.intercept('POST', `${apiUrl}/login`).as('login');

    LoginPage.visit().login(user.email, 'senha-incorreta');

    cy.wait('@login').then(({ response }) => {
      expect(response.statusCode).to.eq(HTTP_STATUS.UNAUTHORIZED);
      expect(response.body.message).to.eq('Email e/ou senha inválidos');
    });

    LoginPage.getErrorAlert().should('contain.text', 'Email e/ou senha inválidos');
    cy.url().should('include', '/login');
  });

  it(
    'exibe mensagens de campo obrigatório ao submeter o login em branco',
    { tags: '@regression' },
    () => {
      cy.intercept('POST', `${apiUrl}/login`).as('login');

      LoginPage.visit().submit();

      cy.wait('@login').then(({ response }) => {
        expect(response.statusCode).to.eq(HTTP_STATUS.BAD_REQUEST);
        expect(response.body).to.deep.equal({
          email: 'email é obrigatório',
          password: 'password é obrigatório',
        });
      });

      cy.contains('.alert', 'Email é obrigatório').should('be.visible');
      cy.contains('.alert', 'Password é obrigatório').should('be.visible');
      cy.url().should('include', '/login');
    },
  );
});
