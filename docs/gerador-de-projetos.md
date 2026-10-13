# Gerador de projetos WEbdEX

Status: **v1 funcional, ainda não publicada**. O gerador (`apps/create`) tem TUI, modo não interativo, trava de reexecução e o template Nest + Prisma + PostgreSQL + Next, validado de ponta a ponta. Os pacotes `@devwebdex/*` ainda não foram publicados (A9), então hoje o gerador só roda a partir deste repositório. Este documento registra as decisões fechadas e o que ainda está em aberto. Atualize-o a cada decisão nova.

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

**D1.a** Pacotes privados no GitHub Packages, scope `@devwebdex` (o GitHub Packages exige scope igual ao nome da organização). Cada dev e cada CI precisa de um `.npmrc` com token de leitura.

**D1.b** Atualizações chegam aos projetos por PR automático do Renovate. Cada projeto decide quando aceitar.

### D2. Estrutura e stacks

Sempre presente, sem pergunta:

- Monorepo com pnpm workspaces + Turborepo, mesmo em projeto de uma app só.
- `docker-compose.yml` com o banco para desenvolvimento local.
- `Dockerfile` por app: **adiado** (A11). O build da imagem precisa baixar os pacotes `@devwebdex/*` do registry, o que só é testável depois da publicação (A9).

Perguntado pela TUI:

| Eixo | Opções |
|---|---|
| Backend | nenhum, Adonis, Nest, Express |
| ORM | Adonis: Lucid (fixo). Nest/Express: Prisma ou Drizzle |
| Banco | Postgres, MySQL |
| Frontend | nenhum, Next |
| Arquitetura | monólito modular (única opção na v1) |

- Adonis não oferece Prisma/Drizzle porque auth, factories e validação do Adonis assumem Lucid.
- Express permanece porque projetos novos ainda nascem nele. Como o Express não traz convenção de módulos, a WEbdEX define e mantém a própria (ver D8, `standards/backend/express.md`).
- Microserviços ficam fora da v1. Entram depois como comando `webdex add service`.
- São cerca de 21 combinações válidas. Cada uma precisa de um job de CI que gera, instala, faz build e roda lint.

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
- **Modo não interativo** com o mesmo núcleo, por exemplo `webdex create --backend nest --orm drizzle --db postgres --frontend next --yes`. Necessário para o CI das combinações, para agentes de IA e para terminais sem suporte a mouse.

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
  - `modular-monolith.md` e `backend-nest.md` (camada de backend)
  - `frontend-next.md` (camada de frontend)
- Os agentes ficam no mesmo esquema (`<camada>/ai/agents/`), e o gerador roda o `scripts/sync-agents.mjs` no projeto para produzir as versões de cada ferramenta. O mesmo script é usado por este monorepo (`pnpm agents:sync`).
- Os agentes apontam para esses `.md` em vez de repetir o conteúdo, e a mesma documentação serve humanos e LLMs.
- Os docs são copiados, não instalados como pacote, porque ferramentas de IA costumam ignorar `node_modules`. Por isso o Renovate não os atualiza; um `webdex sync` fica para a v2.

### D7. Componentes e tokens: responsabilidade do time de design

- O time de design cria tokens e componentes com o subagente `design-to-code`, seguindo [ui/figma-para-componentes.md](ui/figma-para-componentes.md). O time de dev mantém a fundação (pacotes, build, convenções).
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
| `src/core/generate.ts` | Escolhe e aplica as camadas, cria os `.env`, gera os agentes e grava o manifesto |
| `src/tui/app.tsx` | TUI (OpenTUI + React), camada fina sobre o núcleo |
| `src/cli.ts` | Flags, modo não interativo, chamada da TUI e `pnpm install` |
| `templates/<camada>/` | Arquivos do projeto gerado |

Camadas aplicadas em ordem: `base`, depois `db-<banco>` e `backend-<backend>-<orm>-<banco>` (se houver backend), depois `frontend-<frontend>` (se houver frontend). Para adicionar uma stack (ex.: MySQL, Adonis), crie a camada e marque a opção como `available` no catálogo.

Convenções de nome dentro das camadas:

- `{{name}}` é substituído pelo nome do projeto.
- Arquivo ou pasta iniciado por `_` vira `.` (`_gitignore` → `.gitignore`), porque o npm descarta dotfiles ao publicar.
- Sufixo `.append`: acrescenta o conteúdo ao arquivo de mesmo nome escrito por camadas anteriores (`AGENTS.md.append`, `pnpm-workspace.yaml.append`).
- Sufixo `.merge`: mescla JSON no arquivo de mesmo nome (`package.json.merge`).

Outros comportamentos:

- Cada `.env.example` gerado é copiado para `.env` com valores de desenvolvimento local, para o projeto já nascer rodando.
- `--link-packages <dir>` aponta os `@devwebdex/*` para um checkout deste monorepo via `file:` (não `link:`: o Turbopack recusa arquivos fora da raiz do projeto).
- Testes (`pnpm test`): núcleo (validação, camadas, trava, geração das três combinações, ausência de placeholder, versões dos `@devwebdex/*` nos templates) e TUI (fluxo pelo mouse, opção indisponível, pulo de etapas, teclado).

