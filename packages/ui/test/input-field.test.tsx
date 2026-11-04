import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { InputField } from '../src/index.js'

describe('InputField', () => {
  // `status` é a única prop de estado, e só `error` tem consequência de
  // acessibilidade: o leitor de tela anuncia o campo como inválido.
  it('status="error" marca o campo como inválido', () => {
    render(<InputField status="error" aria-label="Endereço" />)

    expect(screen.getByLabelText('Endereço').getAttribute('aria-invalid')).toBe('true')
  })

  it.each(['default', 'success'] as const)('status="%s" não marca como inválido', (status) => {
    render(<InputField status={status} aria-label="Endereço" />)

    expect(screen.getByLabelText('Endereço').hasAttribute('aria-invalid')).toBe(false)
  })

  it('aceita digitação e avisa quem escuta', async () => {
    const onChange = vi.fn()
    render(<InputField onChange={onChange} aria-label="Endereço" />)

    const campo = screen.getByLabelText<HTMLInputElement>('Endereço')
    await userEvent.type(campo, '0x3fA9')

    expect(campo.value).toBe('0x3fA9')
    expect(onChange).toHaveBeenCalledTimes(6)
  })

  it('desabilitado, não recebe foco nem digitação', async () => {
    render(<InputField disabled defaultValue="0x3fA9" aria-label="Endereço" />)

    const campo = screen.getByLabelText<HTMLInputElement>('Endereço')
    await userEvent.type(campo, 'c4B1')

    expect(campo.value).toBe('0x3fA9')
    campo.focus()
    expect(document.activeElement).not.toBe(campo)
  })

  it('respeita o maxLength nativo', async () => {
    render(<InputField maxLength={4} aria-label="Código" />)

    const campo = screen.getByLabelText<HTMLInputElement>('Código')
    await userEvent.type(campo, '123456')

    expect(campo.value).toBe('1234')
  })

  it('aceita className e repassa o resto das props ao input', () => {
    render(<InputField className="w-full" id="carteira" placeholder="0x..." aria-label="Campo" />)

    const campo = screen.getByLabelText('Campo')
    expect(campo.className).toContain('w-full')
    expect(campo.id).toBe('carteira')
    expect(campo.getAttribute('placeholder')).toBe('0x...')
  })
})
