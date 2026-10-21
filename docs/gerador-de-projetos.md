# Gerador de projetos WEbdEX

Status: **v1 funcional, ainda não publicada**. O gerador (`apps/create`) tem TUI, modo não interativo, trava de reexecução e templates para Nest, Express, Fastify e AdonisJS (com Prisma, Drizzle, Mongoose ou Lucid, sobre PostgreSQL, MySQL ou MongoDB), filas com BullMQ + Redis e frontends Next, Vite + React e Inertia + React. O projeto gerado já vem com testes, CI e repositório git com commit inicial. Os pacotes `@devwebdex/*` ainda não foram publicados (A9), então hoje o gerador só roda a partir deste repositório. Este documento registra as decisões fechadas e o que ainda está em aberto. Atualize-o a cada decisão nova.

## Como usar (hoje, a partir deste repositório)

```bash
pnpm install && pnpm build
bun apps/create/src/cli.ts ../meu-projeto                     # TUI (mouse e teclado)
bun apps/create/src/cli.ts ../meu-projeto --yes --link-packages .   # não interativo, padrões
bun apps/create/src/cli.ts --help                             # todos os flags
```

`--link-packages .` instala os pacotes `@devwebdex/*` a partir deste checkout, enquanto eles não estão publicados. Depois da publicação, o uso passa a ser `bunx @devwebdex/create meu-projeto`.

## Objetivo

Padronizar a base dos novos projetos web da WEbdEX (8+ por ano). Um dev roda uma ferramenta de terminal (TUI) no Linux ou Windows, escolhe a stack e recebe um projeto com estrutura de pastas, lint, formatação, componentes visuais e kit de IA já padronizados.

## Decisões fechadas

### D1. Distribuição: modelo híbrido

O projeto **não** nasce de um fork deste repositório. Fork vira cópia que nunca recebe atualização e diverge com o volume de projetos.

- **Copiado para o projeto** (o projeto passa a ser dono): esqueleto das apps, `docs/standards/`, agentes de IA, CI.
- **Instalado como pacote versionado** (governança central): configs de TypeScript, lint e formatação, design tokens e componentes de UI.

**D1.a** Pacotes privados no GitHub Packages, scope `@devwebdex` (o GitHub Packages exige scope igual ao nome do dono do repositório). Cada dev e cada CI precisa de um `.npmrc` com token de leitura. O dono, `devwebdex` ("WEbdEX - Development"), é uma **conta de usuário**, não uma organização do GitHub: só quem tem o login dela administra o repositório e os pacotes (ver A14).

**D1.b** Atualizações chegam aos projetos por PR automático do Renovate. Cada projeto decide quando aceitar. Todo projeto gerado traz `.github/renovate.json`, que agrupa os `@devwebdex/*` num PR só e troca a faixa quando sai um minor em 0.x. O Renovate lê o GitHub Packages pelo segredo `DEVWEBDEX_PACKAGES_TOKEN` (PAT clássico com `read:packages`), cadastrado em developer.mend.io nas credenciais da conta ou organização dona do projeto; o app do Renovate precisa estar instalado no repositório.

### D2. Estrutura e stacks

Sempre presente, sem pergunta:

- Monorepo com pnpm workspaces + Turborepo, mesmo em projeto de uma app só.
- `docker-compose.yml` com o banco para desenvolvimento local.
- `Dockerfile` por app: **adiado** (A11). O build da imagem precisa baixar os pacotes `@devwebdex/*` do registry, o que só é testável depois da publicação (A9).

Perguntado pela TUI:

| Eixo | Opções |
|---|---|
| Arquitetura | monólito modular (microserviços aparecem como "em breve") |
| Backend | nenhum, Nest, Express, Fastify, AdonisJS |
| Banco | PostgreSQL 17, MySQL 8.4, MongoDB 8 (MongoDB não vale para o Adonis) |
| ORM | Adonis: Lucid (fixo, a TUI pula a pergunta). Nest/Express/Fastify: Prisma ou Drizzle (SQL), Mongoose (MongoDB, fixo) |
| Filas | nenhuma, BullMQ + Redis 8 (só com backend) |
| Frontend | nenhum, Next, Vite + React, Inertia + React (só com Adonis) |
| Web3 | sem biblioteca/framework web3, EVM com viem (Polygon), com ou sem backend (D15) |
| Sessão do login | cookie, token ou JWT; só com web3 e backend; sugestão: token com Vite, cookie nos outros; com Inertia, só cookie (D15) |

