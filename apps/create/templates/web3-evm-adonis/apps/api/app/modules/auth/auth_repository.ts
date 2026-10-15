import type { DateTime } from 'luxon'
import AuthNonce from '#modules/auth/models/auth_nonce'
//#if session!=jwt
import AuthSession from '#modules/auth/models/auth_session'
//#endif

export default class AuthRepository {
  async createNonce(nonce: string, expiresAt: DateTime) {
    await AuthNonce.create({ nonce, expiresAt })
  }

  // Um único DELETE condicional: duas requisições com o mesmo nonce não passam as duas.
  async consumeNonce(nonce: string): Promise<boolean> {
    const [deleted] = await AuthNonce.query()
      .where('nonce', nonce)
      .where('expiresAt', '>', new Date())
      .delete()
    return deleted === 1
  }
  //#if session!=jwt

  async createSession(session: { id: string; address: string; expiresAt: DateTime }) {
    await AuthSession.create(session)
  }

  async findSessionAddress(id: string): Promise<string | null> {
    const session = await AuthSession.query()
      .where('id', id)
      .where('expiresAt', '>', new Date())
      .first()
    return session?.address ?? null
  }

  async deleteSession(id: string) {
    await AuthSession.query().where('id', id).delete()
  }
  //#endif
}
