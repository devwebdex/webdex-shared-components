import { cn } from '@devwebdex/ui'

export default function Home() {
  return (
    <main className={cn('mx-auto flex max-w-3xl flex-col gap-md p-md')}>
      <h1 className="font-bold text-2xl">{{name}}</h1>
      <p>
        Página servida pelo AdonisJS com Inertia e React. Padrões em <code>docs/standards</code>.
      </p>
    </main>
  )
}
