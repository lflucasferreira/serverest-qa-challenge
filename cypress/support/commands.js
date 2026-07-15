const { buildUser, buildProduct } = require('./utils/dataFactory');
const { KNOWN_EXCLUSIONS } = require('./a11yConfig');

/**
 * Cria um usuário via API (mais rápido e isolado que passar pela UI) e retorna
 * o payload enviado + o _id retornado, para reuso nos specs de UI e de API.
 */
Cypress.Commands.add('apiCreateUser', (overrides = {}) => {
  const user = { ...buildUser(), ...overrides };
  return cy
    .request('POST', `${Cypress.env('apiUrl')}/usuarios`, user)
    .then((response) => ({ ...user, _id: response.body._id, status: response.status }));
});

Cypress.Commands.add('apiCreateAdmin', (overrides = {}) => {
  return cy.apiCreateUser({ administrador: 'true', ...overrides });
});

/**
 * Cria um usuário administrador e já autentica, retornando { admin, token } -
 * evita repetir a cadeia "criar admin -> logar -> capturar authorization" em cada spec.
 */
Cypress.Commands.add('apiCreateAdminWithToken', (overrides = {}) => {
  return cy.apiCreateAdmin(overrides).then((admin) =>
    cy.apiLogin(admin.email, admin.password).then((response) => ({
      admin,
      token: response.body.authorization,
    })),
  );
});

Cypress.Commands.add('apiLogin', (email, password) => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/login`,
    body: { email, password },
    failOnStatusCode: false,
  });
});

Cypress.Commands.add('apiDeleteUser', (id) => {
  if (!id) return;
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiUrl')}/usuarios/${id}`,
    failOnStatusCode: false,
  });
});

Cypress.Commands.add('apiCreateProduct', (token, overrides = {}) => {
  const product = { ...buildProduct(), ...overrides };
  return cy
    .request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/produtos`,
      headers: { Authorization: token },
      body: product,
    })
    .then((response) => ({ ...product, _id: response.body._id, status: response.status }));
});

Cypress.Commands.add('apiDeleteProduct', (id, token) => {
  if (!id) return;
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiUrl')}/produtos/${id}`,
    headers: token ? { Authorization: token } : {},
    failOnStatusCode: false,
  });
});

/**
 * Autentica via API e restaura a sessão (localStorage) entre testes com cy.session,
 * evitando repetir o formulário de login em specs onde login não é o comportamento sob teste.
 */
Cypress.Commands.add('loginBySession', (email, password) => {
  cy.session(
    email,
    () => {
      cy.apiLogin(email, password).then((response) => {
        expect(response.status, 'apiLogin em loginBySession retornou sucesso').to.eq(200);
        cy.visit('/login');
        cy.window().then((win) => {
          win.localStorage.setItem('serverest/userEmail', email);
          win.localStorage.setItem('serverest/userToken', response.body.authorization);
        });
      });
    },
    {
      validate: () => {
        cy.window()
          .its('localStorage')
          .invoke('getItem', 'serverest/userToken')
          .should('match', /^Bearer .+/);
      },
    },
  );
  cy.visit('/home');
});

/**
 * Injeta o axe-core e roda a auditoria de acessibilidade da página atual, ignorando as
 * regras documentadas em a11yConfig.js como dívida pré-existente do ServeRest.
 */
Cypress.Commands.add('checkA11yPage', () => {
  cy.injectAxe();
  cy.checkA11y(null, KNOWN_EXCLUSIONS);
});
