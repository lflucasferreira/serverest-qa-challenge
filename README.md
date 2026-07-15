# ServeRest QA Challenge

Suíte de testes automatizados com [Cypress](https://www.cypress.io/) para a aplicação [ServeRest](https://serverest.dev), cobrindo:

- **3 cenários E2E de frontend** (`https://front.serverest.dev`)
- **3 cenários de testes de API** (`https://serverest.dev`)

Desenvolvido como desafio técnico de processo seletivo.

## Stack

- [Cypress](https://www.cypress.io/) 15 — framework de testes
- [@faker-js/faker](https://fakerjs.dev/) — geração de massa de dados única a cada execução
- [cypress-mochawesome-reporter](https://github.com/LironEr/cypress-mochawesome-reporter) — relatório HTML com evidências (screenshots/vídeos embutidos)
- ESLint (`eslint-plugin-cypress`) + Prettier — padronização e qualidade de código
- GitHub Actions — CI/CD

## Estrutura do projeto

```
cypress/
├── e2e/
│   ├── ui/                  # cenários E2E de frontend
│   │   ├── cadastro.cy.js
│   │   ├── login.cy.js
│   │   └── carrinho.cy.js
│   └── api/                 # cenários de teste de API
│       ├── usuarios.cy.js
│       ├── login.cy.js
│       └── produtos.cy.js
├── pages/                   # Page Objects (camada de interação com a UI)
│   ├── LoginPage.js
│   ├── CadastroPage.js
│   ├── HomePage.js
│   └── CartPage.js
└── support/
    ├── commands.js           # custom commands para a API (setup/cleanup de dados)
    ├── e2e.js
    └── utils/dataFactory.js  # geração de usuários/produtos únicos via Faker
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

# modo interativo (Cypress Test Runner)
npm run cypress:open

# lint
npm run lint
```

Após a execução, o relatório HTML consolidado fica em `mochawesome-report/index.html`.

### Variáveis de ambiente

As URLs padrão já apontam para os ambientes públicos do desafio e podem ser sobrescritas se necessário:

| Variável             | Padrão                          | Uso                                   |
| -------------------- | -------------------------------- | -------------------------------------- |
| `CYPRESS_BASE_URL`    | `https://front.serverest.dev`    | `baseUrl` usado nos testes de UI       |
| `CYPRESS_API_URL`     | `https://serverest.dev`          | Base da API usada em `cy.request`      |

## Estratégia de testes

- **Page Objects** (`cypress/pages`) encapsulam seletores e ações da UI, mantendo os specs focados no comportamento testado.
- **Custom commands** (`cypress/support/commands.js`) encapsulam chamadas diretas à API (`apiCreateUser`, `apiCreateAdmin`, `apiLogin`, `apiCreateProduct`, `apiDeleteUser`, `apiDeleteProduct`) e são reaproveitados tanto pelos testes de API quanto para preparar massa de dados (setup) dos testes de UI — evitando passar pela UI apenas para criar pré-condições.
- **Seletores**: priorizados os atributos `data-testid` já existentes na aplicação (criada para fins de estudo de QA), o que torna os testes resilientes a mudanças de estilo/layout.
- **Massa de dados única (Faker)**: como o ServeRest é um ambiente **público e compartilhado** por todos os candidatos, todo usuário/produto criado usa nome/e-mail únicos (timestamp + dados aleatórios) para evitar colisões (ex.: erro de e-mail duplicado) e o banco pode ser resetado periodicamente — logo nenhum teste depende de dados fixos pré-existentes.
- **Isolamento e limpeza**: os dados criados via API em `before`/`after` de cada spec são removidos ao final (`apiDeleteUser`/`apiDeleteProduct`), para não acumular lixo no ambiente compartilhado.
- **Retries** (`retries.runMode: 2`): mitigam instabilidades de rede inerentes a testar um serviço de terceiros ao vivo, sem mascarar falhas reais (local/`--headed` mantém `retries: 0`).

## Cenários cobertos

### Frontend (`cypress/e2e/ui`)

| Spec | Cenário |
| --- | --- |
| `cadastro.cy.js` | Cadastro de usuário com sucesso (fluxo completo pela UI) e rejeição de e-mail já cadastrado |
| `login.cy.js` | Login com credenciais válidas e rejeição de senha inválida |
| `carrinho.cy.js` | Busca de produto e inclusão/alteração de quantidade na Lista de Compras |

> **Nota de investigação**: ao registrar um usuário pela UI, a aplicação autentica automaticamente e redireciona para `/home` (não para `/login`). A rota `/carrinho` (checkout) está sinalizada como "em construção" no ambiente atual — por isso o cenário de compras foi desenhado em torno do fluxo funcional real: `/minhaListaDeProdutos` (Lista de Compras).

### API (`cypress/e2e/api`)

| Spec | Cenário |
| --- | --- |
| `usuarios.cy.js` | Cadastro de usuário (201) com verificação de persistência via `GET`, rejeição de e-mail duplicado (400) e busca de ID inexistente (400) |
| `login.cy.js` | Login válido (200 + token), senha incorreta (401) e usuário inexistente (401) |
| `produtos.cy.js` | Cadastro de produto autenticado como administrador (201), nome duplicado (400), ausência de token (401) e usuário não-administrador (403) |

## CI/CD

O workflow [`.github/workflows/e2e.yml`](.github/workflows/e2e.yml) roda em todo `push`/`pull_request` para `main`:

1. **lint** — ESLint sobre todo o projeto.
2. **test** — executa a suíte completa (`npm test`) contra os ambientes reais do desafio e publica como artefatos do Actions: relatório Mochawesome, vídeos (sempre) e screenshots (em caso de falha).
3. **publish-report** — em push para `main`, publica o relatório HTML consolidado no GitHub Pages.

### Como ver as evidências de execução

- **GitHub Pages**: relatório da última execução em `main` — `https://<usuario>.github.io/<repositorio>/`
- **GitHub Actions**: aba *Actions* → selecionar o workflow run → seção *Artifacts* (`mochawesome-report`, `cypress-videos`, `cypress-screenshots`)
