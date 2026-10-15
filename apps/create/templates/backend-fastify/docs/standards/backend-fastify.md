# Backend: Fastify

Complementa [modular-monolith.md](modular-monolith.md) com as convenções do `apps/api` em Fastify 5. É a mesma convenção de módulos do Express na WEbdEX, com cada módulo virando um plugin. O acesso ao banco segue o padrão do ORM em `docs/standards/orm-*.md`.

## Estrutura

```
apps/api/src/
  main.ts                    # lê o ambiente, conecta o banco, sobe o servidor e encerra com SIGTERM
  app.ts                     # composição: registra o plugin de cada módulo com prefixo (createApp)
  modules/<modulo>/
    index.ts                 # API pública do módulo: a factory create<Modulo>Module(deps)
    <modulo>.routes.ts       # plugin com as rotas: valida entrada e delega ao service
    <modulo>.service.ts      # regras de negócio
    <modulo>.repository.ts   # único lugar que acessa o banco para as tabelas do módulo
    <modulo>.schemas.ts      # schemas zod da entrada das rotas
  shared/
    config/env.ts            # variáveis de ambiente, lidas uma vez (obrigatórias ou com padrão)
    database/database.ts     # connectDatabase(): cliente do ORM, ping() e close()
    http/                    # HttpError, parseInput (zod) e handlers de 404 e erro
```

Arquivos e pastas em kebab-case.

## Módulos

- **API pública = `index.ts`.** Outro módulo (ou o `app.ts`) importa só de `modules/<modulo>/index.js`. Importar `routes`, `service` ou `repository` de outro módulo é violação de fronteira.
- **Dependências por parâmetro**: a factory recebe o que precisa (`{ database }`, serviços públicos de outros módulos) e devolve `{ routes }` (um `FastifyPluginAsync`) e, se for o caso, o service público.
- **Composição só no `app.ts`**: `await app.register(modulo.routes, { prefix: '/<modulo>' })`.

## Código

- ESM: imports relativos com `.js`.
- Handlers `async` retornam o corpo da resposta; erro lançado vai para o handler central.
- Entrada de rota sempre por `parseInput(schema, request.body)` (zod). Campo não declarado no schema é descartado.
- Erro esperado: `throw new HttpError(status, mensagem)`. Erro inesperado é registrado no log e vira 500 sem detalhes.
- Testes usam `app.inject()`, sem subir servidor.
- Variável de ambiente nova: adicione em `shared/config/env.ts` e no `.env.example`.
