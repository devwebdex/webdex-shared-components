import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Alert } from '../src/index.js'

describe('Alert', () => {
  // A escolha entre `alert` e `status` é o que decide se o leitor de tela
  // interrompe a pessoa ou espera ela chegar lá. É contrato, não estilo.
  it.each([
    ['error', 'alert'],
    ['warning', 'alert'],
    ['info', 'status'],
    ['success', 'status'],
  ] as const)('a variante %s anuncia como %s', (variant, papel) => {
    render(<Alert variant={variant}>Mensagem.</Alert>)

    expect(screen.getByRole(papel).textContent).toContain('Mensagem.')
  })

  it('sem variante, é info', () => {
    render(<Alert>Mensagem.</Alert>)

    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('quem monta a tela pode trocar o papel', () => {
    render(
      <Alert variant="error" role="status">
        Mensagem.
      </Alert>
    )

    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByRole('status')).toBeTruthy()
  })

  it('mostra o título antes do texto, separado por espaço', () => {
    render(<Alert title="Contrato publicado.">Veja na Polygon.</Alert>)

    expect(screen.getByRole('status').textContent).toContain('Contrato publicado. Veja na Polygon.')
  })

  it('o símbolo da variante fica fora do nome acessível', () => {
    render(<Alert variant="success">Publicado.</Alert>)

    // Visível para quem enxerga, ignorado por quem ouve: o papel já diz o tom.
    expect(screen.getByText('✓').getAttribute('aria-hidden')).toBe('true')
    expect(screen.getByRole('status').textContent).toContain('Publicado.')
  })

  it('aceita um símbolo próprio', () => {
    render(<Alert icon="⚡">Rede lenta.</Alert>)

    expect(screen.getByText('⚡')).toBeTruthy()
    expect(screen.queryByText('i')).toBeNull()
  })

  it('icon={null} esconde o símbolo', () => {
    render(
      <Alert variant="warning" icon={null}>
        Rede de teste.
      </Alert>
    )

    expect(screen.queryByText('!')).toBeNull()
    expect(screen.getByRole('alert').textContent).toBe('Rede de teste.')
  })

  it('aceita className e repassa o resto das props à raiz', () => {
    render(
      <Alert className="mt-4" data-testid="alerta" id="rede">
        Mensagem.
      </Alert>
    )

    const raiz = screen.getByTestId('alerta')
    expect(raiz.className).toContain('mt-4')
    expect(raiz.id).toBe('rede')
  })
})
