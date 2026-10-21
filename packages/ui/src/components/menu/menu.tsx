'use client'

import type { VariantProps } from 'class-variance-authority'
import { DropdownMenu } from 'radix-ui'
import type { ComponentProps, ReactElement, ReactNode } from 'react'
import { cn } from '../../lib/cn.js'
import { listItemVariants, listPopupVariants, listSeparatorClass } from '../../lib/list.js'

/**
 * Menu do design system WEbdEX: lista de ações aberta por um gatilho (padrão ARIA menu),
 * sobre o DropdownMenu do Radix, que cuida de teclado, foco, leitor de tela e posicionamento.
 * Nada fica selecionado: cada item executa uma ação.
 *
 * O gatilho é o elemento recebido em `trigger` (normalmente um Button), que o Radix liga ao
 * menu com `aria-haspopup` e `aria-expanded`.
 */
export type MenuAction = {
  label: ReactNode
  onSelect?: () => void
  icon?: ReactNode
  disabled?: boolean
  /** `danger` para ação destrutiva (ex.: Excluir). */
  tone?: 'default' | 'danger'
}

/** Ações do menu; `'separator'` desenha uma linha entre grupos. */
export type MenuItem = MenuAction | 'separator'

export type MenuProps = Omit<ComponentProps<typeof DropdownMenu.Root>, 'children'> &
  Omit<VariantProps<typeof listItemVariants>, 'tone'> & {
    /** Elemento que abre o menu, normalmente um Button. */
    trigger: ReactElement
    items: MenuItem[]
    align?: 'start' | 'center' | 'end'
    className?: string
  }

export function Menu({
  trigger,
  items,
  size,
  radius,
  align = 'start',
  className,
  ...props
}: MenuProps) {
  return (
    <DropdownMenu.Root {...props}>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={4}
          className={cn(
            listPopupVariants({ radius }),
            'min-w-(--radix-dropdown-menu-trigger-width) max-h-(--radix-dropdown-menu-content-available-height)',
            className
          )}
        >
          {items.map((item, index) =>
            item === 'separator' ? (
              // A ordem dos itens é a chave: o menu não reordena nem filtra a lista.
              // biome-ignore lint/suspicious/noArrayIndexKey: ver acima.
              <DropdownMenu.Separator key={index} className={listSeparatorClass} />
            ) : (
              <DropdownMenu.Item
                // biome-ignore lint/suspicious/noArrayIndexKey: o rótulo pode não ser texto.
                key={index}
                disabled={item.disabled}
                onSelect={item.onSelect}
                className={listItemVariants({ size, radius, tone: item.tone })}
              >
                {item.icon}
                {item.label}
              </DropdownMenu.Item>
            )
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