- Adonis não oferece Prisma/Drizzle porque auth, factories e validação do Adonis assumem Lucid.
- Express permanece porque projetos novos ainda nascem nele. Como o Express não traz convenção de módulos, a WEbdEX define e mantém a própria (`docs/standards/backend-express.md`, na camada `backend-express`).
- Microserviços ficam fora da v1. Entram depois como comando `webdex add service`.
- São 420 combinações válidas. Sem web3, as 108 de stack: 30 para cada backend Node (5 pares banco + ORM × com ou sem fila × Next, Vite ou nenhum frontend), 16 do Adonis (2 bancos × fila × 4 frontends) e 2 só-frontend (Next e Vite). Com web3, 312: as 2 só-frontend e as 106 com backend, cada uma com cookie, token ou JWT, menos as 4 com Inertia, que só têm cookie. O CI cobre 18, escolhidas para que toda camada de template rode ao menos uma vez (D12).
- A TUI só oferece combinações que existem: opção incompatível com as escolhas anteriores some, e etapa com uma opção só é pulada (ex.: Mongoose depois de MongoDB, filas sem backend).

### D3. Lint e formatação

Escolha fixa, não é opção na TUI.

- **Biome** formata e faz lint de todo o monorepo, distribuído como `@devwebdex/biome-config` (estendido via `"extends"`).
- **ESLint mínimo** apenas nas apps de backend, com `@typescript-eslint/no-floating-promises` e `@typescript-eslint/no-misused-promises`, distribuído como `@devwebdex/eslint-config`. Motivo: as regras com informação de tipo do Biome ainda são experimentais, e promessa sem `await` no backend é bug caro e silencioso. Quando o Biome cobrir isso, o ESLint sai pelo pacote compartilhado, sem mudança nos projetos.
- Next 16 removeu `next lint`; o linter roda direto pelos scripts do `package.json`.

### D4. Ferramenta de terminal: TUI com OpenTUI

- Interface TUI com interação por mouse e teclado, usando **OpenTUI** com bindings React.
- Runtime: Bun ≥ 1.3. Node só funciona a partir da 26.4 com `--experimental-ffi`.
- Ink foi descartado porque descarta eventos de mouse. Bubble Tea (Go) foi descartado por exigir uma linguagem que o time não usa.
- **Risco:** OpenTUI se declara "em desenvolvimento". Mitigação: versão fixada e TUI como camada fina sobre um núcleo de geração que não depende dela.
- **Visual** (escolhido pelo operador): painel com etapas. Logo "WEbdEX" em fonte ASCII (`block`) com "BD" em cor clara para lembrar o "bd" minúsculo da marca; barra lateral com ✓ feito, ● atual e ○ próximo (etapas feitas são clicáveis para voltar); cartões com descrição e selos "recomendado" / "em breve"; cores da marca tiradas do painel WEbdEX (magenta `#f5127c`, fundo ameixa `#0c0611`). Em terminal menor que 72×34, entra o modo compacto: logo pequeno, sem barra lateral e cartões sem descrição.
- **Modo não interativo** com o mesmo núcleo, por exemplo `bunx @devwebdex/create ../meu-projeto --backend nest --orm drizzle --db postgres --frontend next --yes` (antes da publicação, `bun apps/create/src/cli.ts ../meu-projeto ... --link-packages .`). Necessário para o CI das combinações, para agentes de IA e para terminais sem suporte a mouse.

### D5. Trava contra reexecução

Depois que o projeto é criado, a ferramenta não pode rodar de novo sobre ele.

- Ao criar o projeto, a ferramenta grava `.webdex/manifest.json` com a versão do gerador, as escolhas feitas e a data.
- O gerador recusa executar se o diretório de destino já tiver esse manifesto ou não estiver vazio. São tolerados `.git`, `README.md`, `LICENSE`, `LICENSE.md` e `.gitignore` (o que um repositório recém-criado no GitHub costuma ter); `README.md` e `.gitignore` são sobrescritos.
- A checagem roda antes da TUI abrir e de novo antes de gerar.
- Não existe `--force` na v1.
- A trava protege contra acidente, não contra quem apaga o manifesto de propósito.
- Comandos futuros (`webdex add service`, `webdex sync`) leem o manifesto para saber o que existe no projeto.

### D6. Kit de IA

O time usa várias ferramentas (Claude Code, opencode, Codex e outras), e cada uma tem seu formato:

| Ferramenta | Instruções do projeto | Subagentes |
|---|---|---|
| Claude Code | `CLAUDE.md` (importa `@AGENTS.md`) | `.claude/agents/*.md` |
| opencode | `AGENTS.md` | `.opencode/agents/*.md` (`mode: subagent`) |
| Codex | `AGENTS.md` | `.codex/agents/*.toml` |

Decisão:

- **Fonte única.** Cada agente é escrito uma vez em formato neutro neste repositório. O gerador produz as versões de cada ferramenta.
- **`AGENTS.md`** é o arquivo principal de instruções do projeto gerado, com comandos, estrutura e índice de `docs/standards/`. O `CLAUDE.md` só importa esse arquivo.
- **Agentes da v1:**
  - `security`: auth, autorização, segredos, OWASP.
  - `backend`: convenções do framework escolhido e do monólito modular.
  - `frontend`: só gerado quando há frontend.
  - `architecture-reviewer`: confere se o código respeita as fronteiras entre módulos. Esse é o principal ponto de degradação de um monólito modular.
