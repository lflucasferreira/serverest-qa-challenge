const { HTTP_STATUS } = require('../../support/@enums/httpStatus');
const { useTestUser } = require('../../support/utils/testLifecycle');

const SQLI_PAYLOADS = ["' OR '1'='1", "'; DROP TABLE usuarios; --", "admin'--"];
const XSS_PAYLOAD = '<script>alert(document.cookie)</script>';

describe('Security - Injeção (SQL/NoSQL/XSS)', { tags: '@security' }, () => {
  const apiUrl = Cypress.env('apiUrl');
  const testUser = useTestUser();
  const createdUserIds = [];

  after(() => {
    createdUserIds.forEach((id) => cy.apiDeleteUser(id));
  });

  SQLI_PAYLOADS.forEach((payload) => {
    it(`rejeita SQL injection na senha de um login válido ("${payload}")`, () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/login`,
        body: { email: testUser.user.email, password: payload },
        failOnStatusCode: false,
      }).then((response) => {
        // Nunca deve autenticar (200) nem quebrar o servidor (500) com um payload malicioso.
        expect(response.status).to.eq(HTTP_STATUS.UNAUTHORIZED);
        expect(response.body.message).to.eq('Email e/ou senha inválidos');
      });
    });
  });

  it('rejeita SQL injection usada como e-mail (falha na validação de formato, não 500)', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/login`,
      body: { email: "' OR '1'='1", password: "' OR '1'='1" },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(HTTP_STATUS.BAD_REQUEST);
      expect(response.body.email).to.eq('email deve ser um email válido');
    });
  });

  it('armazena payload de SQL injection no campo nome como string literal, sem erro de servidor', () => {
    const payload = "Robert'); DROP TABLE usuarios;--";
    cy.apiCreateUser({ nome: payload }).then((user) => {
      createdUserIds.push(user._id);
      cy.request('GET', `${apiUrl}/usuarios/${user._id}`).then((response) => {
        expect(response.status).to.eq(HTTP_STATUS.OK);
        // Confirma que o valor foi persistido exatamente como enviado (nenhuma
        // interpretação/desvio) - evidência de que não há uma query SQL sendo montada
        // por concatenação a partir deste campo.
        expect(response.body.nome).to.eq(payload);
      });
    });
  });

  it('rejeita payload em formato NoSQL (objeto em vez de string) com 400, sem 500', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/login`,
      body: { email: { $gt: '' }, password: { $gt: '' } },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(HTTP_STATUS.BAD_REQUEST);
      expect(response.body.email).to.contain('string');
      expect(response.body.password).to.contain('string');
    });
  });

  it('não executa XSS armazenado no campo nome quando exibido na listagem administrativa', () => {
    let alertFired = false;
    cy.on('window:alert', () => {
      alertFired = true;
    });

    cy.apiCreateAdminWithToken().then(({ admin, token }) => {
      createdUserIds.push(admin._id);
      void token;

      cy.apiCreateUser({ nome: XSS_PAYLOAD }).then((victim) => {
        createdUserIds.push(victim._id);

        cy.loginBySession(admin.email, admin.password);
        cy.visit('/admin/listarusuarios');

        // Se o React não escapasse o valor, o browser executaria o <script> em vez de
        // renderizá-lo como texto visível - cy.contains só encontra texto real no DOM.
        cy.contains(XSS_PAYLOAD).should('be.visible');
        cy.then(() => {
          expect(alertFired, 'nenhum alert() deve disparar - payload deve virar texto, não script')
            .to.be.false;
        });
      });
    });
  });
});
