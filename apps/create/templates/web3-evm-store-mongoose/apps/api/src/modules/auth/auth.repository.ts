import type mongoose from 'mongoose'
import { getAddress } from 'viem'
import { authModels } from './auth.schema.js'
import type { AuthStore } from './auth.store.js'

/**
 * Nonces e sessões do login no Mongoose. Recebe `{ connection }`: o connectDatabase() do Express e
 * do Fastify já tem esse formato; no Nest, `{ connection }` com a conexão de @InjectConnection().
 */
export function createAuthRepository({
  connection,
}: {
  connection: mongoose.Connection
}): AuthStore {
  const { AuthNonce, AuthSession } = authModels(connection)
  return {
    async saveNonce(nonce, expiresAt) {
      await AuthNonce.create({ _id: nonce, expires_at: expiresAt })
    },

    async consumeNonce(nonce) {
      // findOneAndDelete é atômico: duas requisições com o mesmo nonce não passam as duas.
      const deleted = await AuthNonce.findOneAndDelete({
        _id: nonce,
        expires_at: { $gt: new Date() },
      })
      return deleted !== null
    },

    async createSession({ id, address, expiresAt }) {
      await AuthSession.create({ _id: id, address, expires_at: expiresAt })
    },

    async findSession(id) {
      const session = await AuthSession.findOne({ _id: id, expires_at: { $gt: new Date() } }).lean()
      return session ? { address: getAddress(session.address) } : undefined
    },

    async deleteSession(id) {
      await AuthSession.deleteOne({ _id: id })
    },
  }
}
