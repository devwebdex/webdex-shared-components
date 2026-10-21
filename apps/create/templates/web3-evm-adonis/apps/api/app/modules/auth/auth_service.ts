//#if session=jwt
import { randomBytes } from 'node:crypto'
import { inject } from '@adonisjs/core'
import { errors, jwtVerify, SignJWT } from 'jose'
import { DateTime } from 'luxon'
import { type Address, getAddress, type Hex, isAddress } from 'viem'
//#else
import { createHash, randomBytes } from 'node:crypto'
import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import { type Address, getAddress, type Hex } from 'viem'
//#endif
import { parseSiweMessage } from 'viem/siwe'
import web3Config from '#config/web3'
import AuthRepository from '#modules/auth/auth_repository'
import ChainClient from '#shared/chain_client'

//#if session=jwt
// O JWT não é revogável: a validade curta limita o uso de um token vazado.
export const SESSION_TTL_SECONDS = 60 * 60
//#else
export const SESSION_TTL_SECONDS = 24 * 60 * 60
//#endif
const NONCE_TTL_MINUTES = 5
// Uma mensagem assinada que vaze só serve enquanto não expira: a validade aceita é curta.
const MAX_MESSAGE_LIFETIME_MS = 10 * 60 * 1000
// O parseSiweMessage do viem tem custo quadrático no tamanho: sem teto, uma mensagem grande trava a API.
export const MAX_MESSAGE_LENGTH = 4096
export const MAX_SIGNATURE_LENGTH = 16384

export type Session = { token: string; expiresAt: DateTime }
type SiweFields = ReturnType<typeof parseSiweMessage>

/** API pública do módulo auth: login SIWE e sessões do projeto. */
@inject()
export default class AuthService {
  constructor(
    private readonly chainClient: ChainClient,
    private readonly repository: AuthRepository
  ) {}

  // randomBytes, e não o generateSiweNonce do viem, que usa Math.random.
  async issueNonce() {
    const nonce = randomBytes(16).toString('hex')
    await this.repository.createNonce(nonce, DateTime.now().plus({ minutes: NONCE_TTL_MINUTES }))
    return nonce
  }

  /** Confere a mensagem na ordem de docs/standards/web3.md e abre a sessão; null se algo não confere. */
  async login(message: string, signature: Hex): Promise<Session | null> {
    if (message.length > MAX_MESSAGE_LENGTH || signature.length > MAX_SIGNATURE_LENGTH) return null
    const fields = parseSiweMessage(message)
    if (!fields.nonce || !(await this.repository.consumeNonce(fields.nonce))) return null
    if (!fields.address || !isForThisApp(fields)) return null

    // Não confere chainId nem URI (por isso isForThisApp); confere assinatura, domínio, nonce e validade.
    const valid = await this.chainClient.verifySiweMessage({
      message,
      signature,
      domain: web3Config.siwe.domain,
      nonce: fields.nonce,
    })
    if (!valid) return null
    return this.openSession(getAddress(fields.address))
  }

  //#if session=jwt
  /**
   * Endereço do JWT de sessão; null se não confere. O algoritmo fica fixo em HS256: um token com
   * `alg: none` ou outro algoritmo é recusado antes da assinatura.
   */
  async sessionAddress(token: string): Promise<Address | null> {
    try {
      const { payload } = await jwtVerify(token, web3Config.jwtSecret, {
        algorithms: ['HS256'],
        issuer: web3Config.siwe.origin,
        audience: web3Config.siwe.origin,
        requiredClaims: ['sub', 'iat', 'exp'],
      })
      return payload.sub && isAddress(payload.sub) ? getAddress(payload.sub) : null
    } catch (error) {
      if (error instanceof errors.JOSEError) return null
      throw error
    }
  }

  // Sem tabela de sessões: o JWT assinado carrega o endereço e a validade.
  private async openSession(address: Address): Promise<Session> {
    const issuedAt = Math.floor(Date.now() / 1000)
    const expiresAt = issuedAt + SESSION_TTL_SECONDS
    const token = await new SignJWT()
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(address)
      .setIssuedAt(issuedAt)
      .setExpirationTime(expiresAt)
      .setIssuer(web3Config.siwe.origin)
      .setAudience(web3Config.siwe.origin)
      .sign(web3Config.jwtSecret)
    return { token, expiresAt: DateTime.fromSeconds(expiresAt) }
  }
  //#else
  async sessionAddress(token: string) {
    return (await this.repository.findSessionAddress(hashToken(token))) as Address | null
  }

  async logout(token: string) {
    await this.repository.deleteSession(hashToken(token))
  }

  private async openSession(address: Address): Promise<Session> {
    const token = randomBytes(32).toString('base64url')
    const expiresAt = DateTime.now().plus({ seconds: SESSION_TTL_SECONDS })
    await this.repository.createSession({ id: hashToken(token), address, expiresAt })
    return { token, expiresAt }
  }
  //#endif
}

function isForThisApp({ domain, uri, chainId, expirationTime }: SiweFields) {
  return (
    domain === web3Config.siwe.domain &&
    uri !== undefined &&
    URL.canParse(uri) &&
    new URL(uri).origin === web3Config.siwe.origin &&
    chainId === web3Config.chain.id &&
    expirationTime !== undefined &&
    expirationTime.getTime() <= Date.now() + MAX_MESSAGE_LIFETIME_MS
  )
}
//#if session!=jwt

// O banco guarda só o hash: um vazamento da tabela não entrega sessões válidas.
function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}
//#endif
