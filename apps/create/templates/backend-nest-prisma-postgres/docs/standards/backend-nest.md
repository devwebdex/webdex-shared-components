# Backend: NestJS + Prisma

Complementa [modular-monolith.md](modular-monolith.md) com as convenções do `apps/api`.

## Estrutura

```
apps/api/src/
  main.ts                   # bootstrap: CORS, ValidationPipe global, shutdown hooks
  app.module.ts             # só importa módulos
  modules/<modulo>/
    <modulo>.module.ts
    <modulo>.controller.ts  # HTTP: valida entrada (DTO) e delega
    <modulo>.service.ts     # regras de negócio
    <modulo>.repository.ts  # único lugar que usa o PrismaService para as tabelas do módulo
    dto/                    # classes com decorators do class-validator
  shared/
    config/env.ts           # variáveis de ambiente obrigatórias, lidas uma vez
    database/               # PrismaService (global)
  generated/prisma/         # gerado pelo prisma generate, não editar
```

Arquivos e pastas em kebab-case. Para criar um módulo: `pnpm --filter api exec nest g module modules/<modulo>` (e `controller`, `service`).

## Código

- ESM: imports relativos com `.js` (`import { X } from './x.js'`).
- Classe injetada no construtor é importada com `import`, **nunca** `import type`: o Nest lê o tipo em tempo de execução (`emitDecoratorMetadata`) e o `import type` apaga a classe, quebrando a injeção. Por isso a regra `useImportType` do Biome fica desligada no `apps/api`.
- Toda promessa é aguardada ou tratada; o ESLint (`no-floating-promises`) bloqueia o contrário.
- Controller não tem regra de negócio nem acessa o Prisma.
- Entrada de rota sempre por DTO com `class-validator`. O `ValidationPipe` global descarta e rejeita campos não declarados.
- Erro esperado vira exceção HTTP do Nest (`NotFoundException`, `ConflictException`...). Erro inesperado sobe e vira 500 sem detalhes.
- Variável de ambiente nova: adicione em `shared/config/env.ts` (falha na inicialização se ausente) e no `.env.example`.

## Banco (Prisma 7)

- Schema em `prisma/schema.prisma`; cada model com comentário indicando o módulo dono.
- Mudança de schema: edite o schema e rode `pnpm db:migrate` (gera e aplica a migração). Commite a pasta `prisma/migrations`.
- Produção aplica migrações com `pnpm db:deploy`.
- Consultas pela API do Prisma. SQL só com `` $queryRaw`...` `` parametrizado; `$queryRawUnsafe` é proibido.
- Operações que precisam ser atômicas usam `prisma.$transaction`, sempre dentro de um único módulo.
