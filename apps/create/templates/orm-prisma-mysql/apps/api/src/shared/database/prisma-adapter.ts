import { PrismaMariaDb } from '@prisma/adapter-mariadb'

// O driver mariadb funciona com MySQL. allowPublicKeyRetrieval é exigido pela autenticação padrão do
// MySQL 8 (caching_sha2_password) sem TLS; em produção, use TLS e remova a opção.
export function createPrismaAdapter(databaseUrl: string) {
  const url = new URL(databaseUrl)
  return new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    allowPublicKeyRetrieval: true,
  })
}
