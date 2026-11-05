import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TextField } from '../src/index.js'

describe('TextField', () => {
  // O rótulo precisa estar ligado ao input pelo htmlFor/id, não só por cima dele:
  // é isso que faz o clique no rótulo focar o campo e o leitor de tela nomeá-lo.
  it('liga o rótulo ao campo', async () => {
    render(<TextField label="Nome do workspace" />)

    const campo = screen.getByLabelText('Nome do workspace')
    await userEvent.click(screen.getByText('Nome do workspace'))

    expect(document.activeElement).toBe(campo)
  })

  it('gera um id próprio por instância', () => {
    render(
      <>
        <TextField label="Primeiro" />
        <TextField label="Segundo" />
      </>
    )

    const primeiro = screen.getByLabelText('Primeiro')
    const segundo = screen.getByLabelText('Segundo')
    expect(primeiro.id).not.toBe(segundo.id)
    expect(primeiro.id).toBeTruthy()
  })

  it('o helper text é anunciado junto com o campo', () => {
    render(<TextField label="Nome" helperText="Use apenas letras e hífen." />)

    const campo = screen.getByLabelText('Nome')
    const descrito = campo.getAttribute('aria-describedby')
    expect(descrito).toBeTruthy()
    expect(document.getElementById(descrito ?? '')?.textContent).toBe('Use apenas letras e hífen.')
  })

  it('sem helper text nem contador, não descreve nada', () => {
    render(<TextField label="Nome" />)

    expect(screen.getByLabelText('Nome').hasAttribute('aria-describedby')).toBe(false)
  })

  // Quem consome pode apontar para uma mensagem que já existe na tela; o campo
  // não pode descartá-la ao acrescentar as suas.
  it('preserva o aria-describedby de quem consome', () => {
    render(
      <>
        <span id="externo">Mensagem de fora.</span>
        <TextField label="Nome" helperText="Interna." aria-describedby="externo" />
      </>
    )

    const ids = screen.getByLabelText('Nome').getAttribute('aria-describedby')?.split(' ') ?? []
    expect(ids).toContain('externo')
    expect(ids.length).toBe(2)
  })

  it('o contador sem maxLength mostra só o total, e acompanha a digitação', async () => {
    render(<TextField label="Nome" counter />)

    await userEvent.type(screen.getByLabelText('Nome'), 'webdex')

    expect(screen.getByText('6')).toBeTruthy()
  })

  it('com maxLength, o contador mostra atual/máximo', async () => {
    render(<TextField label="Nome" counter maxLength={32} />)

    expect(screen.getByText('0/32')).toBeTruthy()
    await userEvent.type(screen.getByLabelText('Nome'), 'webdex')
    expect(screen.getByText('6/32')).toBeTruthy()
  })

  it('o contador parte do defaultValue, não de zero', () => {
    render(<TextField label="Nome" counter maxLength={32} defaultValue="webdex-core" />)

    expect(screen.getByText('11/32')).toBeTruthy()
  })

  // Controlado: o contador tem de seguir o `value` de quem manda, e não um estado
  // interno que ficaria desencontrado quando o pai recusa a mudança.
  it('controlado, o contador segue o value de quem manda', async () => {
    const onChange = vi.fn()
    render(<TextField label="Nome" counter maxLength={32} value="webdex" onChange={onChange} />)

    await userEvent.type(screen.getByLabelText('Nome'), 'x')

    expect(onChange).toHaveBeenCalled()
    expect(screen.getByText('6/32')).toBeTruthy()
  })

  it('desabilitado, não recebe digitação', async () => {
    render(<TextField label="Nome" disabled defaultValue="webdex" />)

    const campo = screen.getByLabelText<HTMLInputElement>('Nome')
    await userEvent.type(campo, 'x')

    expect(campo.value).toBe('webdex')
  })

  it('status="error" marca o campo como inválido', () => {
    render(<TextField label="Nome" status="error" helperText="Nome em uso." />)

    expect(screen.getByLabelText('Nome').getAttribute('aria-invalid')).toBe('true')
  })

  // `className` é do contêiner e `inputClassName` é do input: trocar um pelo outro
  // é o engano fácil aqui, porque todo outro componente da casa só tem o primeiro.
  it('className vai para o contêiner e inputClassName para o input', () => {
    render(
      <TextField
        label="Nome"
        className="w-80"
        inputClassName="font-mono"
        data-testid="campo"
        id="nome"
      />
    )

    const campo = screen.getByLabelText('Nome')
    expect(campo.className).toContain('font-mono')
    expect(campo.className).not.toContain('w-80')
    expect(campo.closest('div')?.className).toContain('w-80')
  })
})
