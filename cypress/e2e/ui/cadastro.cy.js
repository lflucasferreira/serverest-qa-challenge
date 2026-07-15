const CadastroPage = require('../../pages/CadastroPage');
const HomePage = require('../../pages/HomePage');
const { buildUser } = require('../../support/utils/dataFactory');

describe('UI - Cadastro de usuário', () => {
  const apiUrl = Cypress.env('apiUrl');
  const createdUserIds = [];

  after(() => {
    createdUserIds.forEach((id) => cy.apiDeleteUser(id));
  });

  it('cadastra um novo usuário com sucesso e acessa a Home autenticado', () => {
    const user = buildUser();
    cy.intercept('POST', `${apiUrl}/usuarios`).as('cadastrarUsuario');

    CadastroPage.visit().cadastrar(user);

    cy.wait('@cadastrarUsuario').then(({ request, response }) => {
      expect(request.headers['content-type']).to.include('application/json');
      expect(request.body).to.deep.equal({
        nome: user.nome,
        email: user.email,
        password: user.password,
        administrador: user.administrador,
      });

      expect(response.statusCode).to.eq(201);
      expect(response.body.message).to.eq('Cadastro realizado com sucesso');
      expect(response.body._id).to.be.a('string');
      createdUserIds.push(response.body._id);
    });

    cy.url().should('include', '/home');
    HomePage.getLogoutButton().should('be.visible');
    cy.window()
      .its('localStorage')
      .invoke('getItem', 'serverest/userEmail')
      .should('eq', user.email);
  });

  it('não permite cadastro com um e-mail já utilizado', () => {
    cy.apiCreateUser().then((existingUser) => {
      createdUserIds.push(existingUser._id);

      cy.intercept('POST', `${apiUrl}/usuarios`).as('cadastrarUsuario');
      CadastroPage.visit().cadastrar({ ...buildUser(), email: existingUser.email });

      cy.wait('@cadastrarUsuario').then(({ response }) => {
        expect(response.statusCode).to.eq(400);
        expect(response.body.message).to.eq('Este email já está sendo usado');
      });

      CadastroPage.getErrorAlert().should('contain.text', 'Este email já está sendo usado');
      cy.url().should('include', '/cadastrarusuarios');
    });
  });

  it('exibe mensagens de campo obrigatório ao submeter o cadastro em branco', () => {
    cy.intercept('POST', `${apiUrl}/usuarios`).as('cadastrarUsuario');

    CadastroPage.visit().submit();

    cy.wait('@cadastrarUsuario').then(({ response }) => {
      expect(response.statusCode).to.eq(400);
      expect(response.body).to.deep.equal({
        nome: 'nome é obrigatório',
        email: 'email é obrigatório',
        password: 'password é obrigatório',
      });
    });

    cy.contains('.alert', 'Nome é obrigatório').should('be.visible');
    cy.contains('.alert', 'Email é obrigatório').should('be.visible');
    cy.contains('.alert', 'Password é obrigatório').should('be.visible');
    cy.url().should('include', '/cadastrarusuarios');
  });
});
