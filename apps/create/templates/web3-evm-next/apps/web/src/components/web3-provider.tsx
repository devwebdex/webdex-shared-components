'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { createWagmiConfig } from '@/lib/web3'

/** Carteira (wagmi) e cache de dados (React Query) para os componentes cliente. */
export function Web3Provider({ children }: { children: ReactNode }) {
  // Um config e um cache por navegador: criados uma vez, nunca compartilhados entre requisições.
  const [config] = useState(createWagmiConfig)
  const [queryClient] = useState(() => new QueryClient())
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
