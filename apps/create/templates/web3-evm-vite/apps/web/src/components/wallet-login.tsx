import { cn } from '@devwebdex/ui'
//#if backend!=none
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
//#endif
import { type ReactNode, useSyncExternalStore } from 'react'
//#if backend!=none
import type { Address, Chain } from 'viem'
import { createSiweMessage } from 'viem/siwe'
import {
  type Connector,
  useChains,
  useConnect,
  useConnection,
  useConnectors,
  useDisconnect,
  useSignMessage,
  useSwitchChain,
} from 'wagmi'
import { ApiError, authApi } from '../lib/web3'
//#else
import type { Chain } from 'viem'
import {
  type Connector,
  useChains,
  useConnect,
  useConnection,
  useConnectors,
  useDisconnect,
  useSwitchChain,
} from 'wagmi'
//#endif

const button =
  'rounded-md px-md py-md font-bold focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:opacity-50'
const primaryButton = cn(button, 'bg-primary text-on-primary')
const secondaryButton = cn(button, 'border border-primary text-primary')
//#if backend!=none

const sessionKey = ['auth', 'session'] as const
// A API recusa mensagem SIWE com validade acima de 10 minutos.
const SIGN_IN_TTL_MS = 5 * 60 * 1000
//#endif

/** Conexão de carteira (wagmi) e login SIWE, com o estado anunciado a leitores de tela. */
export function WalletLogin() {
  const hydrated = useHydrated()
  const connection = useConnection()
  const [chain] = useChains()
  //#if backend!=none
  const session = useQuery({
    queryKey: sessionKey,
    queryFn: () => authApi.me(),
    enabled: hydrated,
    retry: false,
  })
  //#endif

  let status: string
  let actions: ReactNode = null
  if (!hydrated) {
    status = 'Procurando carteiras…'
  } else if (connection.status === 'reconnecting') {
    status = 'Reconectando à carteira…'
  } else if (connection.status !== 'connected') {
    status =
      connection.status === 'connecting' ? 'Aguardando a carteira…' : 'Nenhuma carteira conectada.'
    actions = <ConnectWallet />
  } else if (connection.chainId !== chain.id) {
    status = `Rede errada: troque a carteira para ${chain.name} para continuar.`
    actions = <SwitchNetwork chain={chain} />
    //#if backend!=none
  } else if (session.isPending) {
    status = 'Verificando a sessão…'
  } else if (session.data?.address === connection.address) {
    status = `Conectado como ${connection.address}.`
    actions = <SignOut />
  } else {
    status = `Carteira ${connection.address} conectada na ${chain.name}. Entre para criar a sessão.`
    actions = <SignIn address={connection.address} chain={chain} />
  }
  //#else
  } else {
    status = `Carteira ${connection.address} conectada na ${chain.name}.`
    actions = <DisconnectButton />
  }
  //#endif

  return (
    <section
      aria-labelledby="wallet-title"
      className="flex flex-col gap-md rounded-md border border-primary p-md"
    >
      <h2 id="wallet-title" className="font-bold text-xl">
        Carteira
      </h2>
      <p role="status" className="break-all">
        {status}
      </p>
      {actions}
      //#if backend!=none
      <ErrorMessage error={session.error} />
      //#endif
    </section>
  )
}

function ConnectWallet() {
  const connectors = useConnectors()
  const connect = useConnect()
  return (
    <>
      <ul aria-label="Carteiras encontradas" className="flex flex-wrap gap-md">
        {walletOptions(connectors).map((connector) => (
          <li key={connector.uid}>
            <button
              type="button"
              className={primaryButton}
              disabled={connect.isPending}
              onClick={() => connect.mutate({ connector })}
            >
              Conectar {walletName(connector)}
            </button>
          </li>
        ))}
      </ul>
      <ErrorMessage error={connect.error} />
    </>
  )
}

