import { createHash, randomBytes } from 'node:crypto'
import { getAddress, type Hex } from 'viem'
import { parseSiweMessage } from 'viem/siwe'
import type { ChainClient } from '../../shared/chain/chain-client.js'
import type { ChainConfig } from '../../shared/chain/chain-config.js'
import type { AuthStore } from './auth.store.js'

export const SESSION_TTL_SECONDS = 24 * 60 * 60
const NONCE_TTL_MS = 5 * 60 * 1000
const MAX_MESSAGE_TTL_MS = 10 * 60 * 1000

export type AuthServiceDependencies = {
  store: AuthStore
  client: ChainClient
  config: Pick<ChainConfig, 'chain' | 'siweOrigin'>
}

export type SiweCredentials = {
  message: string
  signature: Hex
}

export type NewSession = {
  token: string
  expiresAt: Date
}

/** Login SIWE (EIP-4361) com sessão do projeto, na ordem de docs/standards/web3.md. */
export function createAuthService({ store, client, config }: AuthServiceDependencies) {
  const domain = new URL(config.siweOrigin).host

  return {
    async createNonce() {
      const nonce = randomBytes(16).toString('hex')
      await store.saveNonce(nonce, new Date(Date.now() + NONCE_TTL_MS))
      return nonce
    },

    /** undefined vira 401, sem dizer ao cliente qual verificação falhou. */
    async verify({ message, signature }: SiweCredentials): Promise<NewSession | undefined> {
      const fields = parseSiweMessage(message)
      // O nonce é consumido antes das outras verificações: mensagem recusada não pode ser reenviada.
      if (!fields.nonce || !(await store.consumeNonce(fields.nonce))) return undefined
      if (
        !fields.address ||
        fields.domain !== domain ||
        URL.parse(fields.uri ?? '')?.origin !== config.siweOrigin ||
        fields.chainId !== config.chain.id ||
        !expiresSoon(fields.expirationTime)
      ) {
        return undefined
      }

      // Confere domínio, nonce, validade e assinatura (inclusive de carteira de contrato), não chainId nem URI.
      const valid = await client.verifySiweMessage({
        message,
        signature,
        domain,
        nonce: fields.nonce,
      })
      if (!valid) return undefined

      const token = randomBytes(32).toString('base64url')
      const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000)
      await store.createSession({
        id: hashToken(token),
        address: getAddress(fields.address),
        expiresAt,
      })
      return { token, expiresAt }
    },

    findSession(token: string) {
      return store.findSession(hashToken(token))
    },

    async logout(token: string) {
      await store.deleteSession(hashToken(token))
    },
  }
}

export type AuthService = ReturnType<typeof createAuthService>

function expiresSoon(expirationTime: Date | undefined) {
  // Data inválida vira NaN, e a comparação com NaN dá false.
  return (expirationTime?.getTime() ?? Number.NaN) <= Date.now() + MAX_MESSAGE_TTL_MS
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}
