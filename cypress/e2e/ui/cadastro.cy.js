const CadastroPage = require('../../pages/CadastroPage');
const HomePage = require('../../pages/HomePage');
const { buildUser } = require('../../support/utils/dataFactory');
const { HTTP_STATUS } = require('../../support/@enums/httpStatus');

describe('UI - Cadastro de usuário', () => {
  const apiUrl = Cypress.env('apiUrl');
  const createdUserIds = [];

  after(() => {
    createdUserIds.forEach((id) => cy.apiDeleteUser(id));
  });

  it('cadastra um novo usuário com sucesso e acessa a Home autenticado', { tags: '@smoke' }, () => {
    const user = buildUser();

    cy.step('Preenche e submete o formulário de cadastro');
    cy.intercept('POST', `${apiUrl}/usuarios`).as('cadastrarUsuario');
    CadastroPage.visit().cadastrar(user);

    cy.step('Valida o payload enviado e a resposta da API');
    cy.wait('@cadastrarUsuario').then(({ request, response }) => {
      expect(request.headers['content-type']).to.include('application/json');
      expect(request.body).to.deep.equal({
        nome: user.nome,
        email: user.email,
        password: user.password,
        administrador: user.administrador,
      });

      expect(response.statusCode).to.eq(HTTP_STATUS.CREATED);
      expect(response.body.message).to.eq('Cadastro realizado com sucesso');
      cy.validateJsonSchema(response.body, 'cadastro-sucesso.schema.json');
      createdUserIds.push(response.body._id);
    });

    cy.step('Confirma que o usuário foi autenticado e redirecionado para a Home');
    cy.url().should('include', '/home');
    HomePage.getLogoutButton().should('be.visible');
    cy.window()
      .its('localStorage')
      .invoke('getItem', 'serverest/userEmail')
      .should('eq', user.email);
  });

  it('não permite cadastro com um e-mail já utilizado', { tags: '@regression' }, () => {
    cy.apiCreateUser().then((existingUser) => {
      createdUserIds.push(existingUser._id);

      cy.intercept('POST', `${apiUrl}/usuarios`).as('cadastrarUsuario');
      CadastroPage.visit().cadastrar({ ...buildUser(), email: existingUser.email });

      cy.wait('@cadastrarUsuario').then(({ response }) => {
        expect(response.statusCode).to.eq(HTTP_STATUS.BAD_REQUEST);
        expect(response.body.message).to.eq('Este email já está sendo usado');
      });

      CadastroPage.getErrorAlert().should('contain.text', 'Este email já está sendo usado');
      cy.url().should('include', '/cadastrarusuarios');
    });
  });

  it(
    'exibe mensagens de campo obrigatório ao submeter o cadastro em branco',
    { tags: '@regression' },
    () => {
      cy.intercept('POST', `${apiUrl}/usuarios`).as('cadastrarUsuario');

      CadastroPage.visit().submit();

      cy.wait('@cadastrarUsuario').then(({ response }) => {
        expect(response.statusCode).to.eq(HTTP_STATUS.BAD_REQUEST);
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
    },
  );
});
