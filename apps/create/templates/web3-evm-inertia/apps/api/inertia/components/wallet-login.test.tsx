import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { polygon, polygonAmoy } from 'viem/chains'
import { afterEach, expect, test, vi } from 'vitest'
import { createConfig, http, WagmiProvider } from 'wagmi'
import { switchChain } from 'wagmi/actions'
import { mock } from 'wagmi/connectors/mock'
import { WalletLogin } from './wallet-login'

const address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
const api = ''

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

// O componente usa a primeira rede do config (polygonAmoy); a segunda serve para testar a rede errada.
function renderWallet() {
  const config = createConfig({
    chains: [polygonAmoy, polygon],
    connectors: [mock({ accounts: [address] })],
    transports: { [polygonAmoy.id]: http(), [polygon.id]: http() },
    multiInjectedProviderDiscovery: false,
  })
  render(
    <WagmiProvider config={config}>
      <QueryClientProvider client={new QueryClient()}>
        <WalletLogin />
      </QueryClientProvider>
    </WagmiProvider>
  )
  return config
}

async function connect() {
  fireEvent.click(await screen.findByRole('button', { name: 'Conectar Mock Connector' }))
}

test('lista as carteiras e conecta', async () => {
  stubApi()
  renderWallet()
  expect(await screen.findByText('Nenhuma carteira conectada.')).toBeDefined()
  await connect()
  expect(await screen.findByRole('button', { name: 'Entrar com a carteira' })).toBeDefined()
  expect(screen.getByRole('status').textContent).toContain(address)
})

test('na rede errada, bloqueia a ação e pede a troca', async () => {
  stubApi()
  const config = renderWallet()
  await connect()
  await screen.findByRole('button', { name: 'Entrar com a carteira' })
  await act(() => switchChain(config, { chainId: polygon.id }))
  expect(await screen.findByText(/Rede errada/)).toBeDefined()
  expect(screen.queryByRole('button', { name: 'Entrar com a carteira' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Trocar para Polygon Amoy' }))
  expect(await screen.findByText(/conectada na Polygon Amoy/)).toBeDefined()
})

test('login SIWE: nonce, assinatura, verify, me e logout', async () => {
  const fetchMock = stubApi()
  renderWallet()
  await connect()
  fireEvent.click(await screen.findByRole('button', { name: 'Entrar com a carteira' }))
  expect(await screen.findByText(`Conectado como ${address}.`)).toBeDefined()

  const verify = fetchMock.mock.calls.find(([url]) => url === `${api}/auth/verify`)
  const { message } = JSON.parse(String(verify?.[1]?.body)) as { message: string }
  expect(message).toContain('localhost:3000 wants you to sign in')
  expect(message).toContain('Chain ID: 80002')
  expect(message).toContain(`Nonce: ${'a'.repeat(32)}`)
  // Cookie de sessão: toda chamada à API leva credentials: 'include'.
  for (const [url, init] of fetchMock.mock.calls) {
    if (url.startsWith(`${api}/auth/`)) expect(init?.credentials).toBe('include')
  }

  fireEvent.click(screen.getByRole('button', { name: 'Sair' }))
  expect(await screen.findByText('Nenhuma carteira conectada.')).toBeDefined()
  expect(fetchMock.mock.calls.some(([url]) => url === `${api}/auth/logout`)).toBe(true)
})

test('login recusado pela API mostra o erro', async () => {
  stubApi({ verifyStatus: 401 })
  renderWallet()
  await connect()
  fireEvent.click(await screen.findByRole('button', { name: 'Entrar com a carteira' }))
  expect((await screen.findByRole('alert')).textContent).toMatch(/Login recusado/)
})

/** API de login e RPC (o conector mock assina pela RPC da rede) simulados no fetch. */
function stubApi({ verifyStatus = 0 } = {}) {
  let loggedIn = false
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === `${api}/auth/nonce`) return Response.json({ nonce: 'a'.repeat(32) })
    if (url === `${api}/auth/verify`) {
      if (verifyStatus) return new Response(null, { status: verifyStatus })
      loggedIn = true
      return new Response(null, { status: 204 })
    }
    if (url === `${api}/auth/me`) {
      return loggedIn ? Response.json({ address }) : new Response(null, { status: 401 })
    }
    if (url === `${api}/auth/logout`) {
      loggedIn = false
      return new Response(null, { status: 204 })
    }
    const { id } = JSON.parse(String(init?.body)) as { id: number }
    return Response.json({ jsonrpc: '2.0', id, result: `0x${'11'.repeat(65)}` })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}
