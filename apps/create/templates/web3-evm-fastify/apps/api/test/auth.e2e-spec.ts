import 'dotenv/config'
import { generatePrivateKey, type PrivateKeyAccount, privateKeyToAccount } from 'viem/accounts'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { createAccessService } from '../src/modules/access/index.js'
import { createAuthRepository, createAuthService } from '../src/modules/auth/index.js'
import { loadChainConfig } from '../src/shared/chain/chain-config.js'
import { env } from '../src/shared/config/env.js'
import { connectDatabase } from '../src/shared/database/database.js'
//#if queue=bullmq
import { connectRedis } from '../src/shared/queue/redis.js'
//#endif
import { offlineChainClient, signSiweMessage } from './support/siwe.js'

describe('login SIWE (banco real)', () => {
  const config = loadChainConfig()
  const database = connectDatabase(env.databaseUrl)
//#if queue=bullmq
  const redis = connectRedis(env.redisUrl)
//#endif
  const admin = privateKeyToAccount(generatePrivateKey())
  const client = offlineChainClient([admin.address])
  let app: Awaited<ReturnType<typeof createApp>>

  beforeAll(async () => {
    app = await createApp({
      database,
//#if queue=bullmq
      redis,
//#endif
      corsOrigins: env.corsOrigins,
      authService: createAuthService({ store: createAuthRepository(database), client, config }),
      // Contrato fictício: o cliente de teste responde hasRole sem rede.
      accessService: createAccessService({
        client,
        config: { accessControlAddress: '0x1111111111111111111111111111111111111111' },
      }),
//#if session=cookie
      siweOrigin: config.siweOrigin,
//#endif
    })
  })

  afterAll(async () => {
    await app.close()
//#if queue=bullmq
    await Promise.all([database.close(), redis.close()])
//#else
    await database.close()
//#endif
  })

//#if session=cookie
  // Como o frontend: o cookie volta em cada requisição e o que muda estado leva o Origin.
  function withSession(cookie?: string) {
    return { origin: config.siweOrigin, ...(cookie ? { cookie } : {}) }
  }
//#else
  function withSession(token?: string) {
    return token ? { authorization: `Bearer ${token}` } : {}
  }
//#endif

  const newAccount = () => privateKeyToAccount(generatePrivateKey())
  const get = (url: string, session?: string) =>
    app.inject({ method: 'GET', url, headers: withSession(session) })
  const post = (url: string, session?: string) =>
    app.inject({ method: 'POST', url, headers: withSession(session) })
  const verify = (payload: object) =>
    app.inject({ method: 'POST', url: '/auth/verify', headers: withSession(), payload })

  async function credentialsFor(
    account: PrivateKeyAccount,
    site: { domain?: string; uri?: string } = {}
  ) {
    const response = await get('/auth/nonce')
    expect(response.statusCode).toBe(200)
    return signSiweMessage(account, { nonce: response.json().nonce, config, ...site })
  }

//#if session=cookie
  async function signIn(account: PrivateKeyAccount) {
    const response = await verify(await credentialsFor(account))
    expect(response.statusCode).toBe(204)
    const setCookie = String(response.headers['set-cookie'])
    return { session: setCookie.split(';')[0] ?? '', setCookie }
  }

  it('login devolve o cookie de sessão HttpOnly, SameSite=Lax, de 24 horas', async () => {
    const { setCookie } = await signIn(newAccount())
    expect(setCookie).toMatch(/^session=[\w-]{43};/)
    expect(setCookie).toContain('Max-Age=86400')
    expect(setCookie).toContain('Path=/')
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toContain('SameSite=Lax')
  })

  it('Origin de outro site é recusado nas requisições que mudam estado', async () => {
    const payload = await credentialsFor(newAccount())
    const evil = await app.inject({
      method: 'POST',
      url: '/auth/verify',
      headers: { origin: 'https://evil.example.com' },
      payload,
    })
    expect(evil.statusCode).toBe(403)
    const missing = await app.inject({ method: 'POST', url: '/auth/verify', payload })
    expect(missing.statusCode).toBe(403)
  })
//#else
  async function signIn(account: PrivateKeyAccount) {
    const response = await verify(await credentialsFor(account))
    expect(response.statusCode).toBe(200)
    const { token, expiresAt } = response.json()
    return { session: String(token), expiresAt: String(expiresAt) }
  }

  it('login devolve o token e a validade de 24 horas', async () => {
    const { session, expiresAt } = await signIn(newAccount())
    expect(session).toMatch(/^[\w-]{43}$/)
    const hours = (new Date(expiresAt).getTime() - Date.now()) / (60 * 60 * 1000)
    expect(hours).toBeGreaterThan(23.9)
    expect(hours).toBeLessThanOrEqual(24)
  })
//#endif

  it('login, me e logout, que apaga a sessão no servidor', async () => {
    const account = newAccount()
    const { session } = await signIn(account)

    const me = await get('/auth/me', session)
    expect(me.statusCode).toBe(200)
    expect(me.json()).toEqual({ address: account.address })
    expect((await post('/auth/logout', session)).statusCode).toBe(204)
    expect((await get('/auth/me', session)).statusCode).toBe(401)
  })

  it('sem sessão, /auth/me responde 401', async () => {
    expect((await get('/auth/me')).statusCode).toBe(401)
  })

  it('nonce reutilizado é recusado', async () => {
    const credentials = await credentialsFor(newAccount())
    expect((await verify(credentials)).statusCode).toBeLessThan(300)
    expect((await verify(credentials)).statusCode).toBe(401)
  })

  it('mensagem assinada para outro domínio é recusada', async () => {
    const credentials = await credentialsFor(newAccount(), { domain: 'evil.example.com' })
    expect((await verify(credentials)).statusCode).toBe(401)
  })

  it('URI com o mesmo prefixo da origem do frontend, mas de outra origem, é recusada', async () => {
    // Com SIWE_ORIGIN http://localhost:3000, a URI fica em http://localhost:30001.
    const credentials = await credentialsFor(newAccount(), { uri: `${config.siweOrigin}1/login` })
    expect((await verify(credentials)).statusCode).toBe(401)
  })

  it('mensagem acima de 4096 caracteres ou assinatura não hexadecimal responde 400', async () => {
    const { message, signature } = await credentialsFor(newAccount())
    expect((await verify({ message: 'x'.repeat(5000), signature })).statusCode).toBe(400)
    expect((await verify({ message, signature: '0xnao-hex' })).statusCode).toBe(400)
  })

  it('toda rota exige sessão, menos /health, /auth/nonce e /auth/verify', async () => {
    expect((await get('/health')).statusCode).toBe(200)
    expect((await get('/auth/nonce')).statusCode).toBe(200)
    expect((await get('/access/admin')).statusCode).toBe(401)
    expect((await get('/nao-existe')).statusCode).toBe(404)
  })

  it('/access/admin: 200 com o papel no contrato, 403 sem ele e 401 sem sessão', async () => {
    const { session: adminSession } = await signIn(admin)
    const allowed = await get('/access/admin', adminSession)
    expect(allowed.statusCode).toBe(200)
    expect(allowed.json()).toEqual({ address: admin.address, role: 'admin' })

    const { session } = await signIn(newAccount())
    expect((await get('/access/admin', session)).statusCode).toBe(403)
    expect((await get('/access/admin')).statusCode).toBe(401)
  })
})
