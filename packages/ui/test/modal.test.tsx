import { render, screen } from '@testing-library/react'
import { PointerEventsCheckLevel, userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button, ConfirmModal, Modal, ModalClose } from '../src/index.js'

// Com o modal aberto, o Radix põe `pointer-events: none` no body, e o user-event se recusa a
// clicar ali. O clique fora é justamente o que se quer testar, então a checagem sai.
//
// O alvo é um elemento novo, não o body: o user-event guarda no elemento o resultado da última
// checagem e, com `Never`, reaproveita esse resultado em vez de pular. O body já foi checado nos
// testes anteriores e continuaria barrando o clique.
async function outsideClick() {
  const outside = document.createElement('div')
  document.body.append(outside)
  try {
    await userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never }).click(outside)
  } finally {
    outside.remove()
  }
}

describe('Modal', () => {
  it('abre pelo gatilho com título, descrição, conteúdo e footer, e fecha pelo X', async () => {
    render(
      <Modal
        trigger={<Button>Detalhes</Button>}
        title="Detalhes da transação"
        description="Confira antes de assinar."
        footer={
          <ModalClose>
            <Button>Entendi</Button>
          </ModalClose>
        }
      >
        Taxa estimada: 0,002 ETH
      </Modal>
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Detalhes' }))

    const dialog = screen.getByRole('dialog', { name: 'Detalhes da transação' })
    expect(dialog.getAttribute('aria-describedby')).toBeTruthy()
    expect(screen.getByText('Confira antes de assinar.').id).toBe(
      dialog.getAttribute('aria-describedby')
    )
    expect(dialog.textContent).toContain('Taxa estimada: 0,002 ETH')

    await user.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('fecha com Esc e pelo botão envolvido em ModalClose', async () => {
    const onOpenChange = vi.fn()
    render(
      <Modal
        defaultOpen
        onOpenChange={onOpenChange}
        title="Aviso"
        footer={
          <ModalClose>
            <Button>Entendi</Button>
          </ModalClose>
        }
      />
    )
    const user = userEvent.setup()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  it('fecha com clique fora', async () => {
    render(<Modal defaultOpen title="Aviso" />)
    await outsideClick()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('aplica o tamanho e esconde o X com hideClose', () => {
    render(<Modal open size="lg" hideClose title="Grande" />)
    const dialog = screen.getByRole('dialog', { name: 'Grande' })
    expect(dialog.className).toContain('max-w-[800px]')
    expect(screen.queryByRole('button', { name: 'Fechar' })).toBeNull()
  })
})

describe('ConfirmModal', () => {
  it('é um alertdialog com o foco em Cancelar, e Cancelar chama onCancel sem confirmar', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(
      <ConfirmModal
        defaultOpen
        title="Conectar carteira"
        description="O site vai ver o seu endereço público."
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )
    const dialog = screen.getByRole('alertdialog', { name: 'Conectar carteira' })
    expect(dialog).toBeTruthy()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancelar' }))

    await userEvent.setup().click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalledOnce()
    expect(onConfirm).not.toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })

  it('espera a promessa do onConfirm com os botões desabilitados e fecha quando ela resolve', async () => {
    let resolve: () => void = () => {}
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((done) => {
          resolve = done
        })
    )
    const onCancel = vi.fn()
    render(
      <ConfirmModal
        defaultOpen
        title="Conectar carteira"
        confirmLabel="Conectar"
        pendingLabel="Conectando…"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Conectar' }))

    const pending = screen.getByRole('button', { name: 'Conectando…' }) as HTMLButtonElement
    expect(pending.disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Cancelar' }) as HTMLButtonElement).disabled).toBe(
      true
    )
    expect(screen.getByRole('alertdialog').getAttribute('aria-busy')).toBe('true')

    // Esc durante a espera não fecha: a ação já está em andamento.
    await user.keyboard('{Escape}')
    expect(screen.getByRole('alertdialog')).toBeTruthy()

    resolve()
    await vi.waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('não fecha com clique fora', async () => {
    render(<ConfirmModal defaultOpen title="Excluir workspace" onConfirm={() => {}} />)
    await outsideClick()
    expect(screen.getByRole('alertdialog')).toBeTruthy()
  })
})
