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
- Cada migração regenera `database/schema.ts`, com uma classe por tabela (ex.: `UserSchema` para `users`). O model do módulo estende essa classe (`class User extends UserSchema`). O arquivo é gerado: não edite e commite junto com a migração. Ele fica fora do Biome, do ESLint e da lista inicial do `tsc`, porque, sem tabelas, sai com um import sem uso; quando um model o importa, o TypeScript o confere normalmente.

## Pacotes oficiais do Adonis

O projeto nasce do kit `api` oficial reduzido: sem autenticação, sessão, Shield (CSRF e cabeçalhos de segurança) e mail. Para acrescentar um deles, use o comando oficial, que instala o pacote, registra provider e middleware e cria a config e as variáveis de ambiente:

```bash
pnpm --filter api exec node ace add @adonisjs/session
pnpm --filter api exec node ace add @adonisjs/shield      # exige o @adonisjs/session
pnpm format                                               # os arquivos criados pelo add não seguem o Biome
```

Autenticação pede três ajustes depois do `add`, porque o comando segue a estrutura padrão do Adonis e não a de módulos:

```bash
pnpm --filter api exec node ace add @adonisjs/auth --guard=access_tokens   # API; para app web: --guard=session (exige o @adonisjs/session)
```

1. Mova `app/models/user.ts` para `app/modules/users/models/user.ts` e, em `config/auth.ts`, troque `#models/user` por `#modules/users/models/user`.
2. Rode `pnpm db:migrate`: a migração de `users` gera o `UserSchema` que o model estende.
3. Rode `pnpm format` e confira `pnpm check-types`, `pnpm lint` e `pnpm test`.

Revise o diff antes de commitar (`adonisrc.ts`, `start/kernel.ts`, `start/env.ts`, `.env.example`) e peça a revisão do subagente `security`: autenticação e sessão são código de segurança.
