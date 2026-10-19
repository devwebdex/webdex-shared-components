import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import { type Address, keccak256, toHex } from 'viem'
import web3Config from '#config/web3'
import { accessControlAbi } from '#modules/access/access_control_abi'
import ChainClient from '#shared/chain_client'

export const ADMIN_ROLE = keccak256(toHex('ADMIN_ROLE'))

/** API pública do módulo access: papéis lidos no contrato a cada decisão, sem cache. */
@inject()
export default class AccessService {
  constructor(private readonly chainClient: ChainClient) {}

  // Falha fechada: sem contrato configurado ou com o RPC fora, ninguém é admin.
  async isAdmin(address: Address) {
    const contract = web3Config.accessControlAddress
    if (!contract) return false
    try {
      return await this.chainClient.readContract({
        address: contract,
        abi: accessControlAbi,
        functionName: 'hasRole',
        args: [ADMIN_ROLE, address],
        // Decisão de acesso: um bloco recente pode ser reorganizado e devolver um papel já revogado.
        blockTag: 'finalized',
      })
    } catch (error) {
      logger.warn({ err: error }, 'leitura de hasRole falhou; acesso negado')
      return false
    }
  }
}
