import type { ApiClient, ApiResponse } from '@japa/api-client'
//#if session=jwt
import { type JWTPayload, SignJWT, UnsecuredJWT } from 'jose'
//#endif
import { type Hex, isAddressEqual, recoverMessageAddress } from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import {
  type CreateSiweMessageParameters,
  createSiweMessage,
  parseSiweMessage,
  validateSiweMessage,
} from 'viem/siwe'
import web3Config from '#config/web3'
//#if session=cookie
import { SESSION_COOKIE } from '#modules/auth/session_transport'
//#endif
import type ChainClient from '#shared/chain_client'

/**
 * Cliente da rede dos testes: confere a mensagem e recupera o signatário localmente, sem RPC.
 * Só cobre carteira comum (EOA); carteira de contrato (EIP-1271) precisa da rede.
 */
export const offlineChainClient = {
  async verifySiweMessage(params: {
    message: string
    signature: Hex
    domain?: string
    nonce?: string
  }) {
    const fields = parseSiweMessage(params.message)
    if (!fields.address) return false
    if (!validateSiweMessage({ message: fields, domain: params.domain, nonce: params.nonce })) {
      return false
    }
    const signer = await recoverMessageAddress({
      message: params.message,
      signature: params.signature,
    })
    return isAddressEqual(signer, fields.address)
  },
  async readContract() {
    throw new Error('sem RPC nos testes')
  },
} as unknown as ChainClient

export const fromFrontend = { origin: web3Config.siwe.origin }

//#if session=cookie
export const LOGIN_STATUS = 204
//#else
export const LOGIN_STATUS = 200
//#endif

/** Faz o login completo com uma conta local nova: nonce, mensagem assinada e POST /auth/verify. */
export async function signIn(
  client: ApiClient,
  overrides: Partial<CreateSiweMessageParameters> = {}
) {
  const account = privateKeyToAccount(generatePrivateKey())
  const { nonce } = (await client.get('/auth/nonce')).body()
  const message = createSiweMessage({
    address: account.address,
    chainId: web3Config.chain.id,
    domain: web3Config.siwe.domain,
    uri: web3Config.siwe.origin,
    version: '1',
    nonce,
    issuedAt: new Date(),
    expirationTime: new Date(Date.now() + 5 * 60 * 1000),
    ...overrides,
  })
  const signature = await account.signMessage({ message })
  const response = await client
    .post('/auth/verify')
    .headers(fromFrontend)
    .json({ message, signature })
  return { account, message, signature, response }
}

/** Cabeçalhos que levam a sessão criada pelo login às próximas requisições. */
export function sessionHeaders(login: ApiResponse): Record<string, string> {
  //#if session=cookie
  // Lido do Set-Cookie: o response.cookie() do plugin do Adonis decodifica como cookie assinado e
  // perde o valor do cookie simples.
  const token = new RegExp(`${SESSION_COOKIE.name}=([^;]+)`).exec(
    String(login.header('set-cookie'))
  )?.[1]
  return { cookie: `${SESSION_COOKIE.name}=${token}`, ...fromFrontend }
  //#else
  return { authorization: `Bearer ${login.body().token}` }
  //#endif
}
//#if session=jwt

type JwtVariant = { claims?: JWTPayload; secret?: Uint8Array; alg?: 'HS256' | 'HS512' }

/** JWT de sessão montado no teste; os parâmetros trocam claims, segredo ou algoritmo. */
export function sessionJwt(
  address: string,
  { claims = {}, secret = web3Config.jwtSecret, alg = 'HS256' }: JwtVariant = {}
) {
  return new SignJWT({ ...validClaims(address), ...claims })
    .setProtectedHeader({ alg })
    .sign(secret)
}

function validClaims(address: string) {
  const now = Math.floor(Date.now() / 1000)
  const origin = web3Config.siwe.origin
  return { sub: address, iat: now, exp: now + 60 * 60, iss: origin, aud: origin }
}

/** JWTs que a API precisa recusar (docs/standards/web3.md, "Transporte da sessão"). */
export const rejectedSessionJwts = [
  {
    label: 'expirado',
    forge: (address: string) => {
      const now = Math.floor(Date.now() / 1000)
      return sessionJwt(address, { claims: { iat: now - 7200, exp: now - 3600 } })
    },
  },
  {
    label: 'assinatura adulterada (sub trocado)',
    forge: async (address: string) => {
      const [header, , signature] = (await sessionJwt(address)).split('.')
      const other = privateKeyToAccount(generatePrivateKey()).address
      const payload = Buffer.from(JSON.stringify(validClaims(other))).toString('base64url')
      return `${header}.${payload}.${signature}`
    },
  },
  {
    label: 'alg: none',
    forge: async (address: string) => new UnsecuredJWT(validClaims(address)).encode(),
  },
  {
    label: 'outro algoritmo (HS512)',
    forge: (address: string) => sessionJwt(address, { alg: 'HS512' }),
  },
  {
    label: 'outro segredo',
    forge: (address: string) =>
      sessionJwt(address, { secret: new TextEncoder().encode('x'.repeat(32)) }),
  },
  {
    label: 'iss errado',
    forge: (address: string) => sessionJwt(address, { claims: { iss: 'https://evil.example' } }),
  },
  {
    label: 'aud errado',
    forge: (address: string) => sessionJwt(address, { claims: { aud: 'https://evil.example' } }),
  },
  {
    label: 'sem exp',
    forge: (address: string) => sessionJwt(address, { claims: { exp: undefined } }),
  },
]
//#endif
