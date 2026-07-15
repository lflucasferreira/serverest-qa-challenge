const CadastroPage = require('../../pages/CadastroPage');
const HomePage = require('../../pages/HomePage');
const { buildUser } = require('../../support/utils/dataFactory');

describe('UI - Cadastro de usuário', () => {
  const createdUserIds = [];

  after(() => {
    createdUserIds.forEach((id) => cy.apiDeleteUser(id));
  });

  it('cadastra um novo usuário com sucesso e acessa a Home autenticado', () => {
    const user = buildUser();

    CadastroPage.visit().cadastrar(user);

    cy.url().should('include', '/home');
    HomePage.getLogoutButton().should('be.visible');
    cy.window()
      .its('localStorage')
      .invoke('getItem', 'serverest/userEmail')
      .should('eq', user.email);

    cy.request(`${Cypress.env('apiUrl')}/usuarios?email=${user.email}`).then((response) => {
      createdUserIds.push(response.body.usuarios[0]._id);
    });
  });

  it('não permite cadastro com um e-mail já utilizado', () => {
    cy.apiCreateUser().then((existingUser) => {
      createdUserIds.push(existingUser._id);

      CadastroPage.visit().cadastrar({ ...buildUser(), email: existingUser.email });

      CadastroPage.getErrorAlert().should('contain.text', 'Este email já está sendo usado');
      cy.url().should('include', '/cadastrarusuarios');
    });
  });
});
