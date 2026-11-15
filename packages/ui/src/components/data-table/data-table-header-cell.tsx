import { cn } from '../../lib/cn.js'
import { ArrowDown, ArrowUp, ArrowUpDown } from './data-table-icons.js'
import type { DataTableAlign, DataTableHeaderCellProps } from './types.js'

/**
 * Cabeçalho de uma coluna da DataTable. O estilo vem da tabela do design system em HTML
 * (`table.tk th`): fonte mono pequena, cor terciária (--t3, o mesmo valor do text-disabled),
 * peso 500, letras um pouco afastadas e borda inferior da linha.
 *
 * Ordenável, o conteúdo vira um botão (o `th` sozinho não recebe foco nem clique pelo teclado)
 * e o `aria-sort` diz a ordem ao leitor de tela; sem ordenação, o atributo nem aparece, porque
 * `none` anunciaria uma coluna ordenável. O ícone mostra o mesmo estado para quem vê.
 *
 * Sem estado e sem 'use client': o clique é só repassado a quem controla a ordenação.
 *
 * Medidas, todas na escala: fonte 12px (`text-3xs`; 11px no HTML), letter-spacing 0,5px
 * (`tracking-widest`; .06em de 11px dá 0,66px), padding 8px 12px (`py-2 px-3`; 8px 10px no
 * HTML) e ícone 16px (`size-4`), o mesmo da seta da Pagination. O botão herda fonte e cor do
 * `th` (preflight do Tailwind); a coluna ordenada fica em text-secondary para se destacar.
 */

const thAlignClass: Record<DataTableAlign, string> = {
  start: 'text-left',
  center: 'text-center',
  end: 'text-right',
}

const buttonJustifyClass: Record<DataTableAlign, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
}

const ariaSortValue = { asc: 'ascending', desc: 'descending' } as const

export function DataTableHeaderCell({
  header,
  align,
  onToggleSort,
  sortDirection,
  className,
}: DataTableHeaderCellProps) {
  const sortable = onToggleSort !== undefined
  const SortIcon =
    sortDirection === 'asc' ? ArrowUp : sortDirection === 'desc' ? ArrowDown : ArrowUpDown

  return (
    <th
      scope="col"
      aria-sort={sortable ? (sortDirection ? ariaSortValue[sortDirection] : 'none') : undefined}
      className={cn(
        'border-b border-line-default px-3 py-2 align-middle',
        'font-mono text-3xs font-medium tracking-widest text-text-disabled whitespace-nowrap',
        thAlignClass[align],
        className
      )}
    >
      {sortable ? (
        <button
          type="button"
          onClick={onToggleSort}
          className={cn(
            'inline-flex w-full items-center gap-1 rounded-1 cursor-pointer select-none',
            'transition-colors duration-100 motion-reduce:transition-none',
            'hover:text-text-primary',
            'outline-none focus-visible:outline-solid focus-visible:outline-2',
            'focus-visible:outline-offset-2 focus-visible:outline-brand',
            '[&_svg]:size-4 [&_svg]:shrink-0',
            sortDirection && 'text-text-secondary',
            buttonJustifyClass[align]
          )}
        >
          {header}
          <SortIcon />
        </button>
      ) : (
        header
      )}
    </th>
  )
}
