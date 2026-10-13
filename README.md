# webdex-shared-components
Este repositório contém o gerador de projetos da WEbdEX e os componentes e configurações padronizados compartilhados entre projetos.

## Documentação

- [Gerador de projetos WEbdEX](docs/gerador-de-projetos.md): como criar a base de um novo projeto, como o gerador funciona, decisões fechadas, pendências e riscos.
- [Do Figma para tokens e componentes](docs/ui/figma-para-componentes.md): passo a passo do time de design com o subagente `design-to-code`.
- [Limites de chamadas do MCP do Figma](docs/ui/figma-mcp-limites.md): limites por plano e assento, consumo estimado do fluxo e qual assento comprar.
- [AGENTS.md](AGENTS.md): comandos, estrutura e regras do repositório (lido pelas ferramentas de IA).

## Início rápido

Requisitos: Node ≥ 22, pnpm 10 e Bun ≥ 1.3 (o gerador roda no Bun). Docker para o banco local dos projetos com backend.

```bash
pnpm install
pnpm build
pnpm lint && pnpm test
```

## Criar um projeto

Enquanto os pacotes `@devwebdex/*` não estão publicados, o gerador roda a partir deste repositório:

```bash
bun apps/create/src/cli.ts ../meu-projeto                            # interface interativa (mouse e teclado)
bun apps/create/src/cli.ts ../meu-projeto --yes --link-packages .    # não interativo, com os padrões
```

Detalhes e flags: [docs/gerador-de-projetos.md](docs/gerador-de-projetos.md#como-usar-hoje-a-partir-deste-repositório).

Para instalar pacotes `@devwebdex/*` publicados, configure no seu `~/.npmrc` um token do GitHub com permissão `read:packages`:

```
//npm.pkg.github.com/:_authToken=<seu-token>
```
