import { char, pgTable, timestamp } from 'drizzle-orm/pg-core'

// Nonces do login SIWE: uso único, 5 minutos.
export const authNonces = pgTable('auth_nonces', {
  nonce: char('nonce', { length: 32 }).primaryKey(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
})

// Sessões: id é o SHA-256 do token, que nunca é guardado.
export const authSessions = pgTable('auth_sessions', {
  id: char('id', { length: 64 }).primaryKey(),
  address: char('address', { length: 42 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
