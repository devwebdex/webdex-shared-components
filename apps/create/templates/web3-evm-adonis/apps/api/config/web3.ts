import { getAddress, isAddress } from 'viem'
import { polygon, polygonAmoy } from 'viem/chains'
import env from '#start/env'

// Único arquivo que resolve a rede: o resto do código usa web3Config.chain, nunca o chainId escrito.
const chains = { polygon, polygonAmoy }

const accessControlAddress = env.get('ACCESS_CONTROL_ADDRESS')
if (accessControlAddress && !isAddress(accessControlAddress, { strict: false })) {
  throw new Error('ACCESS_CONTROL_ADDRESS não é um endereço EVM válido')
}

const siweOrigin = new URL(env.get('SIWE_ORIGIN'))

const web3Config = {
  chain: chains[env.get('CHAIN')],
  rpcUrl: env.get('RPC_URL'),
  // A mensagem SIWE e o Origin das requisições com cookie precisam bater com a origem do frontend.
  siwe: { origin: siweOrigin.origin, domain: siweOrigin.host },
  // Vazio nega todo acesso por papel.
  accessControlAddress: accessControlAddress ? getAddress(accessControlAddress) : undefined,
}

export default web3Config
