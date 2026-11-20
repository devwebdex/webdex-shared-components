'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { Dialog } from 'radix-ui'
import type { ComponentProps, ReactElement, ReactNode } from 'react'
import { cn } from '../../lib/cn.js'
import { Close } from '../../lib/icons.js'
import { Button } from '../button/button.js'
import { modalOverlayClass, modalSlotClasses } from '../modal/modal.js'

/**
 * Drawer do design system WEbdEX: painel que abre pela lateral, sobre o conteúdo, para detalhes de
 * registro, filtros e formulários secundários.
 *
 * É o mesmo Dialog do Radix do Modal (foco preso, Esc, clique fora, rolagem da página travada e
 * leitor de tela), preso a um lado da tela e na altura inteira dela. O fundo escurecido e as
 * partes internas (header, conteúdo e footer) são as do Modal, importadas de lá: as duas
 * sobreposições não divergem quando uma delas mudar.
 *
 * A referência aprovada (docs/ui/webdex-design-system.html) não tem gaveta. O visual é proposta
 * para revisão do design, com os tokens que o Modal já usa: fundo `background`, borda
 * `line-default` no lado de dentro e `shadow-elevation-6`.
 *
 * A entrada desliza do lado escolhido, com @starting-style. A saída usa `animate-slide-out-right`
 * ou `animate-slide-out-left`, dos tokens: o Radix espera a animação antes de desmontar. Com
 * movimento reduzido, abre e fecha sem animação.
 *
 * Só tema escuro, como o resto do pacote: o mecanismo de tema claro ainda não existe
 * (docs/ui/trabalho-em-paralelo.md).
 *
 * VALORES SEM TOKEN:
 *
 *   largura    400, 560, 800px    sm, md, lg; as mesmas do Modal, fora da escala Spacing
 */

// No celular, a gaveta para 48px (spacing.7) antes da outra borda: sobra uma faixa do fundo
// escurecido, que mostra que a página continua ali e aceita o toque para fechar.
export const drawerContentVariants = cva(
  [
    'fixed inset-y-0 z-50 flex w-[calc(100%-var(--spacing-7))] flex-col',
    // scheme-dark: a barra de rolagem do conteúdo longo segue o fundo escuro, como no Modal.
    'bg-background font-sans text-text-primary shadow-elevation-6 scheme-dark outline-none',
    'transition-[translate] duration-200 ease-out',
    'motion-reduce:transition-none motion-reduce:data-[state=closed]:animate-none',
  ],
  {
    variants: {
      side: {
        right: [
          'right-0 border-l border-line-default',
          'starting:translate-x-full data-[state=closed]:animate-slide-out-right',
        ],
        left: [
          'left-0 border-r border-line-default',
          'starting:-translate-x-full data-[state=closed]:animate-slide-out-left',
        ],
      },
      size: {
        sm: 'max-w-[400px]',
        md: 'max-w-[560px]',
        lg: 'max-w-[800px]',
      },
    },
    defaultVariants: { side: 'right', size: 'md' },
  }
)

/**
 * As partes internas são as do Modal, com uma classe a mais nas duas que recebem foco do teclado
 * (o X e o conteúdo rolável): `focus-visible:outline-solid`. No Tailwind 4, o `outline-none` põe
 * `none` na variável `--tw-outline-style`, e o `focus-visible:outline-2` lê essa variável; sem a
 * classe a mais, o anel fica invisível. O Button e o Modal têm o mesmo problema hoje, e a
 * correção certa é no Button, numa tarefa separada (SCRUM-141). Exportadas para o teste de CSS.
 */
export const drawerSlotClasses = {
  close: cn(modalSlotClasses.close, 'focus-visible:outline-solid'),
  body: cn(modalSlotClasses.body, 'focus-visible:outline-solid'),
  // Sem conteúdo, o espaço vazio empurra o footer para o pé da gaveta.
  spacer: 'flex-1',
} as const

type Variants = VariantProps<typeof drawerContentVariants>

export type DrawerProps = Omit<ComponentProps<typeof Dialog.Root>, 'children'> & {
  /** Título da gaveta. Obrigatório: é o nome que o leitor de tela anuncia. */
  title: ReactNode
  /** Texto abaixo do título, ligado à gaveta por `aria-describedby`. */
  description?: ReactNode | undefined
  /** Elemento que abre a gaveta. Sem ele, controle com `open` e `onOpenChange`. */
  trigger?: ReactElement | undefined
  /** Lado de onde a gaveta abre. */
  side?: Variants['side'] | undefined
  /** Largura máxima: sm (400px), md (560px) ou lg (800px). */
  size?: Variants['size'] | undefined
  /** Ações no rodapé, presas embaixo. Para um botão que só fecha, envolva-o em `DrawerClose`. */
  footer?: ReactNode | undefined
  /** Esconde o botão de fechar do header. Esc e o clique fora continuam fechando. */
  hideClose?: boolean | undefined
  /** Nome acessível do botão de fechar. */
  closeLabel?: string | undefined
  /** Classes do painel. */
  className?: string | undefined
  children?: ReactNode | undefined
}

export function Drawer({
  title,
  description,
  trigger,
  side,
  size,
  footer,
  hideClose = false,
  closeLabel = 'Fechar',
  className,
  children,
  ...props
}: DrawerProps) {
  return (
    <Dialog.Root {...props}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className={modalOverlayClass} />
        <Dialog.Content
          className={cn(drawerContentVariants({ side, size }), className)}
          // Sem descrição, o Radix avisa no console a menos que o atributo venha explícito.
          {...(description == null && { 'aria-describedby': undefined })}
        >
          <div className={modalSlotClasses.header}>
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
                  className={drawerSlotClasses.close}
                >
                  <Close />
                </Button>
              </Dialog.Close>
            )}
          </div>
          {children != null ? (
            // O conteúdo rola entre o header e o footer. tabIndex 0 deixa a área focável, para quem
            // usa só o teclado conseguir rolar com as setas (regra scrollable-region-focusable).
            // biome-ignore lint/a11y/noNoninteractiveTabindex: área rolável precisa de foco para o teclado.
            <div tabIndex={0} className={drawerSlotClasses.body}>
              {children}
            </div>
          ) : (
            <div className={drawerSlotClasses.spacer} />
          )}
          {footer != null && <div className={modalSlotClasses.footer}>{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/** Fecha a Drawer ao clicar no filho, que deve ser um botão: `<DrawerClose><Button>…` */
export function DrawerClose({ children }: { children: ReactElement }) {
  return <Dialog.Close asChild>{children}</Dialog.Close>
}
