import { render, screen } from '@testing-library/react'
import { PointerEventsCheckLevel, userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button, Drawer, DrawerClose, TextField } from '../src/index.js'

// Com a gaveta aberta, o Radix põe `pointer-events: none` no body, e o user-event se recusa a
// clicar ali. O clique fora é justamente o que se quer testar, então a checagem sai -- num
// elemento novo, pelo mesmo motivo explicado em modal.test.tsx.
async function outsideClick() {
  const outside = document.createElement('div')
  document.body.append(outside)
  try {
    await userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never }).click(outside)
  } finally {
    outside.remove()
  }
}

describe('Drawer', () => {
  it('abre pelo gatilho com título, descrição, conteúdo e footer, e fecha pelo X', async () => {
    render(
      <Drawer
        trigger={<Button>Detalhes</Button>}
        title="Ordem #4821"
        description="Compra executada pelo bot."
        footer={
          <DrawerClose>
            <Button>Entendi</Button>
          </DrawerClose>
        }
      >
        Par: POL/USDT
      </Drawer>
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Detalhes' }))

    const drawer = screen.getByRole('dialog', { name: 'Ordem #4821' })
    expect(screen.getByText('Compra executada pelo bot.').id).toBe(
      drawer.getAttribute('aria-describedby')
    )
    expect(drawer.textContent).toContain('Par: POL/USDT')

    await user.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('fecha com Esc e devolve o foco ao gatilho', async () => {
    const onOpenChange = vi.fn()
    render(
      <Drawer trigger={<Button>Filtros</Button>} title="Filtros" onOpenChange={onOpenChange} />
    )
    const user = userEvent.setup()
    const trigger = screen.getByRole('button', { name: 'Filtros' })
    await user.click(trigger)
    expect(screen.getByRole('dialog')).toBeTruthy()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(document.activeElement).toBe(trigger)
  })

  it('fecha com clique fora', async () => {
    render(<Drawer defaultOpen title="Filtros" />)
    await outsideClick()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('fecha pelo botão do footer envolvido em DrawerClose', async () => {
    const onOpenChange = vi.fn()
    render(
      <Drawer
        defaultOpen
        title="Filtros"
        onOpenChange={onOpenChange}
        footer={
          <DrawerClose>
            <Button variant="outlined" color="code">
              Cancelar
            </Button>
          </DrawerClose>
        }
      />
    )
    await userEvent.setup().click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  it('prende o foco e esconde o resto da página do leitor de tela', async () => {
    render(
      <>
        <Button>Fora da gaveta</Button>
        <Drawer defaultOpen title="Filtros">
          <TextField label="Par" />
        </Drawer>
      </>
    )
    const drawer = screen.getByRole('dialog', { name: 'Filtros' })
    expect(drawer.contains(document.activeElement)).toBe(true)
    // O Radix põe aria-hidden no resto da página: o leitor de tela só enxerga a gaveta.
    expect(screen.queryByRole('button', { name: 'Fora da gaveta' })).toBeNull()

    // Mais Tabs do que há elementos focáveis: o foco dá a volta, mas não sai da gaveta.
    const user = userEvent.setup()
    for (let step = 0; step < 6; step++) {
      await user.tab()
      expect(drawer.contains(document.activeElement)).toBe(true)
    }
  })

  it('abre do lado e no tamanho pedidos, e esconde o X com hideClose', () => {
    const { unmount } = render(<Drawer open title="Padrão" />)
    const standard = screen.getByRole('dialog', { name: 'Padrão' })
    expect(standard.className).toContain('right-0')
    expect(standard.className).toContain('max-w-[560px]')
    unmount()

    render(<Drawer open side="left" size="lg" hideClose title="Esquerda" />)
    const left = screen.getByRole('dialog', { name: 'Esquerda' })
    expect(left.className).toContain('left-0')
    expect(left.className).toContain('max-w-[800px]')
    expect(screen.queryByRole('button', { name: 'Fechar' })).toBeNull()
  })
})
