/// <reference types="cypress" />

interface ServerestUser {
  nome: string;
  email: string;
  password: string;
  administrador: 'true' | 'false';
  _id: string;
  status: number;
}

interface ServerestProduct {
  nome: string;
  preco: number;
  descricao: string;
  quantidade: number;
  _id: string;
  status: number;
}

declare namespace Cypress {
  interface Chainable {
    /** Cria um usuário via API com dados únicos (Faker), aceitando overrides parciais. */
    apiCreateUser(overrides?: Partial<ServerestUser>): Chainable<ServerestUser>;

    /** Atalho para apiCreateUser com administrador: 'true'. */
    apiCreateAdmin(overrides?: Partial<ServerestUser>): Chainable<ServerestUser>;

    /** Cria um administrador e já autentica, retornando { admin, token }. */
    apiCreateAdminWithToken(
      overrides?: Partial<ServerestUser>,
    ): Chainable<{ admin: ServerestUser; token: string }>;

    /** POST /login via API. Não falha o teste em credenciais inválidas (failOnStatusCode: false). */
    apiLogin(email: string, password: string): Chainable<Cypress.Response<unknown>>;

    /** Remove um usuário pelo _id. Sem efeito se o id for falsy. */
    apiDeleteUser(id?: string): Chainable<unknown>;

    /** Cria um produto via API usando um token de administrador válido. */
    apiCreateProduct(
      token: string,
      overrides?: Partial<ServerestProduct>,
    ): Chainable<ServerestProduct>;

    /** Remove um produto pelo _id, usando token de administrador quando fornecido. */
    apiDeleteProduct(id?: string, token?: string): Chainable<unknown>;

    /**
     * Autentica via API e restaura a sessão (localStorage) com cy.session, depois
     * visita /home já autenticado. Use quando login não for o comportamento sob teste.
     */
    loginBySession(email: string, password: string): Chainable<void>;

    /** Injeta o axe-core e audita a página atual, ignorando as exclusões documentadas em a11yConfig.js. */
    checkA11yPage(): Chainable<void>;

    /** Valida um payload de resposta contra um JSON Schema em cypress/fixtures/schemas. */
    validateJsonSchema(payload: unknown, schemaFixtureName: string): Chainable<void>;
  }
}
