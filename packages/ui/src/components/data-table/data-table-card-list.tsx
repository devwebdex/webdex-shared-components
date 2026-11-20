'use client'

import { Fragment, type ReactNode, useId } from 'react'
import { cn } from '../../lib/cn.js'
import type { MenuItem } from '../menu/menu.js'
import { ChevronRight } from './data-table-icons.js'
import { DataTableRowActions } from './data-table-row-actions.js'
import { dataTableCheckboxClass } from './data-table-variants.js'
import type { DataTableCardListProps, DataTableColumn } from './types.js'

/**
 * As linhas da DataTable como cards, para contêiner estreito (`mobileLayout="cards"`). Uma tabela
 * de muitas colunas em tela de celular só rola para o lado; o card empilha cada coluna como par
 * rótulo/valor, numa `<dl>`, que o leitor de tela anuncia como termo e definição.
 *
 * Seleção, ações e detalhes são os mesmos da tabela: o checkbox com a mesma classe, o botão "…"
 * da linha (DataTableRowActions) e "Detalhes" com `aria-expanded`, ligado ao conteúdo por
 * `aria-controls` (por isso o `useId` e o 'use client'). O card selecionado usa o fundo e a borda
 * da página atual da Pagination (brand-focus e brand-pressed), o mesmo tom da linha selecionada.
 *
 * Medidas na escala: padding 12px (`p-3`), raio 12px (`rounded-4`, o do contêiner da tabela),
 * 8px entre cards e entre os pares.
 */
export function DataTableCardList<Row>({
  rows,
  columns,
  getRowId,
  renderCell,
  rowLabel,
  rowActions,
  selectable = false,
  isSelected,
  toggleRow,
  renderExpanded,
  isExpanded,
  toggleExpanded,
}: DataTableCardListProps<Row>) {
  return (
    <ul className="flex flex-col gap-2 font-sans text-2xs text-text-secondary">
      {rows.map((row) => {
        const id = getRowId(row)
        return (
          <DataTableCard
            key={id}
            row={row}
            columns={columns}
            renderCell={renderCell}
            label={rowLabel(row)}
            actions={rowActions?.(row)}
            selectable={selectable}
            selected={isSelected(id)}
            onToggleSelected={() => toggleRow(id)}
            expanded={renderExpanded === undefined ? undefined : isExpanded(id)}
            onToggleExpanded={() => toggleExpanded(id)}
            details={renderExpanded?.(row)}
          />
        )
      })}
    </ul>
  )
}

type DataTableCardProps<Row> = {
  row: Row
  columns: DataTableColumn<Row>[]
  renderCell: DataTableCardListProps<Row>['renderCell']
  label: string
  actions: MenuItem[] | undefined
  selectable: boolean
  selected: boolean
  onToggleSelected: () => void
  /** `undefined`: a tabela não tem detalhes. */
  expanded: boolean | undefined
  onToggleExpanded: () => void
  details: ReactNode
}

function DataTableCard<Row>({
  row,
  columns,
  renderCell,
  label,
  actions,
  selectable,
  selected,
  onToggleSelected,
  expanded,
  onToggleExpanded,
  details,
}: DataTableCardProps<Row>) {
  const detailsId = useId()
  const hasActions = actions !== undefined && actions.length > 0

  return (
    <li
      className={cn(
        'flex flex-col gap-2 rounded-4 border border-line-default bg-surface-card p-3',
        'transition-colors duration-100 motion-reduce:transition-none',
        selected && 'border-brand-pressed bg-brand-focus text-text-primary'
      )}
    >
      {(selectable || hasActions) && (
        <div className="flex items-center justify-between gap-2">
          {selectable ? (
            <input
              type="checkbox"
              aria-label={`Selecionar ${label}`}
              checked={selected}
              onChange={onToggleSelected}
              className={dataTableCheckboxClass}
            />
          ) : (
            <span />
          )}
          {hasActions && <DataTableRowActions items={actions} label={`Ações de ${label}`} />}
        </div>
      )}
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
        {columns.map((column) => (
          <Fragment key={column.id}>
            <dt className="font-mono text-3xs font-medium tracking-widest text-text-disabled">
              {column.header}
            </dt>
            <dd className="min-w-0 break-words text-right">{renderCell(column, row)}</dd>
          </Fragment>
        ))}
      </dl>
      {expanded !== undefined && (
        <>
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={detailsId}
            onClick={onToggleExpanded}
            className={cn(
              'inline-flex items-center gap-1 self-start rounded-1 cursor-pointer select-none',
              'text-3xs font-medium text-text-secondary hover:text-text-primary',
              'outline-none focus-visible:outline-solid focus-visible:outline-2',
              'focus-visible:outline-offset-2 focus-visible:outline-brand',
              '[&_svg]:size-4 [&_svg]:shrink-0'
            )}
          >
            <ChevronRight
              className={cn(
                'transition-transform duration-200 motion-reduce:transition-none',
                expanded && 'rotate-90'
              )}
            />
            Detalhes
            {/* Vários cards na tela: o nome diz de qual linha, como "Detalhes de X" na tabela. */}{' '}
            <span className="sr-only">de {label}</span>
          </button>
          <div id={detailsId} hidden={!expanded} className="border-t border-line-default pt-2">
            {expanded && details}
          </div>
        </>
      )}
    </li>
  )
}
