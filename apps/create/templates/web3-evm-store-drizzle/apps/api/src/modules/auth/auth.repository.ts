import { and, eq, gt } from 'drizzle-orm'
import { getAddress } from 'viem'
import type { Database } from '../../shared/database/drizzle-client.js'
import { authNonces, authSessions } from './auth.schema.js'
import type { AuthStore } from './auth.store.js'

/**
 * Nonces e sessões do login no Drizzle. Recebe `{ db }`: o connectDatabase() do Express e do
 * Fastify e o DrizzleService do Nest já têm esse formato.
 */
export function createAuthRepository({ db }: { db: Database }): AuthStore {
  return {
    async saveNonce(nonce, expiresAt) {
      await db.insert(authNonces).values({ nonce, expiresAt })
    },

    async consumeNonce(nonce) {
      // Um único DELETE: duas requisições com o mesmo nonce não passam as duas.
      const valid = and(eq(authNonces.nonce, nonce), gt(authNonces.expiresAt, new Date()))
//#if database=postgres
      const { rowCount } = await db.delete(authNonces).where(valid)
      return rowCount === 1
//#else
      const [{ affectedRows }] = await db.delete(authNonces).where(valid)
      return affectedRows === 1
//#endif
    },

    async createSession({ id, address, expiresAt }) {
      await db.insert(authSessions).values({ id, address, expiresAt })
    },

    async findSession(id) {
      const [session] = await db
        .select({ address: authSessions.address })
        .from(authSessions)
        .where(and(eq(authSessions.id, id), gt(authSessions.expiresAt, new Date())))
        .limit(1)
      return session ? { address: getAddress(session.address) } : undefined
    },

    async deleteSession(id) {
      await db.delete(authSessions).where(eq(authSessions.id, id))
    },
  }
}
