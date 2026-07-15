const { useTestUser } = require('../../support/utils/testLifecycle');

describe('Security - Exposição de dados sensíveis', { tags: '@security' }, () => {
  const apiUrl = Cypress.env('apiUrl');
  const testUser = useTestUser();

  it('BUG CONHECIDO: GET /usuarios (sem autenticação) retorna a senha em texto puro de todos os usuários cadastrados', () => {
    // OWASP API3:2019 - Excessive Data Exposure. Basta um GET simples, sem token e sem
    // nenhum payload malicioso, para obter a senha de qualquer usuário do sistema - inclusive
    // a de outros candidatos cujos dados de teste ainda estão no banco público compartilhado.
    cy.request('GET', `${apiUrl}/usuarios`).then((response) => {
      const encontrado = response.body.usuarios.find((u) => u.email === testUser.user.email);

      expect(encontrado, 'usuário de teste deveria aparecer na listagem pública').to.exist;
      expect(
        encontrado.password,
        'a senha não deveria vir no corpo da resposta de um endpoint público',
      ).to.eq(testUser.user.password);
    });
  });

  it('BUG CONHECIDO: GET /usuarios/{id} (sem autenticação) também retorna a senha em texto puro', () => {
    cy.request('GET', `${apiUrl}/usuarios/${testUser.user._id}`).then((response) => {
      expect(
        response.body.password,
        'a senha não deveria vir no corpo da resposta de um endpoint público',
      ).to.eq(testUser.user.password);
    });
  });
});