- **Documentação de arquitetura** fica dentro das camadas de template (`apps/create/templates/<camada>/docs/standards/`) e chega ao `docs/standards/` do projeto gerado só para a stack escolhida:
  - `security.md` (camada `base`, sempre)
  - `modular-monolith.md` e `backend-<framework>.md` (camadas de backend)
  - `orm-<orm>.md` (camada do ORM)
  - `queues-bullmq.md` (camada de filas)
  - `frontend-<frontend>.md` (camada de frontend)
- Os agentes ficam no mesmo esquema (`<camada>/ai/agents/`), e o gerador roda o `scripts/sync-agents.mjs` no projeto para produzir as versões de cada ferramenta. O mesmo script é usado por este monorepo (`pnpm agents:sync`).
- Os agentes apontam para esses `.md` em vez de repetir o conteúdo, e a mesma documentação serve humanos e LLMs.
- Os docs são copiados, não instalados como pacote, porque ferramentas de IA costumam ignorar `node_modules`. Por isso o Renovate não os atualiza; um `webdex sync` fica para a v2.

### D7. Componentes e tokens: responsabilidade do time de design

> **Alterada em 2026-10-19.** O componente passou a nascer em código, e o Figma virou etapa de revisão: [ui/html-primeiro.md](ui/html-primeiro.md). O resto desta decisão continua valendo.

- O time de design define a linguagem visual; o componente é implementado em código e revisado por ele depois, seguindo [ui/criar-componente.md](ui/criar-componente.md). Os tokens vêm das Variables do Figma pelo subagente `figma-tokens`, seguindo [ui/figma-para-tokens.md](ui/figma-para-tokens.md).
- Componentes são distribuídos como pacote npm `@devwebdex/ui`, publicado a partir de `packages/ui` deste monorepo. A opção de registry com cópia (estilo shadcn) foi descartada: correções não chegariam aos projetos.
- Tokens no formato DTCG em `packages/tokens/src/`. O Style Dictionary gera `dist/theme.css` com bloco `@theme`, então os nomes dos tokens seguem os namespaces do Tailwind 4 (`color`, `radius`, `spacing`, `font`, `text`...).
- Componentes: variantes com `class-variance-authority`, classes mescladas por `cn` (`clsx` + `tailwind-merge`), só classes ligadas a tokens.

### D8. Distribuição da TUI

- `bunx @devwebdex/create`: exige Bun ≥ 1.3 instalado. O `.npmrc` com acesso ao GitHub Packages já é necessário para os pacotes `@devwebdex/*`.
- Escolhido por padrão (recomendação aceita sem objeção). Binário compilado por SO fica descartado na v1: exigiria pipeline de release por SO e assinatura no Windows.

### D9. Versões fixadas

- TypeScript **6.0.x** em todo o monorepo: o typescript-eslint 8.71 declara suporte a `typescript <6.1.0`, e o TypeScript 7 (nativo em Go) já é o `latest` no npm.
- tsconfigs explícitos em `module`/`types`, porque o TypeScript 6 mudou os padrões (`types: []`, `module: NodeNext`).

### D10. Como o gerador funciona

Código em `apps/create`, executado pelo Bun (sem etapa de build):

| Arquivo | Papel |
|---|---|
| `src/core/catalog.ts` | Opções da TUI, quais estão disponíveis, padrões e validação das combinações |
| `src/core/lock.ts` | Trava de reexecução (D5) |
| `src/core/generate.ts` | Escolhe e aplica as camadas, roda os scripts do projeto (`.env` e agentes) e grava o manifesto |
| `src/core/git.ts` | `git init` e commit inicial do projeto gerado |
| `src/tui/app.tsx` | TUI (OpenTUI + React), camada fina sobre o núcleo |
| `src/cli.ts` | Flags, modo não interativo, chamada da TUI, `pnpm install` e git |
| `templates/<camada>/` | Arquivos do projeto gerado |

Camadas aplicadas em ordem (`layersFor` em `generate.ts`):

