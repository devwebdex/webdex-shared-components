# Backend: AdonisJS + Lucid

Complementa [modular-monolith.md](modular-monolith.md) com as convenções do `apps/api` em AdonisJS 7. O banco é acessado pelo Lucid, o ORM nativo do Adonis.

## Estrutura

```
apps/api/
  app/
    modules/<modulo>/
      <modulo>_controller.ts   # HTTP: valida entrada (VineJS) e delega
      <modulo>_service.ts      # regras de negócio; API pública do módulo
      <modulo>_repository.ts   # único lugar que acessa o banco para as tabelas do módulo
      models/                  # models Lucid do módulo
      validators.ts            # validadores VineJS da entrada
    exceptions/handler.ts      # converte exceções em resposta HTTP
    middleware/
  config/                      # configuração do framework (database, cors, logger...)
  database/migrations/         # migrações Lucid
  start/
    env.ts                     # variáveis de ambiente validadas na inicialização
    routes.ts                  # rotas de todos os módulos, agrupadas por prefixo
    kernel.ts                  # middleware
  tests/{unit,functional}/     # testes Japa
```

Arquivos em snake_case, como no Adonis. Imports internos pelos aliases do `package.json` (`#modules/<modulo>/<arquivo>`).

## Módulos

- **API pública = o service do módulo.** Outro módulo injeta `<Modulo>Service`; importar controller, repository ou model de outro módulo é violação de fronteira.
- Dependências pelo container do Adonis (`@inject()` no construtor). Classe injetada é importada com `import`, **nunca** `import type`: o container lê o tipo em tempo de execução. Por isso a regra `useImportType` do Biome fica desligada no `apps/api`.
- Rotas registradas em `start/routes.ts`, com o controller importado sob demanda (`() => import('#modules/<modulo>/<modulo>_controller')`).

## Código

- Entrada de rota sempre por validador VineJS (`request.validateUsing(validator)`); campos não declarados são descartados.
- Erro esperado: exceções do Adonis com status (ex.: `E_ROW_NOT_FOUND` vira 404). Em produção (`NODE_ENV=production`) a resposta de erro não traz stack; em desenvolvimento o Adonis mostra detalhes para depuração.
- Variável de ambiente nova: adicione em `start/env.ts` (validada na inicialização) e no `.env.example`.
- Toda promessa é aguardada ou tratada; o ESLint (`no-floating-promises`) bloqueia o contrário.

## Banco (Lucid)

- Migração nova: `pnpm --filter api exec node ace make:migration <nome>`; aplique com `pnpm db:migrate`. Indique o módulo dono num comentário no topo da migração e no model.
- Produção e CI aplicam migrações com `pnpm db:deploy`.
- Consultas pelo query builder ou pelos models do Lucid, só no repository do módulo dono da tabela. SQL só com `db.rawQuery('... ?', [valor])` (parametrizado); concatenar valor em SQL é proibido.
- Operações atômicas usam `db.transaction(...)`, sempre dentro de um único módulo.
