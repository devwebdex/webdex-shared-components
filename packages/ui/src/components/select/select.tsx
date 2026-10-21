'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { Select as SelectPrimitive } from 'radix-ui'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../../lib/cn.js'
import { Check, ChevronDown, chevronClass } from '../../lib/icons.js'
import { attentionClass, listItemVariants, listPopupVariants } from '../../lib/list.js'

/**
 * Select do design system WEbdEX: escolha de um valor numa lista (padrão ARIA listbox),
 * sobre o Select do Radix, que cuida de teclado, foco, leitor de tela e posicionamento.
 *
 * O gatilho parte do Button `code` (superfície translúcida com borda fina): no hover a borda
 * esquenta para `brand-soft`, aberto ela fica `brand` e a seta gira. Estados são atributos,
 * não props: aberto é `data-[state=open]`, sem valor é `data-placeholder`.
 */
const selectTriggerVariants = cva(
  [
    'relative inline-flex w-full items-center justify-between gap-2',
    'font-sans text-text-primary bg-surface-code inset-ring-1 inset-ring-line-default',
    'cursor-pointer select-none transition-[box-shadow,background-color] duration-150',
    'hover:bg-surface-elevated hover:inset-ring-brand-soft/40 data-[state=open]:inset-ring-brand',
    'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
    'data-placeholder:text-text-secondary',
    'disabled:cursor-not-allowed disabled:bg-surface-code disabled:text-text-disabled',
    'disabled:inset-ring-line-default',
    '[&_svg]:shrink-0',
  ],
  {
    variants: {
      size: {
        large: 'px-4 py-2 text-lg leading-[26px] [&_svg]:size-[22px]',
        medium: 'px-3 py-[6px] text-base leading-[24px] [&_svg]:size-[20px]',
        small: 'px-2 py-1 text-sm leading-[22px] [&_svg]:size-[18px]',
      },
      radius: {
        '0': 'rounded-0',
        '1': 'rounded-1',
        '2': 'rounded-2',
        '3': 'rounded-3',
        '4': 'rounded-4',
        '5': 'rounded-5',
        full: 'rounded-full',
      },
      /** Halo pulsante para chamar a atenção; some ao abrir e não volta depois de escolhido um valor. */
      attention: {
        true: [attentionClass, 'not-data-placeholder:after:hidden'],
        false: '',
      },
    },
    defaultVariants: { size: 'medium', radius: '2', attention: false },
  }
)

export type SelectOption = {
  value: string
  label: ReactNode
  /** Imagem antes do rótulo (ex.: símbolo da rede); aparece também no gatilho. */
  icon?: ReactNode
  disabled?: boolean
}

export type SelectProps = Omit<ComponentProps<typeof SelectPrimitive.Root>, 'children'> &
  VariantProps<typeof selectTriggerVariants> & {
    options: SelectOption[]
    /** Texto mostrado enquanto nenhum valor foi escolhido. */
    placeholder?: ReactNode
    /** Liga o gatilho a um `<label htmlFor>`. */
    id?: string
    'aria-label'?: string
    'aria-labelledby'?: string
    className?: string
  }

export function Select({
  options,
  placeholder,
  size,
  radius,
  attention,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  className,
  ...props
}: SelectProps) {
  return (
    <SelectPrimitive.Root {...props}>
      <SelectPrimitive.Trigger
        id={id}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={cn(selectTriggerVariants({ size, radius, attention }), className)}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown className={chevronClass} />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className={cn(
            listPopupVariants({ radius }),
            'origin-(--radix-select-content-transform-origin)',
            'min-w-(--radix-select-trigger-width) max-h-(--radix-select-content-available-height)'
          )}
        >
          <SelectPrimitive.Viewport>
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={cn(listItemVariants({ size, radius }), 'justify-between')}
              >
                {/* O ItemText é o que o Radix copia para o gatilho: o ícone vai junto. */}
                <SelectPrimitive.ItemText>
                  <span className="flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </span>
                </SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator>
                  <Check />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

export { selectTriggerVariants }
