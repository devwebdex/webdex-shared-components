import 'dotenv/config'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request, { type Test as HttpTest } from 'supertest'
import { generatePrivateKey, type PrivateKeyAccount, privateKeyToAccount } from 'viem/accounts'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AppModule } from '../src/app.module.js'
//#if session=jwt
import { loadJwtConfig } from '../src/modules/auth/auth.service.js'
//#endif
import { CHAIN_CLIENT, CHAIN_CONFIG } from '../src/shared/chain/chain.module.js'
import { loadChainConfig } from '../src/shared/chain/chain-config.js'
//#if session=jwt
import { offlineChainClient, rejectedJwts, signSiweMessage } from './support/siwe.js'
//#else
import { offlineChainClient, signSiweMessage } from './support/siwe.js'
//#endif

describe('login SIWE (banco real)', () => {
  const config = loadChainConfig()
  const admin = privateKeyToAccount(generatePrivateKey())
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CHAIN_CLIENT)
      .useValue(offlineChainClient([admin.address]))
      // Contrato fictício: o cliente de teste responde hasRole sem rede.
      .overrideProvider(CHAIN_CONFIG)
      .useValue({ ...config, accessControlAddress: '0x1111111111111111111111111111111111111111' })
      .compile()
    app = moduleRef.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  const http = () => request(app.getHttpServer())
  const newAccount = () => privateKeyToAccount(generatePrivateKey())

  async function credentialsFor(
    account: PrivateKeyAccount,
    site: { domain?: string; uri?: string } = {}
  ) {
    const { body } = await http().get('/auth/nonce').expect(200)
    return signSiweMessage(account, { nonce: body.nonce, config, ...site })
  }

//#if session=cookie
  // Como o frontend: o cookie volta em cada requisição e o que muda estado leva o Origin.
  function withSession(test: HttpTest, cookie?: string) {
    if (cookie) test.set('Cookie', cookie)
    return test.set('Origin', config.siweOrigin)
  }

  async function signIn(account: PrivateKeyAccount) {
    const credentials = await credentialsFor(account)
    const response = await withSession(http().post('/auth/verify')).send(credentials).expect(204)
    const [setCookie = ''] = response.get('Set-Cookie') ?? []
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
    const credentials = await credentialsFor(newAccount())
    await http()
      .post('/auth/verify')
      .set('Origin', 'https://evil.example.com')
      .send(credentials)
      .expect(403)
    await http().post('/auth/verify').send(credentials).expect(403)
  })
//#else
  function withSession(test: HttpTest, token?: string) {
    return token ? test.set('Authorization', `Bearer ${token}`) : test
  }

  async function signIn(account: PrivateKeyAccount) {
    const credentials = await credentialsFor(account)
    const response = await http().post('/auth/verify').send(credentials).expect(200)
    return { session: String(response.body.token), expiresAt: String(response.body.expiresAt) }
  }

//#if session=jwt
  it('login devolve o JWT e a validade de 1 hora', async () => {
    const { session, expiresAt } = await signIn(newAccount())
    expect(session).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/)
    const minutes = (new Date(expiresAt).getTime() - Date.now()) / (60 * 1000)
    expect(minutes).toBeGreaterThan(59)
    expect(minutes).toBeLessThanOrEqual(60)
  })

  it('JWT expirado, adulterado ou com alg none responde 401', async () => {
    const { session } = await signIn(newAccount())
    const { expired, tampered, none } = await rejectedJwts(session, loadJwtConfig().secret)
    await withSession(http().get('/auth/me'), expired).expect(401)
    await withSession(http().get('/auth/me'), tampered).expect(401)
    await withSession(http().get('/auth/me'), none).expect(401)
  })
//#else
  it('login devolve o token e a validade de 24 horas', async () => {
    const { session, expiresAt } = await signIn(newAccount())
    expect(session).toMatch(/^[\w-]{43}$/)
    const hours = (new Date(expiresAt).getTime() - Date.now()) / (60 * 60 * 1000)
    expect(hours).toBeGreaterThan(23.9)
    expect(hours).toBeLessThanOrEqual(24)
  })
//#endif
//#endif

//#if session=jwt
  it('login, me e logout, que não revoga o JWT: ele vale até expirar', async () => {
    const account = newAccount()
    const { session } = await signIn(account)

    await withSession(http().get('/auth/me'), session).expect(200, { address: account.address })
    await withSession(http().post('/auth/logout'), session).expect(204)
    // Sem revogação (docs/standards/web3.md): quem descarta o JWT é o frontend.
    await withSession(http().get('/auth/me'), session).expect(200)
  })
//#else
  it('login, me e logout, que apaga a sessão no servidor', async () => {
    const account = newAccount()
    const { session } = await signIn(account)

    await withSession(http().get('/auth/me'), session).expect(200, { address: account.address })
    await withSession(http().post('/auth/logout'), session).expect(204)
    await withSession(http().get('/auth/me'), session).expect(401)
  })
//#endif

  it('sem sessão, /auth/me responde 401', async () => {
    await http().get('/auth/me').expect(401)
  })

  it('nonce reutilizado é recusado', async () => {
    const credentials = await credentialsFor(newAccount())
    const verify = () => withSession(http().post('/auth/verify')).send(credentials)
    await verify().expect((response) => expect(response.status).toBeLessThan(300))
    await verify().expect(401)
  })

  it('mensagem assinada para outro domínio é recusada', async () => {
    const credentials = await credentialsFor(newAccount(), { domain: 'evil.example.com' })
    await withSession(http().post('/auth/verify')).send(credentials).expect(401)
  })

  it('URI com o mesmo prefixo da origem do frontend, mas de outra origem, é recusada', async () => {
    // Com SIWE_ORIGIN http://localhost:3000, a URI fica em http://localhost:30001.
    const credentials = await credentialsFor(newAccount(), { uri: `${config.siweOrigin}1/login` })
    await withSession(http().post('/auth/verify')).send(credentials).expect(401)
  })

  it('mensagem acima de 4096 caracteres ou assinatura não hexadecimal responde 400', async () => {
    const { message, signature } = await credentialsFor(newAccount())
    const verify = () => withSession(http().post('/auth/verify'))
    const longMessage = 'x'.repeat(5000)
    await verify().send({ message: longMessage, signature }).expect(400)
    await verify().send({ message, signature: '0xnao-hex' }).expect(400)
  })

  it('toda rota exige sessão, menos /health, /auth/nonce e /auth/verify', async () => {
    await http().get('/health').expect(200)
    await http().get('/auth/nonce').expect(200)
    await http().get('/access/admin').expect(401)
    await http().get('/nao-existe').expect(404)
  })

  it('/access/admin: 200 com o papel no contrato, 403 sem ele e 401 sem sessão', async () => {
    const { session: adminSession } = await signIn(admin)
    await withSession(http().get('/access/admin'), adminSession).expect(200, {
      address: admin.address,
      role: 'admin',
    })

    const { session } = await signIn(newAccount())
    await withSession(http().get('/access/admin'), session).expect(403)
    await http().get('/access/admin').expect(401)
  })
})
