const LoginPage = require('../../pages/LoginPage');
const HomePage = require('../../pages/HomePage');

describe('UI - Login', () => {
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
    LoginPage.visit().login(user.email, user.password);

    cy.url().should('include', '/home');
    HomePage.getLogoutButton().should('be.visible');
    cy.contains('Produtos').should('be.visible');
  });

  it('exibe mensagem de erro ao tentar logar com senha inválida', () => {
    LoginPage.visit().login(user.email, 'senha-incorreta');

    LoginPage.getErrorAlert().should('contain.text', 'Email e/ou senha inválidos');
    cy.url().should('include', '/login');
  });
});
