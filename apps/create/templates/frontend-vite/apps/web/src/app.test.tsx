import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { App } from './app'

test('a página inicial mostra o nome do projeto', () => {
  render(<App />)
  expect(screen.getByRole('heading', { level: 1, name: '{{name}}' })).toBeDefined()
})