### D11. Template Nest + Prisma + PostgreSQL + Next

Primeiro template, escolhido pelo operador. Versões e decisões verificadas em 2026-10-13:

- **NestJS 12.1.3**: só ESM. Projeto com `"type": "module"`, `module: nodenext` e imports relativos com `.js`.
- **Prisma 7.10.0**: gerador `prisma-client` com saída em `src/generated/prisma` (ignorada no git, gerada no `build`/`dev`/`check-types`), `prisma.config.ts` e adapter `@prisma/adapter-pg`. O dist-tag `latest` do CLI `prisma` aponta para `8.0.0-rc`; foi ignorado por ser release candidate. O pnpm 10 precisa liberar os scripts de build de `prisma` e `@prisma/engines` (`onlyBuiltDependencies`).
- **Next 16.4.0**: Tailwind 4 pelo loader `@tailwindcss/turbopack`, tokens por `@import "@devwebdex/tokens/theme.css"`; Biome com os domínios `next` e `react`.
- Validação de entrada com `class-validator` e `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`).
- Variáveis de ambiente obrigatórias validadas na inicialização (`src/shared/config/env.ts`). Um `.env` por app; o da raiz serve ao docker-compose.
- A regra `useImportType` do Biome fica **desligada no `apps/api`**: ela troca imports de classes injetadas por `import type`, o que apaga a classe e quebra a injeção de dependência do Nest.
- Módulo de exemplo `health` (`GET /health` consulta o banco), seguindo controller → service.

Validado: build, check-types e lint das três combinações (fullstack, só frontend, só backend); no fullstack, Postgres pelo docker-compose, `db:migrate` e `GET /health` (200 com banco no ar, 500 sem detalhes com banco fora).

## Em aberto

| # | Tema | Pendência |
|---|---|---|
| A3 | Assento Figma | O time de design precisa de assento Dev ou Full em plano Professional ou superior. A conta testada (Starter/View) tem limite de 20 chamadas por mês; a biblioteca inicial estimada consome ~125. Análise: [ui/figma-mcp-limites.md](ui/figma-mcp-limites.md) |
| A4 | Identidade do repositório | O nome `webdex-shared-components` não descreve um gerador |
| A5 | Projeto piloto | Primeiro projeto real que vai usar o gerador e define o escopo mínimo da v1 |
| A6 | Preview de componentes | Ambiente para renderizar e validar visualmente os componentes contra o Figma (ex.: Storybook ou Ladle) |
| A7 | Temas e modos | Modos das Variables do Figma (ex.: dark): o build de tokens gera só um modo |
| A8 | Primitivos acessíveis | Biblioteca para dialog, menu, select, popover, tooltip e tabs (ex.: Radix ou Base UI). Até decidir, esses componentes não são implementados |
| A9 | Publicação | Versionamento (ex.: changesets) e workflow de publicação no GitHub Packages. Bloqueia o uso via `bunx` e os Dockerfiles |
| A10 | Testes nos projetos gerados | Ferramenta e estrutura de testes do template (o Nest 12 usa vitest por padrão) |
| A11 | Dockerfile por app | Adiado até A9 |
| A12 | CI | Workflow deste repositório (lint, tipos, testes, matriz de combinações com `--yes --link-packages`) e workflow do projeto gerado |
| A13 | Stacks restantes | Adonis, Express, Drizzle, MySQL e microserviços aparecem na TUI como "(em breve)" |

## Riscos conhecidos

- **R1** OpenTUI ainda é jovem; mudanças de API podem afetar a TUI.
- **R2** Cerca de 21 combinações de stack. Sem matriz de CI, as combinações pouco usadas quebram sem ninguém notar.
- **R3** A convenção de módulos do Express é responsabilidade da WEbdEX.
- **R4** Sem assento Dev ou Full em plano pago do Figma, a importação via MCP fica limitada a 20 chamadas por mês, o que inviabiliza gerar componentes a partir do Figma. O README do servidor MCP no GitHub ainda diz 6 por mês; vale a página oficial de limites. Ver [ui/figma-mcp-limites.md](ui/figma-mcp-limites.md).
- **R5** TypeScript preso em 6.0.x até o typescript-eslint suportar o 7. Se a demora for grande, reavaliar o ESLint mínimo (D3). Candidato observado, não avaliado: o Nest 12 gera projetos com oxlint + `oxlint-tsgolint` (lint com tipos).
- **R6** O OpenTUI bloqueia o processo num pseudo-terminal sem emulador por trás (ex.: `script` sem terminal real), porque espera respostas às consultas de capacidade do terminal. Em terminal real funciona; CI e automações devem usar `--yes`. Validado num pseudo-terminal que responde às consultas: TUI desenha, gera o projeto pelo teclado e encerra em 0,05 s com SIGTERM (código 130).