| Camada | Conteúdo |
|---|---|
| `base` | Monorepo, Biome, Turborepo, CI, `AGENTS.md`, agente `security`, scripts `setup-env` e `sync-agents` |
| `backend-common` | Monólito modular, agentes `backend` e `architecture-reviewer`, scripts `db:*` da raiz |
| `db-<banco>` | `docker-compose.yml` e variáveis do banco |
| `backend-<framework>` | App do framework sem ORM, módulo `health`, testes |
| `orm-<orm>` | Config, scripts `db:*` e padrão do ORM |
| `orm-<orm>-<banco>` | Driver ou adapter do ORM para o banco |
| `<framework>-<orm>` | Integração: conexão e `ping()` usado pelo `health` (Express e Fastify usam `node-<orm>`) |
| `database-url-<banco>` | `DATABASE_URL` do `.env` da API |
| `backend-node-common` | Base comum de Express e Fastify (env, erros HTTP, validação, tsconfig, vitest), aplicada antes de `backend-<framework>` |
| `backend-adonis`, `backend-adonis-<banco>` | AdonisJS com Lucid (ORM nativo, sem as camadas de ORM) |
| `queue-bullmq` | Redis no `docker-compose.yml`, `REDIS_URL`, `pnpm dev:worker` e o padrão `queues-bullmq.md` |
| `node-bullmq`, `<framework>-bullmq` | Fila de exemplo `mail`, worker separado, Redis no `/health` e teste com Redis real |
| `frontend-<frontend>` | Next ou Vite (`apps/web`, com tokens, `@devwebdex/ui` e testes) ou Inertia (páginas React dentro do `apps/api` do Adonis) |
| `web3-evm` | Padrão `web3.md` e subagente `web3` |
| `web3-evm-core`, `web3-evm-store-<orm>`, `web3-evm-<orm>-<banco>` | Núcleo do login SIWE e do acesso por contrato (comum a Nest, Express e Fastify), armazenamento de nonces e sessões no ORM e migrações por dialeto |
| `web3-evm-<backend>` | Rotas, transporte da sessão e CSRF no framework (no Adonis, o login inteiro) |
| `web3-evm-<frontend>` | Carteira (wagmi) e, com backend, o login SIWE na página inicial |

Contrato entre camadas: toda integração framework + ORM expõe um `ping()` do banco (no Nest, `DatabaseHealth`; no Express e no Fastify, `connectDatabase()`), e o módulo `health` depende só dele. No Express e no Fastify, o `health` recebe uma lista de dependências com `ping()` (`checks`), então a fila só acrescenta o Redis à lista. A ordem das camadas importa quando duas escrevem o mesmo arquivo: a última vence. Por isso a fila do Adonis registra o worker como comando do Ace (descoberto sozinho na pasta `commands/`) e não mexe no `adonisrc.ts`, que a camada Inertia substitui. Para adicionar uma stack, crie as camadas dela, marque a opção como `available` no catálogo; um teste exige que toda combinação disponível tenha todas as camadas.

Convenções de nome dentro das camadas:

- `{{name}}` é substituído pelo nome do projeto.
- Arquivo ou pasta iniciado por `_` vira `.` (`_gitignore` → `.gitignore`, `_github` → `.github`), porque o npm descarta dotfiles ao publicar.
- Iniciado por `__` vira `_` literal (`__journal.json` → `_journal.json`).
- Sufixo `.append`: acrescenta o conteúdo ao arquivo de mesmo nome escrito por camadas anteriores (`AGENTS.md.append`, `pnpm-workspace.yaml.append`).
- Sufixo `.merge`: mescla JSON no arquivo de mesmo nome (`package.json.merge`).
- Blocos condicionais, linha a linha, em qualquer arquivo (`src/core/directives.ts`): `//#if queue=bullmq` … `//#else` … `//#endif`, com `!=` e alternativas (`frontend=next|vite`), aninháveis. As linhas de diretiva somem do arquivo gerado. Servem para um recurso opcional (fila, web3, sessão) entrar num arquivo que já existe sem que a camada dele traga uma cópia inteira desse arquivo: com dois ou mais recursos, as cópias se multiplicariam e divergiriam.

Outros comportamentos:

- O gerador roda o `scripts/setup-env.mjs` do próprio projeto (`pnpm env:setup`): cada `.env.example` vira `.env` com valores de desenvolvimento, e chave ou segredo vazio (ex.: `APP_KEY=`) ganha valor aleatório só no `.env`. O mesmo script serve a quem clona o projeto e ao CI.
- Depois do `pnpm install`, o gerador roda `git init -b main` e cria o commit inicial (`--skip-git` pula). Sem identidade do git configurada, só avisa.
- `--link-packages <dir>` aponta os `@devwebdex/*` para um checkout deste monorepo via `file:` (não `link:`: o Turbopack recusa arquivos fora da raiz do projeto). Antes de gerar, o CLI confere se o diretório é a raiz do checkout e se `tokens` e `ui` já foram compilados.
- O monorepo é dito explicitamente (pedido do operador em 2026-10-15): na etapa Arquitetura da TUI, no Resumo (linha "Estrutura", com as apps), no `--help` e na mensagem final do CLI.
- Erros de uso do CLI saem em uma ou duas linhas, com código 1 e sem stack trace: opção sem valor mostra um exemplo, opção desconhecida lista as aceitas, valor inválido ou incompatível cita o flag e os valores que servem, e um segundo diretório solto vira erro em vez de ser ignorado.
- Testes (`pnpm test`): núcleo (validação e mensagens, camadas de todas as combinações, apps do monorepo, `--link-packages`, trava, geração, `APP_KEY`, git sem `.env`, ausência de placeholder, versões dos `@devwebdex/*` nos templates), CLI (erros de uso, rodando o processo) e TUI (fluxo pelo mouse, aviso de monorepo, opção indisponível, pulo de etapas, Adonis sem pergunta de ORM, teclado, layout compacto).

