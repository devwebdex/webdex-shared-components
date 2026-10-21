'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { Select as SelectPrimitive } from 'radix-ui'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../../lib/cn.js'
import { listItemVariants, listPopupVariants } from '../../lib/list.js'

/**
 * Select do design system WEbdEX: escolha de um valor numa lista (padrão ARIA listbox),
 * sobre o Select do Radix, que cuida de teclado, foco, leitor de tela e posicionamento.
 *
 * O visual do gatilho é o do Button `code` (superfície translúcida com borda fina), porque
 * a referência visual ainda não tem campo de seleção. Estados são atributos, não props:
 * aberto é `data-[state=open]`, sem valor é `data-placeholder`.
 */
const selectTriggerVariants = cva(
  [
    'inline-flex w-full items-center justify-between gap-2',
    'font-sans text-text-primary bg-surface-code inset-ring-1 inset-ring-line-default',
    'cursor-pointer select-none transition-[box-shadow,background-color]',
    'hover:inset-ring-white/50 data-[state=open]:inset-ring-brand',
    'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
    'data-placeholder:text-text-secondary',
    'disabled:cursor-not-allowed disabled:text-text-disabled disabled:inset-ring-white/15',
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
    },
    defaultVariants: { size: 'medium', radius: '2' },
  }
)

export type SelectOption = {
  value: string
  label: ReactNode
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
        className={cn(selectTriggerVariants({ size, radius }), className)}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className={cn(
            listPopupVariants({ radius }),
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
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
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

function ChevronDown() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function Check() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export { selectTriggerVariants }
