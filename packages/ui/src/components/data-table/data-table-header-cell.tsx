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
 *
 * O filtro fica ao lado do título, fora do botão de ordenar (botão dentro de botão não é válido).
 * O `th` é sempre `relative`, para a alça de redimensionar se posicionar na borda direita. A
 * largura vai também em `minWidth`: sem ela, a tabela `w-full` encolhe a coluna abaixo do pedido.
 * Fixa à esquerda, a célula precisa de fundo opaco para o conteúdo rolado não aparecer por baixo;
 * o `top-0` do cabeçalho fixo vem do `thead`.
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
  filter,
  resizer,
  width,
  sticky = false,
  onToggleSort,
  sortDirection,
  className,
}: DataTableHeaderCellProps) {
  const sortable = onToggleSort !== undefined
  const SortIcon =
    sortDirection === 'asc' ? ArrowUp : sortDirection === 'desc' ? ArrowDown : ArrowUpDown

  const title = sortable ? (
    <button
      type="button"
      onClick={onToggleSort}
      className={cn(
        'inline-flex items-center gap-1 rounded-1 cursor-pointer select-none',
        'transition-colors duration-100 motion-reduce:transition-none',
        'hover:text-text-primary',
        'outline-none focus-visible:outline-solid focus-visible:outline-2',
        'focus-visible:outline-offset-2 focus-visible:outline-brand',
        '[&_svg]:size-4 [&_svg]:shrink-0',
        filter === undefined && 'w-full',
        sortDirection && 'text-text-secondary',
        buttonJustifyClass[align]
      )}
    >
      {header}
      <SortIcon />
    </button>
  ) : (
    header
  )

  return (
    <th
      scope="col"
      aria-sort={sortable ? (sortDirection ? ariaSortValue[sortDirection] : 'none') : undefined}
      style={width === undefined ? undefined : { width, minWidth: width }}
      className={cn(
        'relative border-b border-line-default px-3 py-2 align-middle',
        'font-mono text-3xs font-medium tracking-widest text-text-disabled whitespace-nowrap',
        thAlignClass[align],
        sticky && 'sticky left-0 z-20 bg-background',
        className
      )}
    >
      {filter === undefined ? (
        title
      ) : (
        <div className={cn('flex items-center gap-1', buttonJustifyClass[align])}>
          {title}
          {filter}
        </div>
      )}
      {resizer}
    </th>
  )
}
