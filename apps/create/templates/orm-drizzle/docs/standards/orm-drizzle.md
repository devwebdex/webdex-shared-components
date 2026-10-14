# Banco: Drizzle ORM

Como o `apps/api` acessa o banco. Complementa [modular-monolith.md](modular-monolith.md): cada tabela tem um módulo dono.

- Cada módulo declara as próprias tabelas em `src/modules/<modulo>/<modulo>.schema.ts`. O arquivo do schema **é** a marca de posse: tabela declarada no schema de um módulo só é usada pelo repository desse módulo.
- Todo `<modulo>.schema.ts` é reexportado em `src/shared/database/schema.ts` (`export * from '../../modules/<modulo>/<modulo>.schema.js'`). Esse índice é o que o `drizzle-kit` e o cliente leem; schema fora dele não gera migração.
- O cliente (`db`) vem de `src/shared/database/drizzle-client.ts`; o tipo `Database` serve para tipar os repositories.
- Mudança de schema: edite o `<modulo>.schema.ts` e rode `pnpm db:migrate` (gera a migração SQL em `drizzle/` e aplica). Commite a pasta `drizzle/`.
- Produção e CI aplicam migrações com `pnpm db:deploy`.
- Consultas pela API do Drizzle, só no repository do módulo dono da tabela. SQL só com a tag `` sql`...` `` (parametrizada); concatenar valor em SQL é proibido.
- Operações atômicas usam `db.transaction(...)`, sempre dentro de um único módulo.
