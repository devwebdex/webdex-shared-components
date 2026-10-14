import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import Home from './page'

test('a página inicial mostra o nome do projeto', () => {
  render(<Home />)
  expect(screen.getByRole('heading', { level: 1, name: '{{name}}' })).toBeDefined()
})
