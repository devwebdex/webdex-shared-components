# Banco: MongoDB com Mongoose

Como o `apps/api` acessa o MongoDB. Complementa [modular-monolith.md](modular-monolith.md): cada coleção tem um módulo dono.

- Cada módulo declara as próprias coleções em `src/modules/<modulo>/<modulo>.schema.ts` (schema e model). O arquivo do schema **é** a marca de posse: coleção declarada no schema de um módulo só é usada pelo repository desse módulo.
- A conexão vem de `src/shared/database/` (no Nest, pelo `MongooseModule`; no Express e no Fastify, por `connectDatabase()`). Models são criados a partir dessa conexão, nunca da conexão global do `mongoose`.
- Não há migrações: o schema do Mongoose valida os documentos na aplicação. Mudança que exige transformar documentos existentes vira um script versionado em `src/modules/<modulo>/scripts/`, revisado como código.
- Consultas pela API do Mongoose, só no repository do módulo dono da coleção. Nunca monte filtro de consulta direto a partir do corpo da requisição: valide a entrada antes, para evitar injeção de operadores (`{ "$gt": "" }`).
- Índices declarados no schema (`index: true`, `unique: true`).
