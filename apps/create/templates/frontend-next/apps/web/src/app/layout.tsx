import type { Metadata } from 'next'
//#if web3=evm
import { Web3Provider } from '@/components/web3-provider'
//#endif
import './globals.css'

export const metadata: Metadata = {
  title: '{{name}}',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-background font-sans text-text-primary antialiased">
        //#if web3=evm
        <Web3Provider>{children}</Web3Provider>
        //#else
        {children}
        //#endif
      </body>
    </html>
  )
}
