import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Select, type SelectOption } from '../src/index.js'

const networks: SelectOption[] = [
  { value: 'polygon', label: 'Polygon' },
  { value: 'amoy', label: 'Polygon Amoy' },
  { value: 'avalanche', label: 'Avalanche', disabled: true },
]

function setup(onValueChange = vi.fn()) {
  render(
    <Select
      options={networks}
      placeholder="Escolha a rede"
      aria-label="Rede"
      onValueChange={onValueChange}
      attention
    />
  )
  return { user: userEvent.setup(), trigger: screen.getByRole('combobox', { name: 'Rede' }) }
}

describe('Select', () => {
  it('abre pelo teclado e escolhe com as setas e Enter', async () => {
    const onValueChange = vi.fn()
    const { user, trigger } = setup(onValueChange)
    trigger.focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('listbox')).toBeTruthy()

    await user.keyboard('{ArrowDown}{Enter}')
    expect(onValueChange).toHaveBeenCalledWith('amoy')
    expect(trigger.textContent).toContain('Polygon Amoy')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('marca a opção desabilitada para leitor de tela', async () => {
    const { user, trigger } = setup()
    await user.click(trigger)
    const option = screen.getByRole('option', { name: 'Avalanche', hidden: true })
    expect(option.getAttribute('aria-disabled')).toBe('true')
  })

  // O halo de atenção depende de data-placeholder: some quando o campo ganha um valor.
  it('tira o data-placeholder depois da escolha', async () => {
    const { user, trigger } = setup()
    expect(trigger.hasAttribute('data-placeholder')).toBe(true)
    await user.click(trigger)
    await user.click(screen.getByRole('option', { name: 'Polygon' }))
    expect(trigger.hasAttribute('data-placeholder')).toBe(false)
  })
})
