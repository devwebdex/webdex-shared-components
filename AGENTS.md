# AGENTS.md

Monorepo da WEbdEX com o gerador de projetos (`apps/create`) e os pacotes de padrão (`@devwebdex/*`). Decisões, funcionamento do gerador e pendências: [docs/gerador-de-projetos.md](docs/gerador-de-projetos.md).

## Comandos (raiz)

- `pnpm install`
- `pnpm build`: build de todos os pacotes (Turborepo)
- `pnpm check-types`
- `pnpm lint`: Biome no repositório inteiro + lint dos pacotes
- `pnpm test`: testes do gerador (`bun test`)
- `pnpm format`: aplica formatação e correções seguras do Biome
- `pnpm agents:sync`: regenera os subagentes a partir de `ai/agents/`
- `pnpm changeset`: registra a mudança de um pacote para o próximo release
- `bun apps/create/src/cli.ts <dir> --yes --link-packages .`: gera um projeto usando os pacotes deste checkout

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `apps/create` | gerador: núcleo (`src/core`), TUI (`src/tui`), CLI e camadas de template (`templates/`) |
| `packages/tsconfig` | tsconfigs base (`base`, `node`, `react-library`) |
| `packages/biome-config` | config Biome compartilhada (lint e formatação) |
| `packages/eslint-config` | ESLint mínimo para backends (promessas com informação de tipo) |
| `packages/tokens` | design tokens DTCG → `dist/theme.css` (`@theme` do Tailwind 4) |
| `packages/ui` | componentes React |
| `ai/agents` | fonte única dos subagentes de IA |
| `docs` | documentação e decisões |

## Regras

- TypeScript fixado em 6.0.x: o typescript-eslint ainda não suporta o 7.
- Pacotes ESM com `module: NodeNext`: imports relativos com extensão `.js`.
- Não edite `.claude/agents`, `.opencode/agents` nem `.codex/agents` à mão: edite `ai/agents/` e rode `pnpm agents:sync`.
- Decisão nova ou mudança relevante: atualize `docs/gerador-de-projetos.md`.
- Mudou um template? Gere um projeto com `--yes --link-packages .` e rode `pnpm build`, `pnpm check-types` e `pnpm lint` nele: os templates não passam pelo Biome deste repositório.
- Mudança em pacote publicável (`packages/*`, `apps/create`) exige um changeset no mesmo PR: `pnpm changeset`. Não edite versões nem CHANGELOGs à mão; o PR de release faz isso (ver `docs/publicacao.md`).
- As faixas `@devwebdex/*` nos templates são atualizadas pelo `pnpm version-packages`; um teste falha se divergirem.

## Subagentes

- `design-to-code`: Figma → tokens e componentes. Segue [docs/ui/figma-para-componentes.md](docs/ui/figma-para-componentes.md).

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
