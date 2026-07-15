# ServeRest QA Challenge

[![E2E Test Suite](https://github.com/lflucasferreira/serverest-qa-challenge/actions/workflows/e2e.yml/badge.svg)](https://github.com/lflucasferreira/serverest-qa-challenge/actions/workflows/e2e.yml)

Suíte de testes automatizados com [Cypress](https://www.cypress.io/) para a aplicação [ServeRest](https://serverest.dev), cobrindo E2E de frontend (`https://front.serverest.dev`) e testes de API (`https://serverest.dev`) — 26 cenários no total, além de acessibilidade e responsividade.

Desenvolvido como desafio técnico de processo seletivo.

## Stack

- [Cypress](https://www.cypress.io/) 15 — framework de testes
- [@faker-js/faker](https://fakerjs.dev/) — geração de massa de dados única a cada execução
- [ajv](https://ajv.js.org/) + [ajv-formats](https://github.com/ajv-validator/ajv-formats) — validação de contrato via JSON Schema
- [cypress-axe](https://github.com/component-driven/cypress-axe) — auditoria automatizada de acessibilidade (axe-core)
- [@bahmutov/cy-grep](https://github.com/bahmutov/cy-grep) — filtragem da suíte por tags (`@smoke`/`@regression`)
- [cypress-mochawesome-reporter](https://github.com/LironEr/cypress-mochawesome-reporter) — relatório HTML com evidências (screenshots/vídeos embutidos)
- ESLint (`eslint-plugin-cypress`) + Prettier — padronização e qualidade de código
- Husky + lint-staged — lint automático no pre-commit
- GitHub Actions + Dependabot — CI/CD e atualização de dependências

## Estrutura do projeto

```
cypress/
├── e2e/
│   ├── ui/                     # cenários E2E de frontend
│   │   ├── cadastro.cy.js
│   │   ├── login.cy.js
│   │   ├── carrinho.cy.js
│   │   ├── busca-produtos.cy.js    # estados de UI: loading e "sem resultados"
│   │   ├── resiliencia-api.cy.js   # comportamento do front quando a API falha (500)
│   │   ├── acessibilidade.cy.js    # axe-core
│   │   └── responsividade.cy.js    # viewport mobile
│   └── api/                    # cenários de teste de API
│       ├── usuarios.cy.js
│       ├── login.cy.js
│       └── produtos.cy.js
├── pages/                      # Page Objects (camada de interação com a UI)
│   ├── LoginPage.js
│   ├── CadastroPage.js
│   ├── HomePage.js
│   └── CartPage.js
├── fixtures/schemas/           # JSON Schemas usados por cy.validateJsonSchema
└── support/
    ├── @enums/                 # HTTP_STATUS, TIMEOUTS, VIEWPORTS centralizados
    ├── commands.js              # custom commands para a API (setup/cleanup de dados)
    ├── schemaValidator.js       # validação de contrato com Ajv
    ├── a11yConfig.js            # exclusões documentadas de regras de acessibilidade
    ├── e2e.js
    └── utils/dataFactory.js     # geração de usuários/produtos únicos via Faker
```

## Como rodar localmente

```bash
npm install

# suíte completa (API + UI)
npm test

# apenas UI
npm run test:ui

# apenas API
npm run test:api

# apenas cenários @smoke (fumaça, caminho feliz)
npm run test:smoke

# apenas cenários @regression
npm run test:regression

# modo interativo (Cypress Test Runner)
npm run cypress:open

# lint e formatação
npm run lint
npm run format:check
```

Após a execução, o relatório HTML consolidado fica em `mochawesome-report/index.html`.

### Variáveis de ambiente

As URLs padrão já apontam para os ambientes públicos do desafio e podem ser sobrescritas se necessário:

| Variável           | Padrão                        | Uso                               |
| ------------------ | ----------------------------- | --------------------------------- |
| `CYPRESS_BASE_URL` | `https://front.serverest.dev` | `baseUrl` usado nos testes de UI  |
| `CYPRESS_API_URL`  | `https://serverest.dev`       | Base da API usada em `cy.request` |

## Estratégia de testes

- **Page Objects** (`cypress/pages`) encapsulam seletores e ações da UI, mantendo os specs focados no comportamento testado.
- **Custom commands** (`cypress/support/commands.js`) encapsulam chamadas diretas à API (`apiCreateUser`, `apiCreateAdmin`, `apiLogin`, `apiCreateProduct`, `apiDeleteUser`, `apiDeleteProduct`) e são reaproveitados tanto pelos testes de API quanto para preparar massa de dados (setup) dos testes de UI — evitando passar pela UI apenas para criar pré-condições.
- **Seletores**: priorizados os atributos `data-testid` já existentes na aplicação (criada para fins de estudo de QA), o que torna os testes resilientes a mudanças de estilo/layout.
- **Massa de dados única (Faker)**: como o ServeRest é um ambiente **público e compartilhado** por todos os candidatos, todo usuário/produto criado usa nome/e-mail únicos (timestamp + dados aleatórios) para evitar colisões (ex.: erro de e-mail duplicado) e o banco pode ser resetado periodicamente — logo nenhum teste depende de dados fixos pré-existentes.
- **Isolamento e limpeza**: os dados criados via API em `before`/`after` de cada spec são removidos ao final (`apiDeleteUser`/`apiDeleteProduct`). O Cypress recomenda limpar estado _antes_ dos testes (para sobreviver a interrupções bruscas do runner); optamos por `after` porque a massa de dados já é única por execução (Faker + timestamp) — não há dado fixo de execuções anteriores para limpar antes de começar, então o pior cenário de uma interrupção é apenas um registro órfão no ambiente compartilhado, sem afetar a correção dos testes.
- **`cy.session()`** (`cy.loginBySession`, em `carrinho.cy.js`): autentica uma vez via API e reaproveita a sessão (localStorage) entre testes que não têm o login como comportamento sob teste, evitando repetir o formulário a cada `it`. Os specs que testam o próprio fluxo de login (`login.cy.js`) continuam preenchendo o formulário via UI, propositalmente.
- **`cy.intercept()`**: os specs de UI interceptam as requisições que o frontend dispara (`POST /usuarios`, `POST /login`, `GET /produtos`) para validar, além do resultado visual, que o payload/headers enviados pela tela correspondem ao que o usuário preencheu e que a resposta da API tem o status/corpo esperado — uma ponte entre o teste de UI e o contrato da API. Essa validação já pegou um bug real durante o desenvolvimento: `CadastroPage` sempre marcava o checkbox "administrador" porque a comparação usava a string `'false'` (truthy em JS) em vez de comparar contra `'true'`.
- **Stub completo de erro** (`resiliencia-api.cy.js`): além de fazer _spy_ nas chamadas reais, um cenário substitui totalmente a resposta da API por um 500 simulado (`cy.intercept` com `statusCode`/`body` fixos) para testar um caso que o ServeRest real não produz sob demanda — e documentar como o front reage (ou não reage) a isso.
- **Latência simulada** (`busca-produtos.cy.js`): `req.continue()` + `res.setDelay()` atrasa a resposta real da API para tornar o indicador de carregamento observável de forma determinística, sem depender de a rede estar lenta por acaso.
- **Validação de contrato com JSON Schema (Ajv)** (`cy.validateJsonSchema`): complementa as asserções campo-a-campo com uma validação formal de schema (tipo, obrigatoriedade, formato) contra fixtures em `cypress/fixtures/schemas/`, pegando divergências de contrato que uma asserção pontual deixaria passar.
- **Acessibilidade com cypress-axe**: audita login, cadastro e Home com axe-core. Como o ServeRest é uma aplicação de terceiros com dívida de acessibilidade pré-existente (`image-alt`, `color-contrast`, `link-name`, entre outras — ver `cypress/support/a11yConfig.js`), essas regras específicas são documentadas e excluídas para que o teste funcione como guarda contra **novas** regressões, sem reprovar a suíte por um problema fora do nosso controle.
- **Responsividade** (`responsividade.cy.js`): roda a Home em viewport mobile (375×667) e valida que o layout reflui corretamente.
- **Enums centralizados** (`cypress/support/@enums`): `HTTP_STATUS`, `TIMEOUTS` e `VIEWPORTS` eliminam números mágicos das asserções.
- **Tags `@smoke`/`@regression`** (`@bahmutov/cy-grep`): cada `it()` é tagueada; `npm run test:smoke` roda só o caminho feliz de cada fluxo (6 testes, ~25s) e `npm run test:regression` roda o restante — útil para um gate rápido em PR vs. a suíte completa no merge.
- **Retries** (`retries.runMode: 2`): mitigam instabilidades de rede inerentes a testar um serviço de terceiros ao vivo, sem mascarar falhas reais (local/`--headed` mantém `retries: 0`).

## Cenários cobertos

### Frontend (`cypress/e2e/ui`) — 15 cenários

| Spec                    | Cenário                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `cadastro.cy.js`        | Cadastro de usuário com sucesso (fluxo completo pela UI), rejeição de e-mail já cadastrado e validação de campos obrigatórios vazios |
| `login.cy.js`           | Login com credenciais válidas, rejeição de senha inválida e validação de campos obrigatórios vazios                                  |
| `carrinho.cy.js`        | Busca de produto e inclusão/alteração de quantidade na Lista de Compras                                                              |
| `busca-produtos.cy.js`  | Indicador de carregamento durante a busca e mensagem de "nenhum produto encontrado"                                                  |
| `resiliencia-api.cy.js` | Comportamento do front quando `GET /produtos` retorna 500 (bug documentado, ver abaixo)                                              |
| `acessibilidade.cy.js`  | Auditoria axe-core em login, cadastro e Home                                                                                         |
| `responsividade.cy.js`  | Layout em viewport mobile (375×667)                                                                                                  |

> **Nota de investigação**: ao registrar um usuário pela UI, a aplicação autentica automaticamente e redireciona para `/home` (não para `/login`). A rota `/carrinho` (checkout) está sinalizada como "em construção" no ambiente atual — por isso o cenário de compras foi desenhado em torno do fluxo funcional real: `/minhaListaDeProdutos` (Lista de Compras).

### API (`cypress/e2e/api`) — 11 cenários

| Spec             | Cenário                                                                                                                                             |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `usuarios.cy.js` | Cadastro de usuário (201) com verificação de persistência via `GET`, rejeição de e-mail duplicado (400) e busca de ID inexistente (400)             |
| `login.cy.js`    | Login válido (200 + token), senha incorreta (401) e usuário inexistente (401)                                                                       |
| `produtos.cy.js` | Cadastro de produto autenticado como administrador (201), listagem, nome duplicado (400), ausência de token (401) e usuário não-administrador (403) |

## Descobertas sobre a aplicação (ServeRest)

Investigando o comportamento real da aplicação para desenhar os testes, encontramos alguns pontos que vale documentar (e que viraram parte da cobertura, não obstáculos contornados em silêncio):

- **Cadastro autentica automaticamente**: ao se cadastrar pela UI, o usuário já é logado e redirecionado para `/home`, não para `/login`.
- **`/carrinho` está "em construção"**: o fluxo de compras funcional no ambiente atual é a Lista de Compras (`/minhaListaDeProdutos`), não a rota `/carrinho`.
- **Falha na API quebra a Home sem tratamento** (`resiliencia-api.cy.js`): o `.catch()` de `getProdutos()` no bundle do front só faz `console.error(e.message)` e não devolve nenhum fallback; o `.then()` seguinte tenta ler `.data` de `undefined` e lança uma exceção não tratada. Nenhuma mensagem de erro é exibida ao usuário.
- **Menu hambúrguer não funcional em mobile** (`responsividade.cy.js`): o botão usa os atributos `data-toggle`/`data-target` do Bootstrap, mas o bundle da aplicação não carrega o JS do Bootstrap/jQuery que implementa esse comportamento — o clique não abre a navegação colapsada.

## CI/CD

O workflow [`.github/workflows/e2e.yml`](.github/workflows/e2e.yml) roda em todo `push`/`pull_request` para `main`:

1. **lint** — ESLint + `prettier --check` sobre todo o projeto.
2. **test** — executa a suíte completa (`npm test`) contra os ambientes reais do desafio e publica como artefatos do Actions: relatório Mochawesome, vídeos (sempre) e screenshots (em caso de falha). O binário do Cypress é cacheado entre execuções para acelerar o job.
3. **publish-report** — em push para `main`, publica o relatório HTML consolidado no GitHub Pages.

### Como ver as evidências de execução

- **GitHub Pages**: relatório da última execução em `main` — https://lflucasferreira.github.io/serverest-qa-challenge/
- **GitHub Actions**: aba _Actions_ → selecionar o workflow run → seção _Artifacts_ (`mochawesome-report`, `cypress-videos`, `cypress-screenshots`)
- **Badge** no topo deste README reflete o status da última execução em `main`.

## Qualidade e manutenção

- **Husky + lint-staged**: um hook de `pre-commit` roda ESLint/Prettier apenas nos arquivos alterados, barrando localmente commits com problemas de lint antes mesmo do push.
- **Dependabot** (`.github/dependabot.yml`): abre PRs semanais para atualizar dependências npm e as actions usadas no workflow.
