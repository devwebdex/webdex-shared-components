'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { AlertDialog, Dialog } from 'radix-ui'
import { type ComponentProps, type ReactElement, type ReactNode, useState } from 'react'
import { cn } from '../../lib/cn.js'
import { Close } from '../../lib/icons.js'
import { Button } from '../button/button.js'

/**
 * Modal do design system WEbdEX, sobre o Dialog do Radix, que cuida de foco preso, Esc, rolagem
 * da página travada e leitor de tela. Duas formas:
 *
 * - `Modal`: header (título, descrição e fechar), conteúdo livre e footer de ações.
 * - `ConfirmModal`: a variação de confirmação, sobre o AlertDialog (`role="alertdialog"`). Não
 *   fecha com clique fora e só sai por Cancelar, Esc ou depois de confirmar. Se o `onConfirm`
 *   devolver uma promessa (conectar a carteira, assinar), os botões esperam ela terminar.
 *
 * A referência aprovada (docs/ui/webdex-design-system.html) não tem modal. O visual é proposta
 * para revisão do design, montada com os tokens que as listas suspensas já usam: fundo
 * `background`, borda `line-default` e `shadow-elevation-6`.
 *
 * O fundo escurecido é `bg-background/overlay`: o modificador de cor lê `opacity.overlay` dos
 * tokens (namespace `--opacity-*` do Tailwind 4).
 *
 * A abertura usa @starting-style; o fechamento usa `animate-list-out` na caixa e
 * `animate-fade-out` no fundo, dos tokens. O Radix espera a animação antes de desmontar.
 *
 * VALORES SEM TOKEN:
 *
 *   largura    400, 560, 800px    sm, md, lg; fora da escala Spacing, que para em 64px
 */

export const modalOverlayClass = cn(
  'fixed inset-0 z-50 bg-background/overlay',
  'transition-opacity duration-150 ease-out starting:opacity-0',
  'data-[state=closed]:animate-fade-out',
  'motion-reduce:transition-none motion-reduce:data-[state=closed]:animate-none'
)

// Centralizado por translate, que não briga com o scale da animação: no Tailwind 4 são as
// propriedades `translate` e `scale`, não a mesma `transform`. A largura e a altura descontam
// 16px de cada lado, para o modal nunca encostar na borda da tela no celular.
export const modalContentVariants = cva(
  [
    'fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
    'flex w-[calc(100%-2*var(--spacing-4))] max-h-[calc(100dvh-2*var(--spacing-4))] flex-col',
    // scheme-dark: a barra de rolagem do conteúdo longo segue o fundo escuro, não a clara do
    // sistema.
    'rounded-5 bg-background font-sans text-text-primary shadow-elevation-6 scheme-dark',
    'inset-ring-1 inset-ring-line-default outline-none',
    'transition-[opacity,scale] duration-150 ease-out starting:opacity-0 starting:scale-97',
    'data-[state=closed]:animate-list-out',
    'motion-reduce:transition-none motion-reduce:data-[state=closed]:animate-none',
  ],
  {
    variants: {
      size: {
        sm: 'max-w-[400px]',
        md: 'max-w-[560px]',
        lg: 'max-w-[800px]',
      },
    },
    defaultVariants: { size: 'md' },
  }
)

/** Classes das partes internas, exportadas para o teste de CSS do Storybook conferi-las. */
export const modalSlotClasses = {
  header: 'flex items-start gap-3 px-5 pt-5 pb-4',
  icon: 'flex size-7 shrink-0 items-center justify-center rounded-4 bg-brand-soft/10 text-brand [&_svg]:size-5',
  heading: 'flex min-w-0 flex-1 flex-col gap-1',
  title: 'text-xs leading-xs font-semibold text-text-primary',
  description: 'text-2xs leading-2xs text-text-secondary',
  close: '-mt-1 -mr-2 shrink-0',
  body: [
    'min-h-0 flex-1 overflow-y-auto px-5 pb-5 text-2xs leading-2xs text-text-secondary',
    'outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand',
  ].join(' '),
  footer: 'flex flex-wrap items-center justify-end gap-3 border-t border-line-default px-5 py-4',
} as const

/**
 * O conteúdo rola quando passa da altura da tela. tabIndex 0 deixa a área focável, para quem usa
 * só o teclado conseguir rolar com as setas (regra scrollable-region-focusable do axe).
 */
function ModalBody({ children }: { children: ReactNode }) {
  return (
    // biome-ignore lint/a11y/noNoninteractiveTabindex: área rolável precisa de foco para o teclado.
    <div tabIndex={0} className={modalSlotClasses.body}>
      {children}
    </div>
  )
}

type Size = VariantProps<typeof modalContentVariants>['size']

type SharedProps = {
  /** Título do diálogo. Obrigatório: é o nome que o leitor de tela anuncia. */
  title: ReactNode
  /** Texto abaixo do título, ligado ao diálogo por `aria-describedby`. */
  description?: ReactNode | undefined
  /** Ícone à esquerda do título, numa caixa com a cor da marca. */
  icon?: ReactNode | undefined
  /** Elemento que abre o modal. Sem ele, controle com `open` e `onOpenChange`. */
  trigger?: ReactElement | undefined
  /** Largura máxima: sm (400px), md (560px) ou lg (800px). */
  size?: Size | undefined
  /** Classes da caixa do modal. */
  className?: string | undefined
  children?: ReactNode | undefined
}

