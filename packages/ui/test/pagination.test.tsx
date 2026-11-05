import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Pagination } from '../src/index.js'

/** O que aparece na lista, na ordem: números e reticências (as setas não têm texto). */
function visibleItems() {
  const nav = screen.getByRole('navigation', { name: 'Paginação' })
  return [...nav.querySelectorAll('li')].map((li) => li.textContent).filter(Boolean)
}

function currentPage() {
  return screen.getAllByRole('button').find((button) => button.getAttribute('aria-current'))
}

describe('Pagination', () => {
  it('mostra as pontas, a atual com as vizinhas e reticências no meio', () => {
    render(<Pagination count={20} defaultPage={10} />)
    expect(visibleItems()).toEqual(['1', '…', '9', '10', '11', '…', '20'])
    expect(currentPage()?.getAttribute('aria-label')).toBe('Página 10')
    expect(currentPage()?.getAttribute('aria-current')).toBe('page')
  })

  // A reticência que esconderia uma página só vira a página: o total de itens fica em 7.
  it('perto das pontas, troca a reticência pelas páginas', () => {
    const { unmount } = render(<Pagination count={20} defaultPage={1} />)
    expect(visibleItems()).toEqual(['1', '2', '3', '4', '5', '…', '20'])
    unmount()

    render(<Pagination count={20} defaultPage={20} />)
    expect(visibleItems()).toEqual(['1', '…', '16', '17', '18', '19', '20'])
  })

  it('com poucas páginas, mostra todas, sem reticência', () => {
    render(<Pagination count={5} />)
    expect(visibleItems()).toEqual(['1', '2', '3', '4', '5'])
  })

  it('anterior e próximo andam uma página e desabilitam nas pontas', async () => {
    const onPageChange = vi.fn()
    render(<Pagination count={3} onPageChange={onPageChange} />)
    const user = userEvent.setup()
    const previous = screen.getByRole('button', { name: 'Página anterior' })
    const next = screen.getByRole('button', { name: 'Próxima página' })
    expect(previous).toHaveProperty('disabled', true)

    await user.click(next)
    expect(onPageChange).toHaveBeenLastCalledWith(2)
    expect(currentPage()?.textContent).toBe('2')
    expect(previous).toHaveProperty('disabled', false)

    await user.click(next)
    expect(onPageChange).toHaveBeenLastCalledWith(3)
    expect(next).toHaveProperty('disabled', true)
  })

  it('controlado: avisa a escolha e espera quem controla mudar a página', async () => {
    const onPageChange = vi.fn()
    render(<Pagination count={10} page={3} onPageChange={onPageChange} />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Página 5' }))
    expect(onPageChange).toHaveBeenCalledWith(5)
    expect(currentPage()?.textContent).toBe('3')
  })

  it('clicar na página atual não chama o onPageChange', async () => {
    const onPageChange = vi.fn()
    render(<Pagination count={10} defaultPage={4} onPageChange={onPageChange} />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Página 4' }))
    expect(onPageChange).not.toHaveBeenCalled()
  })

  // Na página 1 a seta de anterior está desabilitada, então o Tab pula ela.
  it('funciona pelo teclado: Tab até a página e Enter', async () => {
    const onPageChange = vi.fn()
    render(<Pagination count={5} onPageChange={onPageChange} />)
    const user = userEvent.setup()
    await user.tab()
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Página 1')
    await user.tab()
    await user.keyboard('{Enter}')
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('aceita outro nome para a navegação e não renderiza nada sem páginas', () => {
    const named = render(<Pagination count={4} aria-label="Páginas de ordens" />)
    expect(screen.getByRole('navigation', { name: 'Páginas de ordens' })).toBeTruthy()
    named.unmount()

    const { container } = render(<Pagination count={0} />)
    expect(container.querySelector('nav')).toBeNull()
  })
})
