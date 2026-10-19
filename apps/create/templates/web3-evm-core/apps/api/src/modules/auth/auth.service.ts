//#if session=jwt
import { randomBytes } from 'node:crypto'
import { errors, jwtVerify, SignJWT } from 'jose'
import { type Address, getAddress, type Hex, isAddress } from 'viem'
//#else
import { createHash, randomBytes } from 'node:crypto'
import { getAddress, type Hex } from 'viem'
//#endif
import { parseSiweMessage } from 'viem/siwe'
import type { ChainClient } from '../../shared/chain/chain-client.js'
import type { ChainConfig } from '../../shared/chain/chain-config.js'
import type { AuthStore } from './auth.store.js'

//#if session=jwt
// Curto porque o JWT não é revogável: o logout não o invalida (docs/standards/web3.md).
export const SESSION_TTL_SECONDS = 60 * 60
const JWT_SECRET_MIN_BYTES = 32
//#else
export const SESSION_TTL_SECONDS = 24 * 60 * 60
//#endif
const NONCE_TTL_MS = 5 * 60 * 1000
const MAX_MESSAGE_TTL_MS = 10 * 60 * 1000
// O parseSiweMessage do viem tem custo quadrático no tamanho da mensagem (100 KB levam cerca de 2 s):
// as rotas recusam com 400 acima destes limites, antes de qualquer leitura.
export const SIWE_MESSAGE_MAX_LENGTH = 4096
export const SIWE_SIGNATURE_MAX_LENGTH = 16_384

export type AuthServiceDependencies = {
  store: AuthStore
  client: ChainClient
  config: Pick<ChainConfig, 'chain' | 'siweOrigin'>
//#if session=jwt
  /** Padrão: loadJwtConfig(), lido ao criar o serviço. */
  jwt?: JwtConfig
//#endif
}
//#if session=jwt

export type JwtConfig = {
  /** Segredo do HS256 (JWT_SECRET). */
  secret: Uint8Array
}
//#endif

export type SiweCredentials = {
  message: string
  signature: Hex
}

export type NewSession = {
  token: string
  expiresAt: Date
}

/** Login SIWE (EIP-4361) com sessão do projeto, na ordem de docs/standards/web3.md. */
//#if session=jwt
export function createAuthService({
  store,
  client,
  config,
  jwt = loadJwtConfig(),
}: AuthServiceDependencies) {
//#else
export function createAuthService({ store, client, config }: AuthServiceDependencies) {
//#endif
  const domain = new URL(config.siweOrigin).host

  return {
    async createNonce() {
      const nonce = randomBytes(16).toString('hex')
      await store.saveNonce(nonce, new Date(Date.now() + NONCE_TTL_MS))
      return nonce
    },

    /** undefined vira 401, sem dizer ao cliente qual verificação falhou. */
    async verify({ message, signature }: SiweCredentials): Promise<NewSession | undefined> {
      // Mesmo limite das rotas, para quem chamar o serviço sem passar por elas.
      if (
        message.length > SIWE_MESSAGE_MAX_LENGTH ||
        signature.length > SIWE_SIGNATURE_MAX_LENGTH
      ) {
        return undefined
      }
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

//#if session=jwt
      // Nada vai para o banco: a sessão é o próprio JWT, conferido só pela assinatura.
      const issuedAt = Math.floor(Date.now() / 1000)
      const expiresAt = new Date((issuedAt + SESSION_TTL_SECONDS) * 1000)
      const token = await new SignJWT()
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setSubject(getAddress(fields.address))
        .setIssuer(config.siweOrigin)
        .setAudience(config.siweOrigin)
        .setIssuedAt(issuedAt)
        .setExpirationTime(expiresAt)
        .sign(jwt.secret)
      return { token, expiresAt }
    },

    /** Confere algoritmo (só HS256), assinatura, exp, iss e aud; qualquer falha vira undefined (401). */
    async findSession(token: string): Promise<{ address: Address } | undefined> {
      try {
        const { payload } = await jwtVerify(token, jwt.secret, {
          algorithms: ['HS256'],
          issuer: config.siweOrigin,
          audience: config.siweOrigin,
          requiredClaims: ['sub', 'iat', 'exp'],
        })
        return payload.sub && isAddress(payload.sub) ? { address: payload.sub } : undefined
      } catch (error) {
        if (error instanceof errors.JOSEError) return undefined
        throw error
      }
    },

    /** O JWT não é revogável: segue válido até expirar; quem descarta é o frontend. */
    logout(_token: string): Promise<void> {
      return Promise.resolve()
    },
  }
}
//#else
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
//#endif

export type AuthService = ReturnType<typeof createAuthService>

function expiresSoon(expirationTime: Date | undefined) {
  // Data inválida vira NaN, e a comparação com NaN dá false.
  return (expirationTime?.getTime() ?? Number.NaN) <= Date.now() + MAX_MESSAGE_TTL_MS
}

//#if session=jwt
/** Lê JWT_SECRET na inicialização (não no import): os testes unitários não precisam do ambiente. */
export function loadJwtConfig(): JwtConfig {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? '')
  if (secret.length < JWT_SECRET_MIN_BYTES) {
    throw new Error(
      `JWT_SECRET ausente ou curto: use pelo menos ${JWT_SECRET_MIN_BYTES} bytes (pnpm env:setup gera um)`
    )
  }
  return { secret }
}
//#else
function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}
//#endif
