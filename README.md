# webdex-shared-components
Este repositório contém os componentes padronizados e compartilháveis entre projetos.

## Documentação

- [Gerador de projetos WEbdEX](docs/gerador-de-projetos.md): como a base de um novo projeto será criada, decisões fechadas, pendências e riscos.
- [Do Figma para tokens e componentes](docs/ui/figma-para-componentes.md): passo a passo do time de design com o subagente `design-to-code`.
- [AGENTS.md](AGENTS.md): comandos, estrutura e regras do repositório (lido pelas ferramentas de IA).

## Início rápido

Requisitos: Node ≥ 22 e pnpm 10.

```bash
pnpm install
pnpm build
pnpm lint
```

Para instalar pacotes `@devwebdex/*` publicados, configure no seu `~/.npmrc` um token do GitHub com permissão `read:packages`:

```
//npm.pkg.github.com/:_authToken=<seu-token>
```
