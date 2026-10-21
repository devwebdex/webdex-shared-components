import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Combobox, type ComboboxOption } from '../src/index.js'

const networks: ComboboxOption[] = [
  { value: 'polygon', label: 'Polygon', keywords: ['matic'] },
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'arbitrum', label: 'Arbitrum One' },
  { value: 'arbitrum-nova', label: 'Arbitrum Nova' },
]

function setup(onValueChange = vi.fn()) {
  render(
    <form aria-label="formulário">
      <Combobox
        options={networks}
        placeholder="Escolha a rede"
        searchPlaceholder="Buscar rede"
        emptyMessage="Nenhuma rede encontrada."
        aria-label="Rede"
        name="rede"
        onValueChange={onValueChange}
      />
    </form>
  )
  return { user: userEvent.setup(), trigger: screen.getByRole('combobox', { name: 'Rede' }) }
}

describe('Combobox', () => {
  it('filtra pela busca e escolhe com Enter', async () => {
    const onValueChange = vi.fn()
    const { user, trigger } = setup(onValueChange)
    await user.click(trigger)
    await user.keyboard('arb')

    const names = screen.getAllByRole('option').map((option) => option.textContent)
    expect(names).toEqual(['Arbitrum One', 'Arbitrum Nova'])

    await user.keyboard('{Enter}')
    expect(onValueChange).toHaveBeenCalledWith('arbitrum')
    expect(trigger.textContent).toContain('Arbitrum One')
    expect(trigger.hasAttribute('data-placeholder')).toBe(false)
  })

  it('acha pelas keywords e envia o valor no formulário', async () => {
    const { user, trigger } = setup()
    await user.click(trigger)
    await user.keyboard('matic{Enter}')
    const form = screen.getByRole('form', { name: 'formulário' }) as HTMLFormElement
    expect(new FormData(form).get('rede')).toBe('polygon')
  })

  it('avisa quando a busca não encontra nada', async () => {
    const { user, trigger } = setup()
    await user.click(trigger)
    await user.keyboard('solana')
    expect(screen.getByText('Nenhuma rede encontrada.')).toBeTruthy()
    expect(screen.queryAllByRole('option')).toHaveLength(0)
  })
})
