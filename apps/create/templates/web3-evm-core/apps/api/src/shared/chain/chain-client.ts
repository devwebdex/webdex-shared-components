import { createPublicClient, http, type PublicClient } from 'viem'
import type { ChainConfig } from './chain-config.js'

/** O que a API usa da rede. Os testes passam um objeto com estes métodos, sem RPC. */
export type ChainClient = Pick<PublicClient, 'verifySiweMessage' | 'readContract'>

/** Um cliente por processo, criado na inicialização. */
export function createChainClient({
  chain,
  rpcUrl,
}: Pick<ChainConfig, 'chain' | 'rpcUrl'>): ChainClient {
  return createPublicClient({ chain, transport: http(rpcUrl) })
}
