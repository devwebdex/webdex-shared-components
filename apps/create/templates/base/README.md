# {{name}}

Projeto gerado pelo `@devwebdex/create` (WEbdEX).

## Requisitos

- Node ≥ 22 e pnpm 10
- Token do GitHub com `read:packages` no seu `~/.npmrc`, para instalar os pacotes `@devwebdex/*`:
  ```
  //npm.pkg.github.com/:_authToken=<seu-token>
  ```

## Começando

```bash
pnpm install
pnpm env:setup   # cria os .env a partir dos .env.example (o gerador já fez isso na criação)
```

## Qualidade

```bash
pnpm lint          # Biome (e ESLint de promessas no backend)
pnpm check-types
pnpm test          # testes unitários, sem banco
```

O CI (`.github/workflows/ci.yml`) roda esses comandos em todo PR e, se houver backend, também o banco e os testes e2e. Para instalar os pacotes `@devwebdex/*`, o repositório precisa de acesso de leitura a eles no GitHub Packages.

Atualizações de dependências chegam por PR do Renovate (`.github/renovate.json`). Instale o app do Renovate no repositório e cadastre o segredo `DEVWEBDEX_PACKAGES_TOKEN` (ver [docs/standards/security.md](docs/standards/security.md#dependências)).

Comandos, estrutura e regras do projeto: [AGENTS.md](AGENTS.md). Padrões de cada área: [docs/standards](docs/standards).
