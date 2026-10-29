# @devwebdex/create

## 0.1.1

### Patch Changes

- 43d175b: Projetos com MongoDB passam a usar a imagem `mongo:8.2` em vez de `mongo:8`. A `mongo:8` agora traz a 8.3, que recusa iniciar em Linux com kernel 6.19 ou mais novo (SERVER-121912), como o dos runners do GitHub Actions e de distribuições recentes. Projetos já gerados: troque `image: mongo:8` por `image: mongo:8.2` no `docker-compose.yml`.
- f085c7b: Templates de frontend com os tokens da 0.2.0: as classes de `color.primary`, `color.surface`, `radius.md` e `spacing.md`, que deixaram de existir, viram `bg-background`, `text-text-primary`, `rounded-2`, `gap-4`/`p-4`, `border-line-default` e `outline-brand`. O componente da carteira (web3) passa a usar o `Button` do `@devwebdex/ui` em vez de botões locais.
