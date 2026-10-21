# AGENTS.md

Projeto `{{name}}`, gerado pelo `@devwebdex/create`. As escolhas feitas na geração estão em `.webdex/manifest.json`.

## Comandos (raiz)

- `pnpm install`
- `pnpm dev`: sobe as apps em modo desenvolvimento
- `pnpm build`, `pnpm check-types`, `pnpm lint`, `pnpm format`
- `pnpm agents:sync`: regenera os subagentes a partir de `ai/agents/`

## Regras gerais

- Lint e formatação: Biome (`@devwebdex/biome-config`). Não adicione Prettier nem outras configs de lint.
- TypeScript 6.0.x: o typescript-eslint ainda não suporta o 7.
- Segredos só em `.env`, que nunca é commitado. Variável nova vai documentada no `.env.example`.
- Antes de mudar código numa área, leia o padrão dela em `docs/standards/`.
- Não edite `.claude/agents`, `.opencode/agents` nem `.codex/agents` à mão: edite `ai/agents/` e rode `pnpm agents:sync`.
- Mudança de padrão (estrutura, lint, tokens) é feita nos pacotes `@devwebdex/*`, não localmente.

## Segurança

- Padrão: [docs/standards/security.md](docs/standards/security.md)
- Subagente `security`: revisão de segurança, sem editar código.
