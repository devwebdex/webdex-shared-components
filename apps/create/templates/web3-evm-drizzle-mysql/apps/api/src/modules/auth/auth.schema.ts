import { char, datetime, mysqlTable } from 'drizzle-orm/mysql-core'

// Nonces do login SIWE: uso único, 5 minutos.
export const authNonces = mysqlTable('auth_nonces', {
  nonce: char('nonce', { length: 32 }).primaryKey(),
  expiresAt: datetime('expires_at', { fsp: 3 }).notNull(),
})

// Sessões: id é o SHA-256 do token, que nunca é guardado.
export const authSessions = mysqlTable('auth_sessions', {
  id: char('id', { length: 64 }).primaryKey(),
  address: char('address', { length: 42 }).notNull(),
  expiresAt: datetime('expires_at', { fsp: 3 }).notNull(),
  // Preenchido pela aplicação, em UTC como as outras datas: o now() do MySQL segue o fuso da sessão.
  createdAt: datetime('created_at', { fsp: 3 })
    .notNull()
    .$defaultFn(() => new Date()),
})
