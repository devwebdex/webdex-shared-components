import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '{{name}}',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-surface font-sans text-on-surface antialiased">
        {children}
      </body>
    </html>
  )
}
