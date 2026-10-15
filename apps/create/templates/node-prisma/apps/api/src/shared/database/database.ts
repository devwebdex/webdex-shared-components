import { PrismaClient } from '../../generated/prisma/client.js'
import { createPrismaAdapter } from './prisma-adapter.js'

export function connectDatabase(databaseUrl: string) {
  const prisma = new PrismaClient({ adapter: createPrismaAdapter(databaseUrl) })
  return {
    prisma,
    async ping() {
      await prisma.$queryRaw`SELECT 1`
    },
    close: () => prisma.$disconnect(),
  }
}

export type DatabaseConnection = ReturnType<typeof connectDatabase>
