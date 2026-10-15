import type { PublicClient } from 'viem'

/**
 * Cliente da rede como token do container: providers/web3_provider.ts liga ao cliente do viem, e os
 * testes trocam por um falso com app.container.swap. Declara só o que os módulos usam.
 */
export default abstract class ChainClient {
  abstract verifySiweMessage: PublicClient['verifySiweMessage']
  abstract readContract: PublicClient['readContract']
}
