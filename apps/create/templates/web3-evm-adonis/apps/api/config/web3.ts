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
//#if session=jwt

// Segredo curto cai por força bruta offline a partir de qualquer JWT emitido.
const jwtSecret = env.get('JWT_SECRET').release()
if (Buffer.byteLength(jwtSecret) < 32) {
  throw new Error('JWT_SECRET precisa de pelo menos 32 bytes')
}
//#endif

const web3Config = {
  chain: chains[env.get('CHAIN')],
  rpcUrl: env.get('RPC_URL'),
  // A mensagem SIWE e o Origin das requisições com cookie precisam bater com a origem do frontend.
  siwe: { origin: siweOrigin.origin, domain: siweOrigin.host },
  // Vazio nega todo acesso por papel.
  accessControlAddress: accessControlAddress ? getAddress(accessControlAddress) : undefined,
  //#if session=jwt
  // Chave do HS256 dos JWTs de sessão; iss e aud dos tokens são siwe.origin.
  jwtSecret: new TextEncoder().encode(jwtSecret),
  //#endif
}

export default web3Config
