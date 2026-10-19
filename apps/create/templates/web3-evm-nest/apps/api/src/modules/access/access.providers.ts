import type { FactoryProvider } from '@nestjs/common'
import { CHAIN_CLIENT, CHAIN_CONFIG } from '../../shared/chain/chain.module.js'
import type { ChainClient } from '../../shared/chain/chain-client.js'
import type { ChainConfig } from '../../shared/chain/chain-config.js'
import { type AccessService, createAccessService } from './access.service.js'

export const ACCESS_SERVICE = Symbol('AccessService')

export const accessServiceProvider: FactoryProvider<AccessService> = {
  provide: ACCESS_SERVICE,
  inject: [CHAIN_CLIENT, CHAIN_CONFIG],
  useFactory: (client: ChainClient, config: ChainConfig) => createAccessService({ client, config }),
}
