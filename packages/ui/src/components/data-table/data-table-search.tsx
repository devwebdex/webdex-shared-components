import { cn } from '../../lib/cn.js'
import { inputFieldVariants } from '../input-field/input-field.js'
import { paginationItemClass } from '../pagination/pagination-item.js'
import { Search, X } from './data-table-icons.js'
import type { DataTableSearchProps } from './types.js'

/**
 * Busca global da DataTable, na barra de ferramentas. O InputField não tem lugar para ícone,
 * então o campo é o InputField com padding a mais dos dois lados, e a lupa e o X ficam por cima,
 * em posição absoluta. A lupa é decorativa; o nome do campo vem de `label`.
 *
 * O X só aparece com texto e devolve o foco ao campo, para quem limpou continuar digitando.
 * Esc também limpa (o `type="search"` já faz isso em alguns navegadores, não em todos). O X nativo
 * do `search` fica escondido para não aparecerem dois.
 *
 * Padding 32px (`ps-6`/`pe-6`): a lupa de 16px mais 8px de cada lado; do outro lado, o X de 24px
 * (`size-5`) a 4px da borda. Sem estado próprio e sem
 * 'use client': o valor é de quem controla a busca.
 */
export function DataTableSearch({ value, onChange, placeholder, label }: DataTableSearchProps) {
  return (
    <div className="relative w-full max-w-xs">
      <Search className="pointer-events-none absolute start-2 top-1/2 size-4 -translate-y-1/2 text-text-disabled" />
      <input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && value !== '') {
            event.preventDefault()
            onChange('')
          }
        }}
        className={cn(
          inputFieldVariants(),
          'ps-6 pe-6 [&::-webkit-search-cancel-button]:appearance-none'
        )}
      />
      {value !== '' && (
        <button
          type="button"
          aria-label="Limpar busca"
          title="Limpar busca"
          onClick={(event) => {
            onChange('')
            event.currentTarget.parentElement?.querySelector('input')?.focus()
          }}
          className={cn(
            paginationItemClass,
            'absolute end-1 top-1/2 size-5 min-w-0 -translate-y-1/2 px-0'
          )}
        >
          <X />
        </button>
      )}
    </div>
  )
}
