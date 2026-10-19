import { PrismaPg } from '@prisma/adapter-pg'

export function createPrismaAdapter(databaseUrl: string) {
  return new PrismaPg({ connectionString: databaseUrl })
}
