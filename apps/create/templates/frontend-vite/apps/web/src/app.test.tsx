import { render, screen } from '@testing-library/react'
//#if web3=evm
import { expect, test, vi } from 'vitest'
//#else
import { expect, test } from 'vitest'
//#endif
import { App } from './app'

//#if web3=evm
// A carteira tem teste próprio (components/wallet-login.test.tsx) e precisa dos providers do wagmi.
vi.mock('./components/wallet-login', () => ({ WalletLogin: () => null }))

//#endif
test('a página inicial mostra o nome do projeto', () => {
  render(<App />)
  expect(screen.getByRole('heading', { level: 1, name: '{{name}}' })).toBeDefined()
})