export type ModalProps = Omit<ComponentProps<typeof Dialog.Root>, 'children'> &
  SharedProps & {
    /** Ações no rodapé. Para um botão que só fecha, envolva-o em `ModalClose`. */
    footer?: ReactNode | undefined
    /** Esconde o botão de fechar do header. Esc e o clique fora continuam fechando. */
    hideClose?: boolean | undefined
    /** Nome acessível do botão de fechar. */
    closeLabel?: string | undefined
  }

export function Modal({
  title,
  description,
  icon,
  trigger,
  size,
  className,
  children,
  footer,
  hideClose = false,
  closeLabel = 'Fechar',
  ...props
}: ModalProps) {
  return (
    <Dialog.Root {...props}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className={modalOverlayClass} />
        <Dialog.Content
          className={cn(modalContentVariants({ size }), className)}
          // Sem descrição, o Radix avisa no console a menos que o atributo venha explícito.
          {...(description == null && { 'aria-describedby': undefined })}
        >
          <div className={modalSlotClasses.header}>
            {icon != null && <div className={modalSlotClasses.icon}>{icon}</div>}
            <div className={modalSlotClasses.heading}>
              <Dialog.Title className={modalSlotClasses.title}>{title}</Dialog.Title>
              {description != null && (
                <Dialog.Description className={modalSlotClasses.description}>
                  {description}
                </Dialog.Description>
              )}
            </div>
            {!hideClose && (
              <Dialog.Close asChild>
                <Button
                  variant="text"
                  color="code"
                  size="small"
                  aria-label={closeLabel}
                  className={modalSlotClasses.close}
                >
                  <Close />
                </Button>
              </Dialog.Close>
            )}
          </div>
          {children != null && <ModalBody>{children}</ModalBody>}
          {footer != null && <div className={modalSlotClasses.footer}>{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/** Fecha o Modal ao clicar no filho, que deve ser um botão: `<ModalClose><Button>…` */
export function ModalClose({ children }: { children: ReactElement }) {
  return <Dialog.Close asChild>{children}</Dialog.Close>
}

export type ConfirmModalProps = Omit<ComponentProps<typeof AlertDialog.Root>, 'children'> &
  SharedProps & {
    /** Rótulo do botão de confirmar. */
    confirmLabel?: ReactNode | undefined
    /** Rótulo do botão de cancelar. */
    cancelLabel?: ReactNode | undefined
    /** Rótulo do botão de confirmar enquanto a promessa do `onConfirm` não termina. */
    pendingLabel?: ReactNode | undefined
    /**
     * Executa a ação. Se devolver uma promessa, os botões ficam desabilitados até ela terminar;
     * o modal fecha quando ela resolve e continua aberto se ela rejeitar, para a pessoa tentar
     * de novo. O erro não é engolido: trate-o aqui e mostre a mensagem no `children`.
     */
    // `unknown`, e não `void | Promise`: aceita função síncrona ou assíncrona, e o retorno só
    // importa quando é promessa, que o modal espera.
    onConfirm: () => unknown
    /** Chamado quando a pessoa desiste: Cancelar ou Esc. */
    onCancel?: (() => void) | undefined
  }

export function ConfirmModal({
  title,
  description,
  icon,
  trigger,
  size = 'sm',
  className,
  children,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  pendingLabel,
  onConfirm,
  onCancel,
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: ConfirmModalProps) {
  // O modal precisa fechar sozinho depois de confirmar, então o estado aberto fica aqui
  // quando quem usa não o controla.
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false)
  const isOpen = open ?? uncontrolledOpen
  const [pending, setPending] = useState(false)

  function setOpen(next: boolean) {
    if (open === undefined) setUncontrolledOpen(next)
    onOpenChange?.(next)
  }

  function handleOpenChange(next: boolean) {
    if (!next && pending) return
    setOpen(next)
    if (!next) onCancel?.()
  }

  async function handleConfirm() {
    setPending(true)
    try {
      await onConfirm()
      setOpen(false)
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog.Root {...props} open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>}
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={modalOverlayClass} />
        <AlertDialog.Content
          className={cn(modalContentVariants({ size }), className)}
          aria-busy={pending || undefined}
          {...(description == null && { 'aria-describedby': undefined })}
        >
          <div className={modalSlotClasses.header}>
            {icon != null && <div className={modalSlotClasses.icon}>{icon}</div>}
            <div className={modalSlotClasses.heading}>
              <AlertDialog.Title className={modalSlotClasses.title}>{title}</AlertDialog.Title>
              {description != null && (
                <AlertDialog.Description className={modalSlotClasses.description}>
                  {description}
                </AlertDialog.Description>
              )}
            </div>
          </div>
          {children != null && <ModalBody>{children}</ModalBody>}
          <div className={modalSlotClasses.footer}>
            {/* O AlertDialog põe o foco no Cancelar ao abrir: Enter por engano não confirma. */}
            <AlertDialog.Cancel asChild>
              <Button variant="outlined" color="code" disabled={pending}>
                {cancelLabel}
              </Button>
            </AlertDialog.Cancel>
            {/* Não é AlertDialog.Action, que fecharia no clique sem esperar a promessa. */}
            <Button disabled={pending} onClick={handleConfirm}>
              {pending ? (pendingLabel ?? confirmLabel) : confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
