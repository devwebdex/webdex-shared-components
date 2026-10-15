import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import ChainClient from '#shared/chain_client'
import { offlineChainClient, sessionHeaders, signIn } from '#tests/helpers/siwe'

test.group('GET /access/admin (banco real)', (group) => {
  group.setup(() => {
    app.container.swap(ChainClient, () => offlineChainClient)
    return () => app.container.restore(ChainClient)
  })
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('sem sessão responde 401', async ({ client }) => {
    const response = await client.get('/access/admin')
    response.assertStatus(401)
  })

  // Sem contrato configurado ou sem rede (o cliente dos testes não tem RPC), o acesso é negado.
  test('sem confirmar o papel no contrato responde 403', async ({ client }) => {
    const { response } = await signIn(client)
    const admin = await client.get('/access/admin').headers(sessionHeaders(response))
    admin.assertStatus(403)
  })
})
