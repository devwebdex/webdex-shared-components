import { getAddress } from 'viem'
import type { PrismaClient } from '../../generated/prisma/client.js'
import type { AuthStore } from './auth.store.js'

/**
 * Nonces e sessões do login no Prisma. Recebe `{ prisma }`: o connectDatabase() do Express e do
 * Fastify já tem esse formato; no Nest, `{ prisma: prismaService }`.
 */
export function createAuthRepository({ prisma }: { prisma: PrismaClient }): AuthStore {
  return {
    async saveNonce(nonce, expiresAt) {
      await prisma.authNonce.create({ data: { nonce, expiresAt } })
    },

    async consumeNonce(nonce) {
      // Um único DELETE: duas requisições com o mesmo nonce não passam as duas.
      const { count } = await prisma.authNonce.deleteMany({
        where: { nonce, expiresAt: { gt: new Date() } },
      })
      return count === 1
    },

    async createSession({ id, address, expiresAt }) {
      await prisma.authSession.create({ data: { id, address, expiresAt } })
    },

    async findSession(id) {
      const session = await prisma.authSession.findFirst({
        where: { id, expiresAt: { gt: new Date() } },
        select: { address: true },
      })
      return session ? { address: getAddress(session.address) } : undefined
    },

    async deleteSession(id) {
      await prisma.authSession.deleteMany({ where: { id } })
    },
  }
}
