import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema.js'

export function createDatabase(databaseUrl: string) {
  const pool = mysql.createPool({ uri: databaseUrl })
  return { db: drizzle({ client: pool, schema, mode: 'default' }), close: () => pool.end() }
}

export type Database = ReturnType<typeof createDatabase>['db']
