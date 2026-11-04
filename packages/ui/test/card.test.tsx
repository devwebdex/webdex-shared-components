import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Card } from '../src/index.js'

describe('Card', () => {
  it('mostra header, conteúdo e ações', () => {
    render(
      <Card title="WebdexVault" actions={<button type="button">Publicar</button>}>
        Cofre na Polygon.
      </Card>
    )

    expect(screen.getByText('WebdexVault')).toBeTruthy()
    expect(screen.getByText('Cofre na Polygon.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Publicar' })).toBeTruthy()
  })

  it('omite mídia, header e ações quando não são passados', () => {
    render(<Card data-testid="card">Só conteúdo.</Card>)

    expect(screen.getByText('Só conteúdo.')).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
    // mídia, header, conteúdo e ações são irmãos: sem os três extremos, sobra um filho.
    expect(screen.getByTestId('card').children.length).toBe(1)
  })

  // A ordem é o contrato do slot, não detalhe de renderização. A mídia sangra com
  // `-mt-4`, que só cancela o `p-4` se ela for o primeiro filho; renderizada depois do
  // título, a margem comeria o `gap-3` e espremeria a imagem contra ele.
  it('renderiza a mídia como primeiro filho, antes do header', () => {
    render(
      <Card data-testid="card" media={<img src="grafico.svg" alt="Rendimento" />} title="Pool">
        Últimos 30 dias.
      </Card>
    )

    // `noUncheckedIndexedAccess`: o índice devolve `Element | undefined`, e o `?.` basta --
    // se o filho não existir, o `undefined` já reprova o `toBe`.
    const [midia, header] = Array.from(screen.getByTestId('card').children)

    expect(midia?.contains(screen.getByAltText('Rendimento'))).toBe(true)
    expect(header?.textContent).toBe('Pool')
  })

  it('o card em repouso não recebe foco pelo teclado', async () => {
    render(
      <Card data-testid="card" title="Parado">
        Conteúdo.
      </Card>
    )

    await userEvent.tab()

    expect(document.activeElement === screen.getByTestId('card')).toBe(false)
  })

  it('o card interativo recebe foco pelo teclado', async () => {
    render(
      <Card interactive data-testid="card">
        Clicável.
      </Card>
    )

    await userEvent.tab()

    expect(document.activeElement === screen.getByTestId('card')).toBe(true)
  })

  it('o card interativo responde ao clique', async () => {
    const aoClicar = vi.fn()
    render(
      <Card interactive data-testid="card" onClick={aoClicar}>
        Clicável.
      </Card>
    )

    await userEvent.click(screen.getByTestId('card'))

    expect(aoClicar).toHaveBeenCalledOnce()
  })

  it('marca data-selected apenas quando selecionado', () => {
    const { rerender } = render(<Card data-testid="card">Conteúdo.</Card>)
    expect(screen.getByTestId('card').hasAttribute('data-selected')).toBe(false)

    rerender(
      <Card data-testid="card" selected>
        Conteúdo.
      </Card>
    )
    expect(screen.getByTestId('card').hasAttribute('data-selected')).toBe(true)
  })

  it('aceita className e repassa o resto das props à raiz', () => {
    render(
      <Card className="minha-classe" data-testid="card" id="cofre">
        Conteúdo.
      </Card>
    )

    const card = screen.getByTestId('card')
    expect(card.classList.contains('minha-classe')).toBe(true)
    expect(card.getAttribute('id')).toBe('cofre')
  })
})
