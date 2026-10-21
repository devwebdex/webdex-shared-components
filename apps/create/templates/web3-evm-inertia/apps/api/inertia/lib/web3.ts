import type { Address, Chain, Hex } from 'viem'
import { polygon, polygonAmoy } from 'viem/chains'
import { createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors/injected'
import { walletConnect } from 'wagmi/connectors/walletConnect'

// Único arquivo que escolhe a rede: nenhum outro importa a chain nem escreve o chainId.
const chains: Record<string, Chain> = { polygon, polygonAmoy }

/** Config do wagmi: só a rede do ambiente, injected com descoberta EIP-6963 e WalletConnect se houver projectId. */
export function createWagmiConfig() {
  const chainName = required('VITE_CHAIN', import.meta.env.VITE_CHAIN)
  const chain = Object.hasOwn(chains, chainName) ? chains[chainName] : undefined
  if (!chain) {
    throw new Error(`VITE_CHAIN inválida: ${chainName} (use ${Object.keys(chains).join(' ou ')})`)
  }
  const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID
  return createConfig({
    chains: [chain],
    transports: {
      [chain.id]: http(required('VITE_RPC_URL', import.meta.env.VITE_RPC_URL)),
    },
    connectors: projectId ? [injected(), walletConnect({ projectId })] : [injected()],
  })
}

// O Vite só embute VITE_* escritas por extenso (import.meta.env.NOME): por isso o valor vem do chamador.
function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Variável de ambiente ausente: ${name} (veja apps/api/.env.example)`)
  return value
}

/** Erro da API de login, com mensagem curta para a interface. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** Cliente das rotas /auth da API (contrato em docs/standards/web3.md). */
export const authApi = {
  async nonce(): Promise<string> {
    const response = await request('/auth/nonce')
    return ((await response.json()) as { nonce: string }).nonce
  },

  async verify(message: string, signature: Hex): Promise<void> {
    await request('/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, signature }),
    })
  },

  /** Sessão atual, ou null sem sessão. */
  async me(): Promise<{ address: Address } | null> {
    try {
      const response = await request('/auth/me')
      return (await response.json()) as { address: Address }
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) throw error
      return null
    }
  },

  async logout(): Promise<void> {
    await request('/auth/logout', { method: 'POST' })
  },
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  let response: Response
  try {
    // Mesma origem: as rotas /auth são do próprio AdonisJS que serve as páginas.
    response = await fetch(path, { ...init, credentials: 'include' })
  } catch {
    throw new ApiError(0, 'Sem resposta do servidor. Confira se ele está no ar.')
  }
  if (!response.ok) throw new ApiError(response.status, messageFor(response.status))
  return response
}

function messageFor(status: number): string {
  if (status === 401) return 'Login recusado: assinatura, rede ou validade inválida.'
  if (status === 403) return 'A API recusou esta origem. Confira SIWE_ORIGIN no .env.'
  return `A API respondeu ${status}. Tente de novo.`
}
