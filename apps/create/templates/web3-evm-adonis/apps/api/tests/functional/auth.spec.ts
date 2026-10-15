import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import web3Config from '#config/web3'
//#if session=cookie
import { SESSION_COOKIE } from '#modules/auth/session_transport'
//#endif
import ChainClient from '#shared/chain_client'
import {
  fromFrontend,
  LOGIN_STATUS,
  offlineChainClient,
  sessionHeaders,
  signIn,
} from '#tests/helpers/siwe'

test.group('login SIWE (banco real)', (group) => {
  group.setup(() => {
    app.container.swap(ChainClient, () => offlineChainClient)
    return () => app.container.restore(ChainClient)
  })
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('GET /auth/nonce devolve um nonce de 32 hex', async ({ client, assert }) => {
    const response = await client.get('/auth/nonce')
    response.assertStatus(200)
    assert.match(response.body().nonce, /^[0-9a-f]{32}$/)
  })

  test('login, me e logout', async ({ client, assert }) => {
    const { account, response } = await signIn(client)
    response.assertStatus(LOGIN_STATUS)
    //#if session=cookie
    const cookie = response.cookie(SESSION_COOKIE.name)
    assert.include(cookie, { httpOnly: true, sameSite: 'Lax', path: '/', maxAge: 86400 })
    //#else
    assert.properties(response.body(), ['token', 'expiresAt'])
    //#endif
    const session = sessionHeaders(response)

    const me = await client.get('/auth/me').headers(session)
    me.assertStatus(200)
    me.assertBody({ address: account.address })

    const logout = await client.post('/auth/logout').headers(session)
    logout.assertStatus(204)
    const afterLogout = await client.get('/auth/me').headers(session)
    afterLogout.assertStatus(401)
  })

  test('nonce já usado é recusado', async ({ client }) => {
    const { message, signature, response } = await signIn(client)
    response.assertStatus(LOGIN_STATUS)

    const replay = await client
      .post('/auth/verify')
      .headers(fromFrontend)
      .json({ message, signature })
    replay.assertStatus(401)
  })

  test('mensagem para outro domínio é recusada', async ({ client }) => {
    const { response } = await signIn(client, { domain: 'evil.example' })
    response.assertStatus(401)
  })

  // Comparar o começo do texto aceitaria esta URI: só a origem inteira vale.
  test('URI com origem parecida é recusada', async ({ client }) => {
    const { response } = await signIn(client, { uri: `${web3Config.siwe.origin}1` })
    response.assertStatus(401)
  })

  test('corpo inválido responde 400: {label}')
    .with([
      { label: 'mensagem acima de 4096 caracteres', message: 'a'.repeat(5000), signature: '0x00' },
      { label: 'assinatura que não é hex', message: 'oi', signature: '0xzz' },
    ])
    .run(async ({ client }, { message, signature }) => {
      const response = await client
        .post('/auth/verify')
        .headers(fromFrontend)
        .json({ message, signature })
      response.assertStatus(400)
    })

  test('sem sessão, GET /auth/me responde 401', async ({ client }) => {
    const response = await client.get('/auth/me')
    response.assertStatus(401)
  })
  //#if session=cookie

  test('POST com Origin de outro site responde 403', async ({ client }) => {
    const response = await client
      .post('/auth/verify')
      .header('origin', 'https://evil.example')
      .json({ message: 'oi', signature: '0x00' })
    response.assertStatus(403)
  })

  test('POST sem Origin responde 403', async ({ client }) => {
    const response = await client.post('/auth/verify').json({ message: 'oi', signature: '0x00' })
    response.assertStatus(403)
  })
  //#endif
})
