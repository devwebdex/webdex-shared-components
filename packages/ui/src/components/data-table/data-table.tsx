'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/cn.js'
import { Skeleton } from '../skeleton/skeleton.js'
import { DataTableFooter } from './data-table-footer.js'
import { DataTableHeaderCell } from './data-table-header-cell.js'
import { DataTableRowActions } from './data-table-row-actions.js'
import { DataTableToolbar } from './data-table-toolbar.js'
import {
  dataTableCaptionClass,
  dataTableCellVariants,
  dataTableCheckboxClass,
  dataTableClass,
  dataTableContainerClass,
  dataTableFooterAreaClass,
  dataTableHeadVariants,
  dataTableRowVariants,
  dataTableScrollAreaClass,
  dataTableToolbarAreaClass,
} from './data-table-variants.js'
import type { DataTableColumn, DataTableProps } from './types.js'
import { useDataTable } from './use-data-table.js'

/**
 * DataTable do design system WEbdEX: tabela com ordenação, paginação, seleção, ações por linha,
 * alinhamento, densidade e colunas escondíveis. Todo estado é controlável ou não (prop + default
 * + callback) e vive no `useDataTable`; este componente só monta as partes.
 *
 * A área rolável vira região focável (`tabIndex`, `role="region"`) apenas quando o conteúdo
 * passa do tamanho dela: sem isso, quem usa teclado não rola a tabela.
 */
