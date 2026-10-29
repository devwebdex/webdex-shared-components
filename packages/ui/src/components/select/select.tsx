'use client'

import type { VariantProps } from 'class-variance-authority'
import { Select as SelectPrimitive } from 'radix-ui'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../../lib/cn.js'
import { selectTriggerVariants } from '../../lib/field.js'
import { Check, ChevronDown, chevronClass } from '../../lib/icons.js'
import { listItemVariants, listPopupVariants } from '../../lib/list.js'

/**
 * Select do design system WEbdEX: escolha de um valor numa lista (padrão ARIA listbox),
 * sobre o Select do Radix, que cuida de teclado, foco, leitor de tela e posicionamento.
 * O gatilho vem de `selectTriggerVariants` (lib/field.ts), dividido com o Combobox.
 */
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
