import { test } from '@japa/runner'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import web3Config from '#config/web3'
import AccessService, { ADMIN_ROLE } from '#modules/access/access_service'
import type ChainClient from '#shared/chain_client'

const user = privateKeyToAccount(generatePrivateKey()).address
const contract = privateKeyToAccount(generatePrivateKey()).address

function serviceWith(readContract: (params: { args: unknown[] }) => Promise<boolean>) {
  const calls: { args: unknown[] }[] = []
  const client = {
    readContract(params: { args: unknown[] }) {
      calls.push(params)
      return readContract(params)
    },
  } as unknown as ChainClient
  return { service: new AccessService(client), calls }
}

test.group('AccessService', (group) => {
  const configured = web3Config.accessControlAddress
  group.each.setup(() => {
    web3Config.accessControlAddress = contract
    return () => {
      web3Config.accessControlAddress = configured
    }
  })

  test('libera quem tem ADMIN_ROLE no contrato', async ({ assert }) => {
    const { service, calls } = serviceWith(async () => true)
    assert.isTrue(await service.isAdmin(user))
    assert.deepEqual(calls[0]?.args, [ADMIN_ROLE, user])
  })

  test('nega quem não tem o papel', async ({ assert }) => {
    const { service } = serviceWith(async () => false)
    assert.isFalse(await service.isAdmin(user))
  })

  test('nega quando o RPC falha', async ({ assert }) => {
    const { service } = serviceWith(async () => {
      throw new Error('RPC fora do ar')
    })
    assert.isFalse(await service.isAdmin(user))
  })

  test('nega sem contrato configurado, sem consultar a rede', async ({ assert }) => {
    web3Config.accessControlAddress = undefined
    const { service, calls } = serviceWith(async () => true)
    assert.isFalse(await service.isAdmin(user))
    assert.lengthOf(calls, 0)
  })
})
