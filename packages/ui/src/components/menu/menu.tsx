'use client'

import type { VariantProps } from 'class-variance-authority'
import { DropdownMenu } from 'radix-ui'
import { type ComponentProps, type ReactElement, type ReactNode, useState } from 'react'
import { cn } from '../../lib/cn.js'
import { ChevronDown, chevronClass } from '../../lib/icons.js'
import {
  attentionClass,
  listItemVariants,
  listPopupVariants,
  listSeparatorClass,
} from '../../lib/list.js'
import { Button } from '../button/button.js'

/**
 * Menu do design system WEbdEX: lista de ações aberta por um gatilho (padrão ARIA menu),
 * sobre o DropdownMenu do Radix, que cuida de teclado, foco, leitor de tela e posicionamento.
 * Nada fica selecionado: cada item executa uma ação.
 *
 * Com `label`, o gatilho é um Button `code` com a seta que gira ao abrir. Para outro gatilho,
 * passe o elemento em `trigger`; o Radix o liga ao menu com `aria-haspopup` e `aria-expanded`.
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
    /** Rótulo do gatilho padrão (Button com seta). */
    label?: ReactNode
    /** Gatilho próprio no lugar do padrão; `label` e `attention` deixam de valer. */
    trigger?: ReactElement
    items: MenuItem[]
    align?: 'start' | 'center' | 'end'
    /** Halo pulsante no gatilho padrão para chamar a atenção; some de vez depois da primeira abertura. */
    attention?: boolean
    className?: string
  }

export function Menu({
  label,
  trigger,
  items,
  size,
  radius,
  align = 'start',
  attention = false,
  className,
  onOpenChange,
  ...props
}: MenuProps) {
  // O Menu não tem valor para dizer que a pessoa já agiu: o halo para na primeira abertura.
  const [opened, setOpened] = useState(false)
  return (
    <DropdownMenu.Root
      {...props}
      onOpenChange={(open) => {
        if (open) setOpened(true)
        onOpenChange?.(open)
      }}
    >
      <DropdownMenu.Trigger asChild>
        {trigger ?? (
          <Button
            color="code"
            size={size}
            iconRight={<ChevronDown className={chevronClass} />}
            className={cn('relative', attention && !opened && attentionClass)}
          >
            {label}
          </Button>
        )}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={6}
          className={cn(
            listPopupVariants({ radius }),
            'origin-(--radix-dropdown-menu-content-transform-origin)',
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
