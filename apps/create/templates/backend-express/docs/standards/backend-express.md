# Backend: Express

Complementa [modular-monolith.md](modular-monolith.md) com as convenções do `apps/api` em Express 5. O Express não traz estrutura de módulos; esta é a convenção da WEbdEX. O acesso ao banco segue o padrão do ORM em `docs/standards/orm-*.md`.

## Estrutura

```
apps/api/src/
  main.ts                    # lê o ambiente, conecta o banco, sobe o servidor e encerra com SIGTERM
  app.ts                     # composição: monta cada módulo com as dependências dele (createApp)
  modules/<modulo>/
    index.ts                 # API pública do módulo: a factory create<Modulo>Module(deps)
    <modulo>.routes.ts       # HTTP: valida entrada e delega ao service
    <modulo>.service.ts      # regras de negócio
    <modulo>.repository.ts   # único lugar que acessa o banco para as tabelas do módulo
    <modulo>.schemas.ts      # schemas zod da entrada das rotas
  shared/
    config/env.ts            # variáveis de ambiente obrigatórias, lidas uma vez
    database/database.ts     # connectDatabase(): cliente do ORM, ping() e close()
    http/                    # HttpError, parseInput (zod) e handlers de 404 e erro
```

Arquivos e pastas em kebab-case.

## Módulos

- **API pública = `index.ts`.** Outro módulo (ou o `app.ts`) importa só de `modules/<modulo>/index.js`. Importar `routes`, `service` ou `repository` de outro módulo é violação de fronteira.
- **Dependências por parâmetro**, sem container de DI: a factory recebe o que precisa (`{ database }`, serviços públicos de outros módulos) e devolve `{ router }` e, se for o caso, o service público.
- **Composição só no `app.ts`**: ele cria os módulos na ordem certa e registra os routers (`app.use('/<modulo>', modulo.router)`).

## Código

- ESM: imports relativos com `.js` (`import { x } from './x.js'`).
- Express 5 repassa erro de handler `async` para o handler de erros: não use `try/catch` só para chamar `next(error)`.
- Entrada de rota sempre por `parseInput(schema, req.body)` (zod). Campo não declarado no schema é descartado.
- Erro esperado: `throw new HttpError(status, mensagem)`. Erro inesperado sobe e vira 500 sem detalhes.
- Toda promessa é aguardada ou tratada; o ESLint (`no-floating-promises`, `no-misused-promises`) bloqueia o contrário.
- Variável de ambiente nova: adicione em `shared/config/env.ts` (falha na inicialização se ausente) e no `.env.example`.
