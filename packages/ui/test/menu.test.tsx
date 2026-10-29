import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Menu } from '../src/index.js'

describe('Menu', () => {
  it('abre pelo teclado e executa a ação escolhida', async () => {
    const onEdit = vi.fn()
    render(
      <Menu
        label="Ações"
        items={[
          { label: 'Editar', onSelect: onEdit },
          { label: 'Arquivar', disabled: true },
          'separator',
          { label: 'Excluir', tone: 'danger' },
        ]}
      />
    )
    const user = userEvent.setup()
    const trigger = screen.getByRole('button', { name: 'Ações' })
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu')

    trigger.focus()
    await user.keyboard('{Enter}')
    expect(screen.getAllByRole('menuitem')).toHaveLength(3)
    expect(screen.getByRole('menuitem', { name: 'Arquivar' }).getAttribute('aria-disabled')).toBe(
      'true'
    )

    await user.click(screen.getByRole('menuitem', { name: 'Editar' }))
    expect(onEdit).toHaveBeenCalledOnce()
    expect(screen.queryByRole('menu')).toBeNull()
  })

  // Sem valor para indicar que a pessoa já agiu, o halo para na primeira abertura.
  it('tira o halo de atenção depois da primeira abertura', async () => {
    render(<Menu label="Ações" items={[{ label: 'Editar' }]} attention className="ml-2" />)
    const user = userEvent.setup()
    const trigger = screen.getByRole('button', { name: 'Ações' })
    expect(trigger.className).toContain('after:animate-pulse')
    expect(trigger.className).toContain('ml-2')

    await user.click(trigger)
    await user.keyboard('{Escape}')
    expect(trigger.className).not.toContain('after:animate-pulse')
  })
})
