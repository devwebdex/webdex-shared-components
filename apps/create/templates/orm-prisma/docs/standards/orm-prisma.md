# Banco: Prisma 7

Como o `apps/api` acessa o banco. Complementa [modular-monolith.md](modular-monolith.md): cada tabela tem um módulo dono.

- Schema em `prisma/schema.prisma`; cada model com comentário indicando o módulo dono.
- O cliente é gerado em `src/generated/prisma` pelo `prisma generate` (roda sozinho no `dev`, `build` e `check-types`). Não edite nem commite essa pasta.
- Mudança de schema: edite o schema e rode `pnpm db:migrate` (gera e aplica a migração). Commite a pasta `prisma/migrations`.
- Produção e CI aplicam migrações com `pnpm db:deploy`.
- Consultas pela API do Prisma, só no repository do módulo dono da tabela. SQL só com `` $queryRaw`...` `` parametrizado; `$queryRawUnsafe` é proibido.
- Operações que precisam ser atômicas usam `prisma.$transaction`, sempre dentro de um único módulo.
- A conexão usa o driver adapter do banco escolhido (`src/shared/database/prisma-adapter.ts`).
