import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from '../src/index.js'

// O estado `loading` tem testes próprios em loading.test.tsx. Aqui fica o resto:
// o que o botão faz quando não está carregando.
describe('Button', () => {
  it('chama o onClick', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Conectar</Button>)

    await userEvent.click(screen.getByRole('button', { name: 'Conectar' }))

    expect(onClick).toHaveBeenCalledOnce()
  })

  // `type` nasce como `button`, não `submit` como o HTML faz. Botão dentro de
  // formulário só envia se pedirem: o contrário enviaria sem querer.
  it('não envia o formulário sem type="submit"', async () => {
    const onSubmit = vi.fn((event: Event) => event.preventDefault())
    render(
      <form onSubmit={(event) => onSubmit(event.nativeEvent)}>
        <Button>Salvar</Button>
      </form>
    )

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('envia o formulário com type="submit"', async () => {
    const onSubmit = vi.fn((event: Event) => event.preventDefault())
    render(
      <form onSubmit={(event) => onSubmit(event.nativeEvent)}>
        <Button type="submit">Salvar</Button>
      </form>
    )

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('desabilitado, ignora o clique e sai da ordem do teclado', async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Conectar
      </Button>
    )

    const botao = screen.getByRole('button', { name: 'Conectar' })
    await userEvent.click(botao)

    expect(onClick).not.toHaveBeenCalled()
    botao.focus()
    expect(document.activeElement).not.toBe(botao)
  })

  it('responde ao teclado', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Conectar</Button>)

    await userEvent.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Conectar' }))

    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  // Ícone é decoração ao lado do rótulo: ele não pode entrar no nome acessível,
  // senão o leitor de tela anuncia o desenho junto com o texto.
  it('os ícones não entram no nome acessível', () => {
    render(
      <Button iconLeft={<svg aria-hidden="true" />} iconRight={<svg aria-hidden="true" />}>
        Conectar
      </Button>
    )

    expect(screen.getByRole('button', { name: 'Conectar' })).toBeTruthy()
  })

  it('aceita className e repassa o resto das props ao botão', () => {
    render(
      <Button className="w-full" id="conectar" data-testid="botao">
        Conectar
      </Button>
    )

    const botao = screen.getByTestId('botao')
    expect(botao.className).toContain('w-full')
    expect(botao.id).toBe('conectar')
  })

  it('botão só com ícone precisa do aria-label para ter nome', () => {
    render(<Button aria-label="Copiar endereço" iconLeft={<svg aria-hidden="true" />} />)

    expect(screen.getByRole('button', { name: 'Copiar endereço' })).toBeTruthy()
  })
})