### D11. Templates

Nest + Prisma + PostgreSQL + Next foi o primeiro, escolhido pelo operador. Versões e decisões verificadas em 2026-10-13 e 2026-10-14:

- **NestJS 12.1.3**: só ESM. Projeto com `"type": "module"`, `module: nodenext` e imports relativos com `.js`.
- **Prisma 7.10.0**: gerador `prisma-client` com saída em `src/generated/prisma` (ignorada no git, gerada no `build`/`dev`/`check-types`), `prisma.config.ts` e adapter `@prisma/adapter-pg`. O dist-tag `latest` do CLI `prisma` aponta para `8.0.0-rc`; foi ignorado por ser release candidate. O pnpm 10 precisa liberar os scripts de build de `prisma` e `@prisma/engines` (`onlyBuiltDependencies`).
- **Next 16.4.0**: Tailwind 4 pelo loader `@tailwindcss/turbopack`, tokens por `@import "@devwebdex/tokens/theme.css"`; Biome com os domínios `next` e `react`.
- Validação de entrada com `class-validator` e `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`).
- Variáveis de ambiente obrigatórias validadas na inicialização (`src/shared/config/env.ts`). Um `.env` por app; o da raiz serve ao docker-compose.
- A regra `useImportType` do Biome fica **desligada no `apps/api`**: ela troca imports de classes injetadas por `import type`, o que apaga a classe e quebra a injeção de dependência do Nest.
- Módulo de exemplo `health` (`GET /health` consulta o banco), seguindo controller → service.
- **Express 5.3** (2026-10-14): convenção de módulos da WEbdEX (`index.ts` como API pública, dependências por parâmetro, composição no `app.ts`), validação com zod 4, `HttpError` e handler central que devolve 500 sem detalhes.
- **AdonisJS 7.6** com Lucid 22: parte do kit API oficial reduzido (sem auth, sessão, shield, Tuyau e SQLite). Módulos em `app/modules`, CORS restrito a `CORS_ORIGINS`, `useImportType` desligado pelo mesmo motivo do Nest (`@inject()`). Traz o hash do core (scrypt, sem pacote extra), que o auth exige. Auth, sessão e Shield entram por `node ace add`, com a receita (e os ajustes à estrutura de módulos) no `backend-adonis.md` do projeto gerado, validada em 2026-10-15. O `database/schema.ts` que o Lucid gera a cada migração fica fora do Biome, do ESLint e da lista inicial do `tsc`: sem tabelas, ele sai com um import sem uso.
- **Drizzle** 0.45 com drizzle-kit 0.31: um `<modulo>.schema.ts` por módulo, reexportado em `src/shared/database/schema.ts`; o template já traz o journal de migrações vazio, porque sem ele `drizzle-kit migrate` falha sem mensagem.
- **MySQL 8.4**: o Prisma usa `@prisma/adapter-mariadb` (compatível com MySQL) com `allowPublicKeyRetrieval`, exigido pela autenticação padrão do MySQL 8 sem TLS; o Drizzle usa `mysql2`.
- Rodada de 2026-10-14 (Fastify, MongoDB, Vite, Inertia, filas): ver D14.

Validado: build, check-types e lint das três combinações (fullstack, só frontend, só backend); no fullstack, Postgres pelo docker-compose, `db:migrate` e `GET /health` (200 com banco no ar, 500 sem detalhes com banco fora).

### D12. CI e publicação

Decidido pelo operador em 2026-10-14. Fluxo completo e configuração do GitHub: [publicacao.md](publicacao.md).

- **Changesets 3**, versões **independentes** por pacote, publicação **só por PR de release aprovado** ("chore: versionar pacotes", aberto pelo `changesets/action@v2`).
- `pnpm version-packages` = `changeset version` + atualização das faixas `@devwebdex/*` nos templates + patch do `@devwebdex/create` quando um template muda.
- `@devwebdex/ui` não declara mais `@devwebdex/tokens` como peer dependency: com ela, cada `minor` dos tokens faria o changesets subir o `ui` para major.
- **CI** (`.github/workflows/ci.yml`), em todo PR e push na `prod`: lint, tipos, testes, `agents:check` e a matriz de 18 combinações de projeto gerado (build, tipos, lint e testes; com backend, banco via docker compose, `db:deploy` e `test:e2e`). Um job em Windows roda os testes do gerador e um projeto gerado, sem docker (R7).
- **Release** (`.github/workflows/release.yml`): publica no GitHub Packages com o `GITHUB_TOKEN` do workflow (`packages: write`), sem token pessoal.
- **Actions fixadas por SHA de commit** (versão no comentário), porque o release roda com permissão de escrita e de publicação: uma tag movida num repositório de terceiros executaria código com esse token. O Dependabot (`.github/dependabot.yml`) abre PR semanal para atualizar os SHAs. No CI, o checkout usa `persist-credentials: false`; no release, as credenciais ficam, porque o `changesets/action` faz push do PR de versão.

