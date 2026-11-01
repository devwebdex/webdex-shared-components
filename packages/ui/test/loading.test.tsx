import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button, SkeletonAvatar, SkeletonCard, SkeletonText, Spinner } from '../src/index.js'

describe('Spinner', () => {
  it('anuncia o carregamento com o rótulo', () => {
    render(<Spinner label="Compilando contrato" />)
    expect(screen.getByRole('status').textContent).toBe('Compilando contrato')
  })

  it('usa "Carregando" quando não recebe rótulo', () => {
    render(<Spinner />)
    expect(screen.getByRole('status').textContent).toBe('Carregando')
  })

  it('desenha o losango com 13 células, em três tamanhos', () => {
    const { container } = render(
      <>
        <Spinner size="small" />
        <Spinner size="medium" />
        <Spinner size="large" />
      </>
    )
    const [small, medium, large] = screen.getAllByRole('status')
    expect(small?.className).toContain('size-5')
    expect(medium?.className).toContain('size-[72px]')
    expect(large?.className).toContain('size-[106px]')
    expect(container.querySelectorAll('svg')[0]?.querySelectorAll('rect')).toHaveLength(13)
  })
})

describe('Spinner variantes', () => {
  it('desenha o círculo com trilho e arco girando', () => {
    const { container } = render(<Spinner variant="ring" />)
    const svg = container.querySelector('svg')
    expect(svg?.querySelectorAll('circle')).toHaveLength(2)
    expect(svg?.getAttribute('class')).toContain('animate-spin')
    expect(screen.getByRole('status').textContent).toBe('Carregando')
  })

  it('desenha três pontos acendendo em sequência', () => {
    const { container } = render(<Spinner variant="dots" />)
    const dots = Array.from(container.querySelectorAll('circle'))
    expect(dots).toHaveLength(3)
    expect(dots.map((dot) => dot.getAttribute('class'))).toEqual([
      expect.not.stringContaining('animation-delay'),
      expect.stringContaining('[animation-delay:0.14s]'),
      expect.stringContaining('[animation-delay:0.28s]'),
    ])
  })

  it('usa a cor do texto em volta com tone current', () => {
    const { container } = render(
      <>
        <Spinner tone="current" />
        <Spinner variant="ring" tone="current" />
        <Spinner variant="dots" tone="current" />
      </>
    )
    const shapes = Array.from(container.querySelectorAll('rect, circle'))
    for (const shape of shapes) {
      expect(shape.getAttribute('class')).toMatch(/(fill|stroke)-current/)
    }
  })
})

describe('Button loading', () => {
  it('fica ocupado, mantém o nome e ignora o clique', async () => {
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick}>
        Salvar
      </Button>
    )
    const button = screen.getByRole('button', { name: 'Salvar' })
    expect(button.getAttribute('aria-busy')).toBe('true')
    expect(button.getAttribute('aria-disabled')).toBe('true')
    expect(button.querySelector('svg[aria-hidden="true"]')).not.toBeNull()

    await userEvent.setup().click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('não envia o formulário enquanto carrega', async () => {
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault())
    render(
      <form onSubmit={(event) => onSubmit(event.nativeEvent as SubmitEvent)}>
        <Button type="submit" loading>
          Enviar
        </Button>
      </form>
    )
    await userEvent.setup().click(screen.getByRole('button', { name: 'Enviar' }))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  // Com `disabled`, o foco sairia do botão no meio do envio.
  it('continua focável enquanto carrega', () => {
    render(<Button loading>Salvar</Button>)
    const button = screen.getByRole('button', { name: 'Salvar' })
    button.focus()
    expect(document.activeElement).toBe(button)
  })

  it('volta ao normal quando termina', async () => {
    const onClick = vi.fn()
    const { rerender } = render(
      <Button loading onClick={onClick}>
        Salvar
      </Button>
    )
    rerender(<Button onClick={onClick}>Salvar</Button>)
    const button = screen.getByRole('button', { name: 'Salvar' })
    expect(button.hasAttribute('aria-busy')).toBe(false)
    expect(button.hasAttribute('aria-disabled')).toBe(false)
    expect(button.querySelector('svg')).toBeNull()
    await userEvent.setup().click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })
})

describe('Skeleton', () => {
  it('desenha as linhas pedidas, com a última mais curta', () => {
    const { container } = render(<SkeletonText lines={4} />)
    const lines = container.firstElementChild?.children ?? []
    expect(lines).toHaveLength(4)
    expect(lines[3]?.className).toContain('w-3/5')
    expect(lines[0]?.className).not.toContain('w-3/5')
  })

  it('fica fora da árvore de acessibilidade', () => {
    const { container } = render(
      <>
        <SkeletonText />
        <SkeletonAvatar size="large" />
        <SkeletonCard />
      </>
    )
    for (const element of Array.from(container.children)) {
      expect(element.getAttribute('aria-hidden')).toBe('true')
    }
  })
})
