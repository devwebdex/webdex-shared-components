import { type Address, type Hex, keccak256, toHex } from 'viem'
import type { ChainClient } from '../../shared/chain/chain-client.js'
import type { ChainConfig } from '../../shared/chain/chain-config.js'
import { accessControlAbi } from './access-control.abi.js'

export const ADMIN_ROLE = keccak256(toHex('ADMIN_ROLE'))

export type AccessServiceDependencies = {
  client: ChainClient
  config: Pick<ChainConfig, 'accessControlAddress'>
}

/** Acesso decidido pelo contrato, lido a cada decisão; o endereço vem sempre da sessão. */
export function createAccessService({ client, config }: AccessServiceDependencies) {
  return {
    /** Falha fechada: sem contrato configurado ou com o RPC fora do ar, nega. */
    async hasRole(role: Hex, account: Address) {
      const contract = config.accessControlAddress
      if (!contract) return false
      try {
        return await client.readContract({
          address: contract,
          abi: accessControlAbi,
          functionName: 'hasRole',
          args: [role, account],
          // Papel administrativo: só vale o que não pode mais ser desfeito por reorganização.
          blockTag: 'finalized',
        })
      } catch {
        return false
      }
    },
  }
}

export type AccessService = ReturnType<typeof createAccessService>