### D13. Testes, CI e git no projeto gerado

Pedido pelo operador em 2026-10-14.

- `pnpm test` (unitários, sem banco) e `pnpm test:e2e` (com o banco do docker compose), pelo Turborepo.
- Nest, Express e Fastify: vitest 5 (Fastify usa `app.inject()` em vez do supertest). O vitest 5 (Vite 8) já emite o metadata dos decorators do Nest, sem SWC. Os unitários trocam o banco por um falso; o e2e sobe a API e chama `GET /health` com o banco real.
- AdonisJS: Japa, o runner nativo (suítes `unit` e `functional`).
- Next e Vite: vitest com Testing Library e jsdom. Inertia: teste funcional do Japa com o plugin do Inertia (`withInertia()`, `assertInertiaComponent`).
- Com fila: um teste e2e enfileira um job e espera o worker terminar, contra o Redis do docker compose.
- Com web3: unitários do login com cliente da rede falso; e2e com o banco real, uma conta local assinando a mensagem SIWE e um cliente da rede que verifica sem RPC. Cobrem login, `me`, logout, nonce reutilizado, domínio e URI errados, corpo inválido, `/access/admin` e, com cookie, `Origin` inválido. Nos frontends, o componente da carteira com o conector `mock` do wagmi e o login com `fetch` simulado.
- CI do projeto gerado (`.github/workflows/ci.yml`): instala com acesso de leitura ao GitHub Packages, roda `env:setup`, build, tipos, lint e testes; se houver `docker-compose.yml`, sobe o banco, aplica migrações e roda o e2e. Actions fixadas por SHA, como no monorepo.
- Git: commit inicial depois do `pnpm install` (o lockfile entra), branch `main`, `.env` fora do repositório (há teste para isso).

### D14. Fastify, MongoDB, Vite, Inertia e filas

Pedido pelo operador em 2026-10-14 ("1; 2; 3; 4; 5"). Versões e comportamentos verificados nessa data:

- **Fastify 5.12** com `@fastify/cors`: mesma convenção de módulos do Express (D11), com cada módulo virando plugin com prefixo; testes por `app.inject()`. Express e Fastify compartilham a camada `backend-node-common` e as integrações `node-<orm>`.
- **MongoDB 8 + Mongoose 9**: o Prisma 7 não suporta MongoDB (a linha 6 ficaria sem caminho de upgrade), por isso Mongoose é o ORM fixo para MongoDB. MongoDB não é oferecido no Adonis, cujo Lucid é só SQL. Sem migrações: `pnpm db:migrate` e `pnpm db:deploy` não fazem nada (os scripts da raiz usam `--if-present`).
- **Vite 8 + React 19** em `apps/web`, porta 3000 (a origem que os backends liberam no CORS), Tailwind 4 por `@tailwindcss/vite`, tokens e `@devwebdex/ui`.
- **Inertia 3 + React** só com AdonisJS: o Inertia precisa de um backend que renderize as páginas, e o adaptador oficial (`@adonisjs/inertia` 5) é do Adonis. As páginas ficam em `apps/api/inertia/`; o kernel não força JSON e o registro tipado das páginas é gerado pelos hooks do Adonis, por isso o `check-types` do `apps/api` depende do build.
- **BullMQ 6 + Redis 8**: a API enfileira e um worker, processo separado, processa (`pnpm dev:worker` em desenvolvimento; `pnpm --filter api worker` a partir do build). Fila de exemplo `mail`; `GET /health` passa a conferir o Redis. Padrão do projeto gerado: `docs/standards/queues-bullmq.md`.
  - Nest: `@nestjs/bullmq` 12; o processador fica num módulo que só o `WorkerModule` importa. Em desenvolvimento o worker compila para `dist-worker`, porque o `deleteOutDir` de dois `nest start --watch` no mesmo `dist` apagaria a saída um do outro.
  - AdonisJS: `bullmq` direto, com o worker como comando `node ace queue:work`. O `@adonisjs/queue` oficial foi descartado: está na 0.x e usa outro motor (`@boringnode/queue`), o que faria o Adonis destoar dos outros backends.
  - Redis só em `127.0.0.1` e sem senha em desenvolvimento, como os bancos. Em produção: senha, TLS e `maxmemory-policy noeviction`.

### D15. Web3 (EVM com viem)

Pedido pelo operador em 2026-10-15: a WEbdEX faz muitos projetos web3, na rede Polygon, com login SIWE e controle de acesso por contrato; os usuários conectam a carteira que quiserem (a mais usada é a MetaMask).

