import type { ApplicationService } from '@adonisjs/core/types'
import { createPublicClient, http } from 'viem'
import web3Config from '#config/web3'
import ChainClient from '#shared/chain_client'

export default class Web3Provider {
  constructor(protected app: ApplicationService) {}

  // Um cliente por processo, criado no primeiro uso.
  register() {
    this.app.container.singleton(ChainClient, () =>
      createPublicClient({ chain: web3Config.chain, transport: http(web3Config.rpcUrl) })
    )
  }
}
