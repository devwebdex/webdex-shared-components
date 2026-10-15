import { sql } from 'drizzle-orm'
import { createDatabase } from './drizzle-client.js'

export function connectDatabase(databaseUrl: string) {
  const { db, close } = createDatabase(databaseUrl)
  return {
    db,
    async ping() {
      await db.execute(sql`select 1`)
    },
    close,
  }
}

export type DatabaseConnection = ReturnType<typeof connectDatabase>