- Biblioteca padrão: **viem**, no backend e no frontend (pelo wagmi). Tipagem a partir da ABI, base do wagmi e SIWE próprio (`viem/siwe`), que também verifica carteiras de contrato. O ethers.js fica só em projeto legado que já o usa.
- Redes: Polygon (137) em produção e Polygon Amoy (80002) em desenvolvimento.
- Carteiras: conector `injected` do wagmi com a descoberta EIP-6963 (qualquer carteira instalada no navegador) e `walletConnect` para carteiras de celular.
- Acesso: login SIWE com nonce de uso único verificado no servidor, e papéis lidos do contrato no backend. O frontend nunca decide acesso. O nonce sai de `node:crypto`: o `generateSiweNonce` do viem usa `Math.random`, que não é criptograficamente seguro (conferido no viem 2.57.7).
- Em duas etapas:
  - **E1 (feita)**: eixo `--web3 none|evm` na TUI e no CLI; a camada `web3-evm` traz o padrão `docs/standards/web3.md` e o subagente `web3` (revisão, sem editar código).
  - **E2 (feita em 2026-10-15)**: login SIWE e acesso por contrato nos quatro backends e carteira nos três frontends, pelo contrato da seção "Login gerado com o projeto" do `web3.md` (rotas `/auth/nonce`, `/auth/verify`, `/auth/me`, `/auth/logout` e o exemplo `/access/admin`). O operador decidiu que o dev escolhe a sessão na TUI (`--session cookie|token`). As duas são revogáveis: o servidor guarda só o SHA-256 do token. Cookie: `HttpOnly`, `SameSite=Lax` e CSRF por `Origin`. Token: `Authorization: Bearer`, guardado só em memória no frontend.
  - A `uri` da mensagem SIWE é aceita só com origem igual a `SIWE_ORIGIN`; comparar o começo do texto aceitaria `https://app.com.evil`.
  - O acesso por papel lê o contrato com `blockTag: 'finalized'` e nega se o RPC falha.
  - Revisão de segurança de 2026-10-15: o corpo de `POST /auth/verify` tem limite (mensagem até 4096 caracteres, assinatura até 16384), porque o `parseSiweMessage` do viem tem custo quadrático no tamanho da mensagem (100 KB levaram cerca de 2 s, medido); o cookie se chama `__Host-session` quando é `Secure`, para um subdomínio não fixar a sessão de outra pessoa; e, com o login, toda rota exige sessão por padrão, com as exceções numa lista explícita (`/health`, `/auth/nonce`, `/auth/verify`), como manda o `security.md`.
  - Sessão JWT (pedido do operador em 2026-10-15), terceira opção ao lado de cookie e token opaco: HS256 com `JWT_SECRET` gerado no `.env`, claims `sub`, `iat`, `exp` (1 hora), `iss` e `aud`, algoritmo fixo na verificação e nada no banco. Não é revogável: o logout só descarta o token no frontend, e ele vale até expirar. Para revogar na hora, cookie ou token opaco; trocar `JWT_SECRET` derruba todas as sessões. A opção "Sem web3" passou a se chamar "Sem biblioteca/framework web3".
  - Uma flag de eixo que não se aplica às outras escolhas (ex.: `--session` sem `--web3 evm`) é recusada pelo CLI, em vez de ir para o manifesto sem efeito.
  - Verificado em 2026-10-15: contra a API rodando, com o cliente real da rede (RPC da Amoy) e uma conta local assinando, o fluxo nonce, verify, `me`, `/access/admin` (403 sem contrato), logout e repetição da assinatura (401) passou no Nest com cookie, no Fastify com token e no Adonis com cookie. No navegador foram conferidos o carregamento, o CORS com credenciais e a recusa de assinatura inválida. Falta conectar uma carteira de verdade no navegador (R8).

### D16. Primitivos acessíveis: Radix

Decidido pelo operador em 2026-10-21, ao criar o dropdown; fecha a antiga A8.

- O `@devwebdex/ui` usa o **Radix** (`radix-ui`, versão fixada) para componentes com comportamento: select, menu, e depois dialog, popover, tooltip e tabs. O Radix cuida de teclado, foco, leitor de tela e posicionamento; o pacote só estiliza, com `cva`, `cn` e as classes ligadas a tokens.
- Motivo da escolha: os outros projetos da WEbdEX (`site` e `admin` do painel) já usam Radix via shadcn/ui (estilo `radix-nova`), com `select`, `dropdown-menu`, `dialog`, `popover`, `tooltip` e `tabs` prontos. Usar a mesma base deixa o time no que já conhece e facilita trazer esses componentes para o pacote compartilhado. O Base UI foi analisado (Select com valor de qualquer tipo e Combobox no mesmo pacote), mas a vantagem não compensou a diferença em relação ao que o time usa.
- Componente com Radix leva `'use client'`, porque os primitivos usam estado e contexto. Os estados vêm dos atributos que o Radix põe no DOM (`data-highlighted`, `data-state`, `data-disabled`, `data-placeholder`), escritos como classes literais.
- Primeiros componentes: `Select` e `Menu`, com os eixos `size` e `radius`, opções e ações com ícone (no Storybook, os símbolos das redes vêm do `@web3icons/react`, só como dependência de desenvolvimento), o halo `attention` para chamar a atenção e a lista compartilhada em `packages/ui/src/lib/list.ts`. Movimento sem `@keyframes` próprio, porque o pacote não envia CSS: a abertura usa `@starting-style` e o halo usa o `animate-pulse` do Tailwind; os dois param com movimento reduzido. O visual é proposta para revisão do design: a referência aprovada ainda não tem campo de seleção nem menu.

