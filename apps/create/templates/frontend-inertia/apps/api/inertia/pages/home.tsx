import { cn } from '@devwebdex/ui'
//#if web3=evm
import { WalletLogin } from '~/components/wallet-login'
//#endif

export default function Home() {
  return (
    <main className={cn('mx-auto flex max-w-3xl flex-col gap-4 p-4')}>
      <h1 className="font-bold text-2xl">{{name}}</h1>
      <p>
        Página servida pelo AdonisJS com Inertia e React. Padrões em <code>docs/standards</code>.
      </p>
      //#if web3=evm
      <WalletLogin />
      //#endif
    </main>
  )
}
