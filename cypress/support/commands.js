const { buildUser, buildProduct } = require('./utils/dataFactory');

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