export function DataTable<Row>(props: DataTableProps<Row>) {
  // O resto são exatamente as opções do hook, com a mesma opcionalidade: nada de `undefined`
  // explícito, que o `exactOptionalPropertyTypes` recusa.
  const {
    caption,
    showCaption = false,
    rowActions,
    pageSizeOptions = [10, 20, 50],
    selectable = false,
    striped = false,
    stickyHeader = false,
    maxHeight,
    toolbar = true,
    toolbarStart,
    loading = false,
    emptyState,
    className,
    ...options
  } = props
  const state = useDataTable(options)
  const { scrollRef, scrollable } = useScrollable()

  const columns = state.visibleColumns
  const colSpan = columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)
  const cell = (column: DataTableColumn<Row>) =>
    cn(
      dataTableCellVariants({ align: column.align ?? state.align, density: state.density }),
      column.className
    )
  const fixedCell = dataTableCellVariants({ density: state.density })

  return (
    <div className={cn(dataTableContainerClass, className)}>
      {toolbar && (
        <div className={dataTableToolbarAreaClass}>
          <DataTableToolbar
            start={toolbarStart}
            align={state.align}
            onCycleAlign={state.cycleAlign}
            density={state.density}
            onToggleDensity={state.toggleDensity}
            columns={options.columns
              .filter((column) => column.hideable !== false)
              .map((column) => ({
                id: column.id,
                header: column.header,
                hidden: state.hiddenColumnIds.includes(column.id),
              }))}
            onToggleColumn={state.toggleColumn}
            selectedCount={state.selectedRowIds.length}
          />
        </div>
      )}

      <div
        ref={scrollRef}
        className={dataTableScrollAreaClass}
        style={maxHeight === undefined ? undefined : { maxHeight }}
        // Em objeto: o Biome não enxerga o `role` condicional e recusaria o `aria-label` solto.
        {...(scrollable && { tabIndex: 0, role: 'region', 'aria-label': caption })}
      >
        <table className={dataTableClass} aria-busy={loading || undefined}>
          <caption className={showCaption ? dataTableCaptionClass : 'sr-only'}>{caption}</caption>
          <thead className={dataTableHeadVariants({ sticky: stickyHeader })}>
            <tr>
              {selectable && (
                <th scope="col" className="w-px border-b border-line-default px-3 py-2">
                  <input
                    type="checkbox"
                    aria-label="Selecionar todas as linhas da página"
                    className={dataTableCheckboxClass}
                    checked={state.pageSelection === 'all'}
                    ref={(input) => {
                      if (input) input.indeterminate = state.pageSelection === 'some'
                    }}
                    onChange={state.togglePage}
                    disabled={loading || state.rows.length === 0}
                  />
                </th>
              )}
              {columns.map((column) => {
                const sortable = column.sortable === true && column.accessor !== undefined
                return (
                  <DataTableHeaderCell
                    key={column.id}
                    header={column.header}
                    align={column.align ?? state.align}
                    {...(sortable && { onToggleSort: () => state.toggleSort(column.id) })}
                    sortDirection={state.sort?.columnId === column.id ? state.sort.direction : null}
                    {...(column.className !== undefined && { className: column.className })}
                  />
                )
              })}
              {rowActions && (
                <th scope="col" className="w-px border-b border-line-default px-3 py-2">
                  <span className="sr-only">Ações</span>
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: state.pageSize }, (_, index) => (
                // As linhas de espera não têm identidade: só mudam de quantidade pelo fim.
                // biome-ignore lint/suspicious/noArrayIndexKey: ver acima.
                <tr key={index} className={dataTableRowVariants({ striped })}>
                  {selectable && <td className={fixedCell} />}
                  {columns.map((column) => (
                    <td key={column.id} className={cell(column)}>
                      <Skeleton className="h-4 w-full rounded-1" />
                    </td>
                  ))}
                  {rowActions && <td className={fixedCell} />}
                </tr>
              ))
            ) : state.rows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-7 text-center text-text-secondary">
                  {emptyState ?? 'Nenhum registro encontrado.'}
                </td>
              </tr>
            ) : (
              state.rows.map((row) => {
                const id = options.getRowId(row)
                const selected = state.isSelected(id)
                const name = rowName(row, id, columns[0])
                return (
                  <tr
                    key={id}
                    className={dataTableRowVariants({ striped })}
                    aria-selected={selectable ? selected : undefined}
                    data-selected={selectable ? selected : undefined}
                  >
                    {selectable && (
                      <td className={cn(fixedCell, 'w-px')}>
                        <input
                          type="checkbox"
                          aria-label={`Selecionar linha ${name}`}
                          className={dataTableCheckboxClass}
                          checked={selected}
                          onChange={() => state.toggleRow(id)}
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={column.id} className={cell(column)}>
                        {column.cell?.(row) ?? String(column.accessor?.(row) ?? '')}
                      </td>
                    ))}
                    {rowActions && (
                      <td className={cn(fixedCell, 'w-px text-right')}>
                        <DataTableRowActions
                          items={rowActions(row)}
                          label={`Ações da linha ${name}`}
                        />
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {options.pagination !== false && (
        <div className={dataTableFooterAreaClass}>
          <DataTableFooter
            page={state.page}
            pageCount={state.pageCount}
            pageSize={state.pageSize}
            totalRows={state.totalRows}
            onPageChange={state.setPage}
            onPageSizeChange={state.setPageSize}
            pageSizeOptions={pageSizeOptions}
          />
        </div>
      )}
    </div>
  )
}

/** Nome da linha nos rótulos: o texto da primeira coluna visível, ou o id se não houver texto. */
function rowName<Row>(row: Row, id: string, column: DataTableColumn<Row> | undefined) {
  const value = column?.accessor?.(row)
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') {
    const text = String(value).trim()
    if (text !== '') return text
  }
  return id
}

/** Diz se o conteúdo passa do tamanho da área, nos dois eixos. Reavalia quando qualquer um muda. */
function useScrollable() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollable, setScrollable] = useState(false)

  useEffect(() => {
    const area = scrollRef.current
    if (!area || typeof ResizeObserver === 'undefined') return
    const measure = () =>
      setScrollable(area.scrollHeight > area.clientHeight || area.scrollWidth > area.clientWidth)
    const observer = new ResizeObserver(measure)
    observer.observe(area)
    if (area.firstElementChild) observer.observe(area.firstElementChild)
    measure()
    return () => observer.disconnect()
  }, [])

  return { scrollRef, scrollable }
}
