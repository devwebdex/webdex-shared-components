import type { Address } from 'viem'
import { describe, expect, it, vi } from 'vitest'
import type { ChainClient } from '../../shared/chain/chain-client.js'
import { ADMIN_ROLE, createAccessService } from './access.service.js'

const contract: Address = '0x1111111111111111111111111111111111111111'
const account: Address = '0xd2135CfB216b74109775236E36d4b433F1DF507B'

function serviceWith(
  readContract: () => Promise<boolean>,
  config: { accessControlAddress: Address | undefined } = { accessControlAddress: contract }
) {
  const client = { readContract: vi.fn(readContract) }
  const service = createAccessService({ client: client as unknown as ChainClient, config })
  return { service, readContract: client.readContract }
}

describe('AccessService', () => {
  it('ADMIN_ROLE é o keccak256 de "ADMIN_ROLE", como no AccessControl', () => {
    expect(ADMIN_ROLE).toBe('0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775')
  })

  it('consulta hasRole no contrato configurado, com o endereço recebido', async () => {
    const { service, readContract } = serviceWith(async () => true)
    await expect(service.hasRole(ADMIN_ROLE, account)).resolves.toBe(true)
    expect(readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: contract,
        functionName: 'hasRole',
        args: [ADMIN_ROLE, account],
      })
    )
  })

  it('nega quando o contrato diz que não', async () => {
    const { service } = serviceWith(async () => false)
    await expect(service.hasRole(ADMIN_ROLE, account)).resolves.toBe(false)
  })

  it('nega sem consultar a rede quando não há contrato configurado', async () => {
    const { service, readContract } = serviceWith(async () => true, {
      accessControlAddress: undefined,
    })
    await expect(service.hasRole(ADMIN_ROLE, account)).resolves.toBe(false)
    expect(readContract).not.toHaveBeenCalled()
  })

  it('nega quando o RPC falha', async () => {
    const { service } = serviceWith(async () => {
      throw new Error('RPC fora do ar')
    })
    await expect(service.hasRole(ADMIN_ROLE, account)).resolves.toBe(false)
  })
})
