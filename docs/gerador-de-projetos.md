# Gerador de projetos WEbdEX

Status: **em definição**. Nenhum código foi escrito ainda. Este documento registra as decisões fechadas e o que ainda está em aberto. Atualize-o a cada decisão nova.

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
- `Dockerfile` por app.

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
- `webdex create` recusa executar se o diretório de destino já tiver esse manifesto ou não estiver vazio. Arquivos de `.git`, `README` e `LICENSE` são tolerados.
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
- **Documentação de arquitetura** fica neste repositório em `standards/` e é copiada para `docs/standards/` do projeto gerado, só a da stack escolhida:
  - `architecture/modular-monolith.md`
  - `backend/{adonis,nest,express}.md`
  - `frontend/next.md`
  - `security.md`
- Os agentes apontam para esses `.md` em vez de repetir o conteúdo, e a mesma documentação serve humanos e LLMs.
- Os docs são copiados, não instalados como pacote, porque ferramentas de IA costumam ignorar `node_modules`. Por isso o Renovate não os atualiza; um `webdex sync` fica para a v2.

## Em aberto

| # | Tema | Pendência |
|---|---|---|
| A1 | Distribuição da TUI | `bunx @devwebdex/create` (exige Bun instalado) ou binário compilado por SO |
| A2 | Componentes de UI | Pacote npm `@devwebdex/ui` ou registry no estilo shadcn (cópia para o projeto) |
| A3 | Pipeline Figma | Link do Figma pendente; definir o que é automatizado (tokens) e o que é assistido (componentes). MCP oficial do Figma instalado (plugin `figma@claude-plugins-official`), mas a conta conectada é Starter/View: limite de 6 chamadas por mês. O pipeline exige assento Dev ou Full em plano Professional, Organization ou Enterprise |
| A4 | Identidade do repositório | O nome `webdex-shared-components` não descreve um gerador |
| A5 | Projeto piloto | Primeiro projeto real que vai usar o gerador e define o escopo mínimo da v1 |

## Riscos conhecidos

- **R1** OpenTUI ainda é jovem; mudanças de API podem afetar a TUI.
- **R2** Cerca de 21 combinações de stack. Sem matriz de CI, as combinações pouco usadas quebram sem ninguém notar.
- **R3** A convenção de módulos do Express é responsabilidade da WEbdEX.
- **R4** Sem assento Dev ou Full em plano pago do Figma, a importação via MCP fica limitada a 6 chamadas por mês, o que inviabiliza gerar componentes a partir do Figma.
