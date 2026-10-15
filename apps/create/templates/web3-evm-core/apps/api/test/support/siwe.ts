import { type Address, isAddressEqual, recoverMessageAddress } from 'viem'
import type { PrivateKeyAccount } from 'viem/accounts'
import {
  createSiweMessage,
  parseSiweMessage,
  type VerifySiweMessageParameters,
  validateSiweMessage,
} from 'viem/siwe'
import type { ChainClient } from '../../src/shared/chain/chain-client.js'
import type { ChainConfig } from '../../src/shared/chain/chain-config.js'

/**
 * Cliente da rede para os e2e, sem RPC: confere os campos como o viem e recupera o signatário com
 * recoverMessageAddress (só contas comuns). hasRole responde pela lista de admins.
 */
export function offlineChainClient(admins: Address[] = []): ChainClient {
  const client = {
    async verifySiweMessage({ message, signature, domain, nonce }: VerifySiweMessageParameters) {
      const fields = parseSiweMessage(message)
      if (!fields.address || !validateSiweMessage({ message: fields, domain, nonce })) return false
      const signer = await recoverMessageAddress({ message, signature })
      return isAddressEqual(signer, fields.address)
    },
    async readContract({ args }: { args: readonly [unknown, Address] }) {
      return admins.some((admin) => isAddressEqual(admin, args[1]))
    },
  }
  return client as unknown as ChainClient
}

/** Mensagem SIWE assinada pela conta, como o frontend faria; `domain` e `uri` simulam outro site. */
export async function signSiweMessage(
  account: PrivateKeyAccount,
  {
    nonce,
    config,
    domain = new URL(config.siweOrigin).host,
    uri = config.siweOrigin,
  }: {
    nonce: string
    config: Pick<ChainConfig, 'chain' | 'siweOrigin'>
    domain?: string | undefined
    uri?: string | undefined
  }
) {
  const message = createSiweMessage({
    address: account.address,
    chainId: config.chain.id,
    domain,
    nonce,
    uri,
    version: '1',
    issuedAt: new Date(),
    expirationTime: new Date(Date.now() + 5 * 60 * 1000),
  })
  return { message, signature: await account.signMessage({ message }) }
}
