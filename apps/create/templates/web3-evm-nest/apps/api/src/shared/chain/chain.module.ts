import { Module } from '@nestjs/common'
import { createChainClient } from './chain-client.js'
import { type ChainConfig, loadChainConfig } from './chain-config.js'

// Tokens de injeção: ChainConfig e ChainClient são tipos, não classes.
export const CHAIN_CONFIG = Symbol('ChainConfig')
export const CHAIN_CLIENT = Symbol('ChainClient')

// Um cliente por processo (o Nest instancia o módulo uma vez). Os testes trocam o CHAIN_CLIENT por
// um cliente falso com overrideProvider.
@Module({
  providers: [
    { provide: CHAIN_CONFIG, useFactory: loadChainConfig },
    {
      provide: CHAIN_CLIENT,
      inject: [CHAIN_CONFIG],
      useFactory: (config: ChainConfig) => createChainClient(config),
    },
  ],
  exports: [CHAIN_CONFIG, CHAIN_CLIENT],
})
export class ChainModule {}
