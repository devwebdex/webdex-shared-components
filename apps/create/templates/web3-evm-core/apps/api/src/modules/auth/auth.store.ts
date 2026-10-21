import type { Address } from 'viem'

export type StoredSession = {
  /** SHA-256 do token: o token em si nunca é guardado. */
  id: string
  address: Address
  expiresAt: Date
}

/** Persistência do login (tabelas auth_nonces e auth_sessions), implementada no auth.repository.ts do ORM. */
export type AuthStore = {
  saveNonce(nonce: string, expiresAt: Date): Promise<void>
  /** Apaga o nonce numa operação atômica: true só se ele existia e não tinha expirado. */
  consumeNonce(nonce: string): Promise<boolean>
  createSession(session: StoredSession): Promise<void>
  /** Sessão ainda válida; expirada conta como inexistente. */
  findSession(id: string): Promise<{ address: Address } | undefined>
  deleteSession(id: string): Promise<void>
}
