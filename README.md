# ServeRest QA Challenge

[![E2E Test Suite](https://github.com/lflucasferreira/serverest-qa-challenge/actions/workflows/e2e.yml/badge.svg)](https://github.com/lflucasferreira/serverest-qa-challenge/actions/workflows/e2e.yml)

Suíte de testes automatizados com [Cypress](https://www.cypress.io/) para a aplicação [ServeRest](https://serverest.dev), cobrindo E2E de frontend (`https://front.serverest.dev`), testes de API (`https://serverest.dev`) e uma suíte dedicada de **testes de segurança** (injeção, controle de acesso e exposição de dados) — 55 cenários no total, além de acessibilidade e responsividade.

Desenvolvido como desafio técnico de processo seletivo.

## Stack

- [Cypress](https://www.cypress.io/) 15 — framework de testes
- [@faker-js/faker](https://fakerjs.dev/) — geração de massa de dados única a cada execução
- [ajv](https://ajv.js.org/) + [ajv-formats](https://github.com/ajv-validator/ajv-formats) — validação de contrato via JSON Schema
- [cypress-axe](https://github.com/component-driven/cypress-axe) — auditoria automatizada de acessibilidade (axe-core)
- [@bahmutov/cy-grep](https://github.com/bahmutov/cy-grep) — filtragem da suíte por tags (`@smoke`/`@regression`/`@security`)
- [cypress-mochawesome-reporter](https://github.com/LironEr/cypress-mochawesome-reporter) — relatório HTML com evidências (screenshots/vídeos embutidos)
- [Cypress Cloud](https://cloud.cypress.io) — histórico de execuções e detecção de flakiness (gravação em push/PR)
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
│   ├── api/                    # cenários de teste de API
│   │   ├── usuarios.cy.js
│   │   ├── login.cy.js
│   │   ├── produtos.cy.js
│   │   └── carrinhos.cy.js         # fluxo completo: criar, concluir e cancelar compra
│   └── security/                # testes de segurança (tag @security)
│       ├── injection.cy.js         # SQL/NoSQL injection e XSS
│       ├── auth-bypass.cy.js       # controle de acesso em todas as rotas autenticadas
│       └── data-exposure.cy.js     # exposição de senha em texto puro
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

# apenas testes de segurança (injeção, controle de acesso)
npm run test:security

# suíte funcional completa, excluindo os testes de segurança
npm run test:functional

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
- **Sem retries** (`retries: { runMode: 0, openMode: 0 }`): um teste que só passa na segunda tentativa é flakiness real, não deve ser mascarada por um retry automático - precisa falhar visivelmente no CI para ser investigada, mesmo rodando contra um serviço de terceiros ao vivo.

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

### API (`cypress/e2e/api`) — 14 cenários

| Spec              | Cenário                                                                                                                                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `usuarios.cy.js`  | Cadastro de usuário (201) com verificação de persistência via `GET`, rejeição de e-mail duplicado (400) e busca de ID inexistente (400)                                                                   |
| `login.cy.js`     | Login válido (200 + token), senha incorreta (401) e usuário inexistente (401)                                                                                                                             |
| `produtos.cy.js`  | Cadastro de produto autenticado como administrador (201), listagem, nome duplicado (400), ausência de token (401) e usuário não-administrador (403)                                                       |
| `carrinhos.cy.js` | Fluxo completo autenticado: cria carrinho, confirma conteúdo, conclui a compra (debita estoque), cancela a compra (reabastece estoque) e valida que não é permitido mais de um carrinho ativo por usuário |

### Segurança (`cypress/e2e/security`) — 26 cenários

| Spec                  | Cenário                                                                                                                                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `injection.cy.js`     | SQL injection na senha/e-mail do login, payload SQL armazenado como string literal no cadastro, payload NoSQL rejeitado (400, sem 500), XSS armazenado não é executado ao ser exibido no painel admin                                                  |
| `auth-bypass.cy.js`   | Mapeia **todas** as rotas autenticadas do swagger e testa cada uma sem token e com token inválido/adulterado - inclui os achados de que `PUT`/`DELETE /usuarios/{id}` não aplicam nenhuma autenticação e de escalação de privilégio (ver seção abaixo) |
| `data-exposure.cy.js` | `GET /usuarios` e `GET /usuarios/{id}` (sem autenticação) expondo a senha em texto puro de qualquer usuário (ver seção abaixo)                                                                                                                         |

## Descobertas de segurança

A suíte de segurança (`cypress/e2e/security`, tag `@security`) não é só teste de regressão do que já funciona - a investigação encontrou falhas reais na API, verificadas manualmente e depois convertidas em testes automatizados:

> **`GET /usuarios` expõe a senha em texto puro de todo usuário cadastrado, sem exigir autenticação.** Um `GET` simples e público — sem token, sem payload nenhum — já é suficiente para listar a senha de qualquer conta do sistema (inclusive de outros candidatos cujos dados de teste ainda estão no banco compartilhado). É o achado mais grave da suíte: não depende de nenhuma técnica de ataque, só de ler a resposta de um endpoint que já é público por design.

> **`PUT /usuarios/{id}` e `DELETE /usuarios/{id}` não exigem nenhuma autenticação.** Qualquer requisição - sem header `Authorization` ou com um token completamente inválido/adulterado - consegue alterar (inclusive promover `administrador: true`) ou excluir **qualquer** conta de usuário, bastando conhecer o `_id`. O `swagger.json` já declara `security: []` para essas duas rotas. Isso também permite **escalação de privilégio**: um usuário comum, autenticado com o próprio token válido, consegue se autopromover a administrador só editando o próprio perfil. Todas as demais rotas administrativas (`/produtos`, `/carrinhos`) foram testadas do mesmo jeito (sem token e com token inválido) e rejeitam corretamente com 401.

`auth-bypass.cy.js` e `data-exposure.cy.js` documentam esses achados como testes que hoje **passam** (as vulnerabilidades existem e são reproduzidas), no mesmo espírito de `resiliencia-api.cy.js`: se as rotas um dia passarem a se comportar corretamente, são exatamente esses testes que vão quebrar e sinalizar a mudança.

`injection.cy.js` cobre SQL injection (rejeitada pela validação de formato/senha, nunca causa bypass ou erro 500), payloads em formato NoSQL (rejeitados com 400 por validação de tipo) e XSS armazenado (persistido como string literal pela API, mas nunca executado pela UI - o front usa React sem `dangerouslySetInnerHTML`, então o payload aparece como texto visível na listagem administrativa em vez de rodar).

## Descobertas sobre a aplicação (ServeRest)

Investigando o comportamento real da aplicação para desenhar os testes, encontramos alguns pontos que vale documentar (e que viraram parte da cobertura, não obstáculos contornados em silêncio):

- **Cadastro autentica automaticamente**: ao se cadastrar pela UI, o usuário já é logado e redirecionado para `/home`, não para `/login`.
- **`/carrinho` está "em construção"**: o fluxo de compras funcional no ambiente atual é a Lista de Compras (`/minhaListaDeProdutos`), não a rota `/carrinho`.
- **Falha na API quebra a Home sem tratamento** (`resiliencia-api.cy.js`): o `.catch()` de `getProdutos()` no bundle do front só faz `console.error(e.message)` e não devolve nenhum fallback; o `.then()` seguinte tenta ler `.data` de `undefined` e lança uma exceção não tratada. Nenhuma mensagem de erro é exibida ao usuário.
- **Menu hambúrguer não funcional em mobile** (`responsividade.cy.js`): o botão usa os atributos `data-toggle`/`data-target` do Bootstrap, mas o bundle da aplicação não carrega o JS do Bootstrap/jQuery que implementa esse comportamento — o clique não abre a navegação colapsada.

## CI/CD

O workflow [`.github/workflows/e2e.yml`](.github/workflows/e2e.yml) roda em `push`/`pull_request` para `main`, manualmente (`workflow_dispatch`) e **a cada hora, em ponto** (`schedule: cron: '0 * * * *'`) como monitoramento contínuo — como o ServeRest é uma aplicação de terceiros, isso detecta mudanças de comportamento na app mesmo sem nenhum push nosso. Um `concurrency` group cancela runs obsoletos quando há pushes seguidos na mesma branch/PR.

1. **lint** — ESLint + `prettier --check` sobre todo o projeto.
2. **test** (Cypress Tests) — roda a suíte completa (API, UI **e segurança**, sem filtro de tags) contra os ambientes reais do desafio e publica como artefatos do Actions: relatório Mochawesome único com tudo, vídeos (sempre) e screenshots (em caso de falha).
3. **publish-report** — em push para `main` ou em execuções agendadas, publica esse relatório único no GitHub Pages.

O binário do Cypress é cacheado, chaveado pelo lockfile.

### Cypress Cloud

O projeto está associado a um projeto no [Cypress Cloud](https://cloud.cypress.io) (`projectId: '66q5cs'` em `cypress.config.js`), usado para histórico de execuções e detecção de flakiness ao longo do tempo — complementar à decisão de manter `retries: 0` (um teste instável precisa aparecer como falha, e o Cypress Cloud ajuda a enxergar o padrão histórico dessas falhas). A gravação (`--record`) só acontece em `push`/`pull_request` (não no cron horário, para não estourar a cota gratuita) e depende do secret `CYPRESS_RECORD_KEY` estar configurado no repositório; sem ele, o job roda normalmente sem gravar.

### Como ver as evidências de execução

- **GitHub Pages**: relatório único (funcional + segurança) da última execução em `main` — https://lflucasferreira.github.io/serverest-qa-challenge/
- **GitHub Actions**: aba _Actions_ → selecionar o workflow run → seção _Artifacts_ (`mochawesome-report`, `cypress-videos`, `cypress-screenshots`)
- **Badge** no topo deste README reflete o status da última execução em `main`.

## Qualidade e manutenção

- **Husky + lint-staged**: um hook de `pre-commit` roda ESLint/Prettier apenas nos arquivos alterados, barrando localmente commits com problemas de lint antes mesmo do push.
- **Dependabot** (`.github/dependabot.yml`): abre PRs semanais para atualizar dependências npm e as actions usadas no workflow.
- **`cy.step()`/`cy.section()`** (`cypress-plugin-steps`): os cenários `@smoke` têm suas fases anotadas (ex.: "Preenche e submete o formulário", "Valida a resposta da API"), o que aparece no relatório Mochawesome e ajuda quem for revisar sem precisar ler o código do teste.
- **Tipagem `.d.ts`** (`cypress/support/index.d.ts` + `tsconfig.json`): mesmo sendo um projeto JavaScript puro, os custom commands têm assinatura tipada para autocomplete/IntelliSense no editor - não afeta build nem execução dos testes.
- **`npm audit`**: as 6 vulnerabilidades reportadas (`diff`, `mocha`, `serialize-javascript`, `uuid`) são todas transitivas, vindas de dentro do próprio `cypress` (via `mocha`, seu test runner interno) e do `mochawesome`/`cypress-mochawesome-reporter` (geração do relatório) - nunca processam input externo não confiável, são devDependencies que não chegam à aplicação em produção, e corrigi-las exigiria forçar um downgrade/upgrade major dessas ferramentas centrais sem necessidade real. Risco avaliado como aceitável.
