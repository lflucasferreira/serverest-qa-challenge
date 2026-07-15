/**
 * Registra os hooks before/after para criar um usuário via API antes da spec e
 * removê-lo ao final, evitando repetir esse boilerplate em cada arquivo de teste.
 * Retorna um objeto que é populado de forma assíncrona - leia `ctx.user` dentro
 * de `it()`/hooks posteriores, nunca no corpo do describe.
 */
function useTestUser(overrides = {}) {
  const ctx = {};

  before(() => {
    cy.apiCreateUser(overrides).then((createdUser) => {
      ctx.user = createdUser;
    });
  });

  after(() => {
    cy.apiDeleteUser(ctx.user?._id);
  });

  return ctx;
}

module.exports = { useTestUser };
