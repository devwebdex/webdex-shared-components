import { type Address, type Chain, getAddress, isAddress } from 'viem'
import { polygon, polygonAmoy } from 'viem/chains'

// Único arquivo que escolhe a rede: nenhum outro importa a chain nem escreve o chainId.
const chains = new Map<string, Chain>([
  ['polygon', polygon],
  ['polygonAmoy', polygonAmoy],
])

export type ChainConfig = {
  chain: Chain
  rpcUrl: string
  /** Origem do frontend que pede a assinatura SIWE (domínio e URI da mensagem saem dela). */
  siweOrigin: string
  /** Contrato AccessControl com os papéis; sem ele, todo papel é negado. */
  accessControlAddress: Address | undefined
}

/** Lê a configuração na inicialização (não no import): os testes unitários não precisam do ambiente. */
export function loadChainConfig(): ChainConfig {
  const name = required('CHAIN')
  const chain = chains.get(name)
  if (!chain) throw new Error(`CHAIN inválida: ${name} (use ${[...chains.keys()].join(' ou ')})`)
  return {
    chain,
    rpcUrl: required('RPC_URL'),
    siweOrigin: new URL(required('SIWE_ORIGIN')).origin,
    accessControlAddress: optionalAddress('ACCESS_CONTROL_ADDRESS'),
  }
}

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Variável de ambiente obrigatória ausente: ${name}`)
  return value
}

function optionalAddress(name: string): Address | undefined {
  const value = process.env[name]
  if (!value) return undefined
  if (!isAddress(value, { strict: false })) throw new Error(`${name} não é um endereço: ${value}`)
  return getAddress(value)
}
