import { cn } from '@devwebdex/ui'
//#if web3=evm
import { WalletLogin } from '@/components/wallet-login'
//#endif

export default function Home() {
  return (
    <main className={cn('mx-auto flex max-w-3xl flex-col gap-md p-md')}>
      <h1 className="font-bold text-2xl">{{name}}</h1>
      <p>
        Projeto gerado pelo <code>@devwebdex/create</code>. Padrões em <code>docs/standards</code>.
      </p>
      //#if web3=evm
      <WalletLogin />
      //#endif
    </main>
  )
}
