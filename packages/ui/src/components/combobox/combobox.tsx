'use client'

import type { VariantProps } from 'class-variance-authority'
import { Command } from 'cmdk'
import { Popover } from 'radix-ui'
import { type ReactNode, useState } from 'react'
import { cn } from '../../lib/cn.js'
import { Check, ChevronDown, chevronClass, Search } from '../../lib/icons.js'
import { listItemVariants, listPopupVariants } from '../../lib/list.js'
import { type SelectOption, selectTriggerVariants } from '../select/select.js'

/**
 * Combobox do design system WEbdEX: o Select com uma busca no topo da lista, para listas longas
 * (ex.: dezenas de redes). O gatilho e a lista têm o mesmo visual do Select.
 *
 * A busca e a navegação por teclado são do `cmdk`, a mesma base do painel da WEbdEX; a caixa que
 * abre é o Popover do Radix. O cmdk marca o item em destaque com `data-selected="true"` (o Radix
 * usa `data-highlighted`), por isso o destaque daqui tem classes próprias.
 */
export type ComboboxOption = SelectOption & {
  /** Termos extras para a busca (ex.: `['matic']` para Polygon). O rótulo em texto já entra. */
  keywords?: string[]
}

export type ComboboxProps = VariantProps<typeof selectTriggerVariants> & {
  options: ComboboxOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Texto do campo enquanto nenhum valor foi escolhido. */
  placeholder?: ReactNode
  /** Texto da caixa de busca; vira também o rótulo dela para leitor de tela. */
  searchPlaceholder?: string
  /** Mensagem quando a busca não encontra nada. */
  emptyMessage?: ReactNode
  /** Envia o valor junto com o formulário, num campo escondido. */
  name?: string
  disabled?: boolean
  id?: string
  'aria-label'?: string
  'aria-labelledby'?: string
  className?: string
}

export function Combobox({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  searchPlaceholder = 'Buscar',
  emptyMessage = 'Nada encontrado.',
  name,
  disabled,
  size,
  radius,
  attention,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [internal, setInternal] = useState(defaultValue)
  const current = value ?? internal
  const selected = options.find((option) => option.value === current)

  function choose(next: string) {
    if (value === undefined) setInternal(next)
    onValueChange?.(next)
    setOpen(false)
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          id={id}
          disabled={disabled}
          // Mesmo atributo do Select sem valor: cor do texto e regra do halo de atenção.
          data-placeholder={selected ? undefined : ''}
          className={cn(selectTriggerVariants({ size, radius, attention }), className)}
        >
          <span className="flex items-center gap-2">
            {selected ? (
              <>
                {selected.icon}
                {selected.label}
              </>
            ) : (
              placeholder
            )}
          </span>
          <ChevronDown className={chevronClass} />
        </button>
      </Popover.Trigger>
      {name && <input type="hidden" name={name} value={current ?? ''} />}
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className={cn(
            listPopupVariants({ radius }),
            'flex flex-col p-0',
            'origin-(--radix-popover-content-transform-origin) w-(--radix-popover-trigger-width)',
            'max-h-[min(20rem,var(--radix-popover-content-available-height))]'
          )}
        >
          <Command loop className="flex min-h-0 flex-col">
            <div className="flex items-center gap-2 border-b border-line-default px-3 text-text-secondary [&_svg]:size-[18px] [&_svg]:shrink-0">
              <Search />
              <Command.Input
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="w-full bg-transparent py-2 text-base text-text-primary outline-none placeholder:text-text-secondary"
              />
            </div>
            <Command.List label={ariaLabel ?? 'Opções'} className="min-h-0 overflow-y-auto p-1">
              <Command.Empty className="px-3 py-2 text-sm text-text-secondary">
                {emptyMessage}
              </Command.Empty>
              {options.map((option) => (
                <Command.Item
                  key={option.value}
                  value={option.value}
                  keywords={[
                    ...(typeof option.label === 'string' ? [option.label] : []),
                    ...(option.keywords ?? []),
                  ]}
                  disabled={option.disabled ?? false}
                  onSelect={() => choose(option.value)}
                  data-state={option.value === current ? 'checked' : 'unchecked'}
                  className={cn(
                    listItemVariants({ size, radius }),
                    'justify-between',
                    'data-[selected=true]:bg-brand-soft/10 data-[selected=true]:before:opacity-100'
                  )}
                >
                  <span className="flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </span>
                  {option.value === current && <Check />}
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