function SwitchNetwork({ chain }: { chain: Chain }) {
  const switchChain = useSwitchChain()
  return (
    <>
      <div className="flex flex-wrap gap-md">
        <button
          type="button"
          className={primaryButton}
          disabled={switchChain.isPending}
          onClick={() => switchChain.mutate({ chainId: chain.id })}
        >
          Trocar para {chain.name}
        </button>
        <DisconnectButton />
      </div>
      <ErrorMessage error={switchChain.error} />
    </>
  )
}

function DisconnectButton() {
  const disconnect = useDisconnect()
  return (
    <button
      type="button"
      className={secondaryButton}
      disabled={disconnect.isPending}
      onClick={() => disconnect.mutate()}
    >
      Desconectar
    </button>
  )
}
//#if backend!=none

function SignIn({ address, chain }: { address: Address; chain: Chain }) {
  const queryClient = useQueryClient()
  const signMessage = useSignMessage()
  const login = useMutation({
    mutationFn: async () => {
      const nonce = await authApi.nonce()
      const issuedAt = new Date()
      const message = createSiweMessage({
        domain: window.location.host,
        uri: window.location.origin,
        address,
        chainId: chain.id,
        nonce,
        issuedAt,
        expirationTime: new Date(issuedAt.getTime() + SIGN_IN_TTL_MS),
        statement: 'Entrar no {{name}} com esta carteira.',
        version: '1',
      })
      const signature = await signMessage.mutateAsync({ message, account: address })
      await authApi.verify(message, signature)
      return authApi.me()
    },
    onSuccess: (session) => queryClient.setQueryData(sessionKey, session),
  })
  return (
    <>
      <div className="flex flex-wrap gap-md">
        <button
          type="button"
          className={primaryButton}
          disabled={login.isPending}
          onClick={() => login.mutate()}
        >
          {login.isPending ? 'Assinando…' : 'Entrar com a carteira'}
        </button>
        <DisconnectButton />
      </div>
      <ErrorMessage error={login.error} />
    </>
  )
}

function SignOut() {
  const queryClient = useQueryClient()
  const disconnect = useDisconnect()
  const logout = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.setQueryData(sessionKey, null)
      disconnect.mutate()
    },
  })
  return (
    <>
      <div className="flex flex-wrap gap-md">
        <button
          type="button"
          className={secondaryButton}
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          Sair
        </button>
      </div>
      <ErrorMessage error={logout.error} />
    </>
  )
}
//#endif

function ErrorMessage({ error }: { error: Error | null }) {
  if (!error) return null
  return (
    <p role="alert" className="font-bold">
      {describeError(error)}
    </p>
  )
}

function describeError(error: Error): string {
  //#if backend!=none
  if (error instanceof ApiError) return error.message
  //#endif
  if (causedBy(error, 'UserRejectedRequestError')) return 'Pedido recusado na carteira.'
  if (causedBy(error, 'ProviderNotFoundError')) {
    return 'Nenhuma carteira no navegador. Instale ou desbloqueie uma, ou use outra opção.'
  }
  return 'Algo deu errado. Tente de novo.'
}

function causedBy(error: unknown, name: string): boolean {
  for (let current = error; current instanceof Error; current = current.cause) {
    if (current.name === name) return true
  }
  return false
}

// O injected genérico cobre carteira sem EIP-6963; havendo carteira descoberta, ele só a duplicaria.
function walletOptions(connectors: readonly Connector[]): readonly Connector[] {
  const discovered = connectors.some(({ type, id }) => type === 'injected' && id !== 'injected')
  return discovered ? connectors.filter(({ id }) => id !== 'injected') : connectors
}

function walletName(connector: Connector): string {
  return connector.id === 'injected' ? 'carteira do navegador' : connector.name
}

const subscribeNothing = () => () => {}

// Falso na renderização no servidor e na hidratação, verdadeiro depois: as carteiras (EIP-6963) só
// existem no navegador, e mostrá-las já na hidratação faria o HTML do servidor divergir do cliente.
function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false
  )
}