## Em aberto

| # | Tema | Pendência |
|---|---|---|
| A3 | Assento Figma | O time de design precisa de assento Dev ou Full em plano Professional ou superior. A conta testada (Starter/View) tem limite de 20 chamadas por mês; a biblioteca inicial estimada consome ~125. Análise: [ui/figma-mcp-limites.md](ui/figma-mcp-limites.md) |
| A4 | Identidade do repositório | O nome `webdex-shared-components` não descreve um gerador |
| A5 | Projeto piloto | Primeiro projeto real que vai usar o gerador e define o escopo mínimo da v1 |
| A6 | Preview de componentes | Ambiente para renderizar e validar visualmente os componentes contra o Figma (ex.: Storybook ou Ladle) |
| A7 | Temas e modos | Modos das Variables do Figma (ex.: dark): o build de tokens gera só um modo |
| A9 | Publicação | Implementada (D12); falta a primeira execução no GitHub, que acontece no merge na `prod`, e a configuração única do repositório descrita em [publicacao.md](publicacao.md) |
| A11 | Dockerfile por app | Adiado até A9 |
| A13 | Microserviços | Única opção ainda "em breve" na TUI; entra como `webdex add service` |
| A14 | Organização no GitHub | `devwebdex` é conta de usuário: colaboradores não administram o repositório nem os pacotes, e não há times ou papéis. Avaliar criar uma organização da WEbdEX ou converter a conta (o GitHub permite converter usuário em organização) |

## Riscos conhecidos

- **R1** OpenTUI ainda é jovem; mudanças de API podem afetar a TUI.
- **R2** São 420 combinações e o CI roda 18. Uma combinação fora da matriz pode quebrar sem ninguém notar, se duas camadas que nunca rodaram juntas escreverem o mesmo arquivo. Mitigação: a matriz cobre cada camada ao menos uma vez e um teste do gerador exige que toda combinação tenha todas as camadas.
- **R3** A convenção de módulos do Express é responsabilidade da WEbdEX.
- **R4** Sem assento Dev ou Full em plano pago do Figma, a importação via MCP fica limitada a 20 chamadas por mês, o que inviabiliza gerar componentes a partir do Figma. O README do servidor MCP no GitHub ainda diz 6 por mês; vale a página oficial de limites. Ver [ui/figma-mcp-limites.md](ui/figma-mcp-limites.md).
- **R5** TypeScript preso em 6.0.x até o typescript-eslint suportar o 7. Se a demora for grande, reavaliar o ESLint mínimo (D3). Candidato observado, não avaliado: o Nest 12 gera projetos com oxlint + `oxlint-tsgolint` (lint com tipos).
- **R6** O OpenTUI bloqueia o processo num pseudo-terminal sem emulador por trás (ex.: `script` sem terminal real), porque espera respostas às consultas de capacidade do terminal. Em terminal real funciona; CI e automações devem usar `--yes`. Validado num pseudo-terminal que responde às consultas: TUI desenha, gera o projeto pelo teclado e encerra em 0,05 s com SIGTERM (código 130).
- **R7** O CI roda o gerador e um projeto gerado (Nest + Prisma + Next) em Windows, mas sem docker nem e2e: os runners Windows do GitHub não rodam containers Linux. Banco, migrações, e2e e a TUI em terminal do Windows não são verificados.
- **R8** Web3:
  - Nenhuma carteira de navegador (MetaMask, WalletConnect) assinou de verdade: os testes usam conta local e o conector `mock`. Teste com MetaMask na Amoy antes do primeiro projeto em produção.
  - `GET /auth/nonce` grava uma linha por chamada e não tem limite de taxa: um projeto exposto precisa de rate limit e de limpeza periódica das tabelas `auth_nonces` e `auth_sessions`.
  - O conector `walletConnect` exige `@walletconnect/ethereum-provider`, que entra no `package.json` de todo projeto web3 e traz uma árvore grande de dependências (com avisos de peer `typescript@^5`). O conector só é ativado com `projectId`.
  - O componente da carteira existe em três cópias (Next, Vite e Inertia). Mudança de lógica precisa ir às três; se divergirem, extrair para um pacote `@devwebdex/*`. Os botões dele são o `Button` do `@devwebdex/ui` desde a 0.2.0 (a pendência A16 saiu).
