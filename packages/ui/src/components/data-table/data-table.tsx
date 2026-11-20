'use client'

import { Fragment, type ReactNode, useEffect, useId, useRef, useState } from 'react'
import { cn } from '../../lib/cn.js'
import { Button } from '../button/button.js'
import { paginationItemClass } from '../pagination/pagination-item.js'
import { Skeleton } from '../skeleton/skeleton.js'
import { DataTableBulkBar } from './data-table-bulk-bar.js'
import { DataTableCardList } from './data-table-card-list.js'
import { DataTableColumnFilter } from './data-table-column-filter.js'
import { downloadBlob, downloadCsv, toCsv } from './data-table-csv.js'
import { DataTableFooter } from './data-table-footer.js'
import { DataTableHeaderCell } from './data-table-header-cell.js'
import { ChevronRight } from './data-table-icons.js'
import { DataTableResizer } from './data-table-resizer.js'
import { DataTableRowActions } from './data-table-row-actions.js'
import { DataTableSearch } from './data-table-search.js'
import { DataTableToolbar } from './data-table-toolbar.js'
import {
  dataTableActionsColClass,
  dataTableBulkAreaClass,
  dataTableCaptionClass,
  dataTableCardsAreaClass,
  dataTableCardsContainerClass,
  dataTableCellVariants,
  dataTableCheckboxClass,
  dataTableClass,
  dataTableContainerClass,
  dataTableControlCellClass,
  dataTableDetailCellClass,
  dataTableDetailRowClass,
  dataTableExpandButtonClass,
  dataTableFooterAreaClass,
  dataTableHeadVariants,
  dataTableRowVariants,
  dataTableScrollAreaCardsClass,
  dataTableScrollAreaClass,
  dataTableStickyBodyCellClass,
  dataTableStickyEdgeClass,
  dataTableStickyHeadCellVariants,
  dataTableStickyLeftClass,
  dataTableToolbarAreaClass,
} from './data-table-variants.js'
import { toXlsx } from './data-table-xlsx.js'
import type { DataTableColumn, DataTableProps } from './types.js'
import { useDataTable } from './use-data-table.js'

/** Largura mínima de redimensionar quando a coluna não diz a sua (a mesma do hook). */
const DEFAULT_MIN_WIDTH = 64

/**
 * DataTable do design system WEbdEX: tabela com ordenação, paginação, seleção, ações por linha,
 * alinhamento, densidade, colunas escondíveis, busca, filtro por coluna, ações em lote, linha
 * expansível, CSV, modo servidor, primeira coluna fixa, colunas redimensionáveis e cards em
 * contêiner estreito. Todo estado é controlável ou não (prop + default + callback) e vive no
 * `useDataTable`; este componente só monta as partes.
 *
 * A área rolável vira região focável (`tabIndex`, `role="region"`) apenas quando o conteúdo
 * passa do tamanho dela: sem isso, quem usa teclado não rola a tabela.
 *
 * Colunas de controle (seta de expandir e checkbox) têm 40px fixos: com `stickyFirstColumn`,
 * o `left` de cada célula fixa é a soma das larguras das anteriores, e só dá para somar com
 * largura conhecida.
 *
 * Cards (`mobileLayout="cards"`) são container query, não media query: a tabela pode estar numa
 * coluna estreita de uma tela larga. Carregando ou sem linhas, a tabela continua (o Skeleton e a
 * mensagem de vazio já cabem em uma coluna).
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
    searchable = false,
    searchPlaceholder,
    bulkActions,
    renderExpanded,
    exportable = false,
    exportFileName,
    excelExportable = false,
    excelFileName,
    stickyFirstColumn = false,
    resizableColumns = false,
    mobileLayout = 'scroll',
    loading = false,
    emptyState,
    className,
    ...options
  } = props
  const state = useDataTable(options)
  const { scrollRef, scrollable } = useScrollable()
  const detailIdPrefix = useId()
  const [exportingExcel, setExportingExcel] = useState(false)

  const columns = state.visibleColumns
  const expandable = renderExpanded !== undefined
  const controlCount = (expandable ? 1 : 0) + (selectable ? 1 : 0)
  const colSpan = columns.length + controlCount + (rowActions ? 1 : 0)
  const { tableRef, measuredWidths } = useHeaderWidths(resizableColumns, columns, controlCount)

  const stickyBody = (position: number, edge = false) =>
    cn(
      dataTableStickyBodyCellClass,
      dataTableStickyLeftClass[position],
      edge && dataTableStickyEdgeClass
    )
  const stickyHead = (position: number, edge = false) =>
    cn(
      dataTableStickyHeadCellVariants({ stickyHeader }),
      dataTableStickyLeftClass[position],
      edge && dataTableStickyEdgeClass
    )
  const cell = (column: DataTableColumn<Row>, index: number) =>
    cn(
      dataTableCellVariants({ align: column.align ?? state.align, density: state.density }),
      column.className,
      stickyFirstColumn && index === 0 && stickyBody(controlCount, true)
    )
  const fixedCell = dataTableCellVariants({ density: state.density })
  /** A seta tem 24px: com 8px de cada lado, a célula dá os mesmos 40px do checkbox. */
  const expandCell = cn(fixedCell, dataTableControlCellClass, 'px-2')
  const checkboxCell = cn(fixedCell, dataTableControlCellClass)
  /** Posição do checkbox entre as fixas (a seta vem antes dele). */
  const checkboxPosition = expandable ? 1 : 0
  const showBulkBar = bulkActions !== undefined && state.selectedRows.length > 0

  const renderCell = (column: DataTableColumn<Row>, row: Row): ReactNode =>
    column.cell?.(row) ?? String(column.accessor?.(row) ?? '')
  const rowLabel = (row: Row) => rowName(row, options.getRowId(row), columns[0])

  const showCards = mobileLayout === 'cards' && !loading && state.rows.length > 0

  const search = searchable && (
    <DataTableSearch
      value={state.globalFilter}
      onChange={state.setGlobalFilter}
      placeholder={searchPlaceholder ?? 'Buscar'}
      label={`Buscar em ${caption}`}
    />
  )

  return (
    <div
      className={cn(
        dataTableContainerClass,
        mobileLayout === 'cards' && dataTableCardsContainerClass,
        className
      )}
    >
      {toolbar && (
        <div className={dataTableToolbarAreaClass}>
          <DataTableToolbar
            start={
              searchable ? (
                <>
                  {search}
                  {toolbarStart}
                </>
              ) : (
                toolbarStart
              )
            }
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
            // Com a faixa de lote à vista, a contagem fica só nela.
            selectedCount={showBulkBar ? 0 : state.selectedRowIds.length}
            {...(exportable && {
              onExport: () =>
                downloadCsv(
                  toCsv(
                    state.selectedRows.length ? state.selectedRows : state.filteredRows,
                    columns
                  ),
                  exportFileName ?? 'tabela.csv'
                ),
            })}
            {...(excelExportable && {
              exportingExcel,
              onExportExcel: () => {
                setExportingExcel(true)
                toXlsx(
                  state.selectedRows.length ? state.selectedRows : state.filteredRows,
                  columns,
                  {
                    title: caption,
                  }
                )
                  .then((blob) => downloadBlob(blob, excelFileName ?? 'tabela.xlsx'))
                  .finally(() => setExportingExcel(false))
              },
            })}
            {...(state.isFiltered && { onClearFilters: state.clearFilters })}
          />
        </div>
      )}

      {showBulkBar && (
        <div className={dataTableBulkAreaClass}>
          <DataTableBulkBar
            count={state.selectedRows.length}
            actions={bulkActions(state.selectedRows)}
            onClear={state.clearSelection}
          />
        </div>
      )}

      <div
        ref={scrollRef}
        className={cn(dataTableScrollAreaClass, showCards && dataTableScrollAreaCardsClass)}
        style={maxHeight === undefined ? undefined : { maxHeight }}
        // Em objeto: o Biome não enxerga o `role` condicional e recusaria o `aria-label` solto.
        {...(scrollable && { tabIndex: 0, role: 'region', 'aria-label': caption })}
      >
        <table
          ref={tableRef}
          className={cn(dataTableClass, resizableColumns && 'table-fixed')}
          aria-busy={loading || undefined}
        >
          <caption className={showCaption ? dataTableCaptionClass : 'sr-only'}>{caption}</caption>
          {resizableColumns && (
            <colgroup>
              {expandable && <col className="w-[40px]" />}
              {selectable && <col className="w-[40px]" />}
              {columns.map((column) => {
                const width = state.columnWidths[column.id]
                return <col key={column.id} style={width === undefined ? undefined : { width }} />
              })}
              {rowActions && <col className={dataTableActionsColClass} />}
            </colgroup>
          )}
          <thead className={dataTableHeadVariants({ sticky: stickyHeader })}>
            <tr>
              {expandable && (
                <th
                  scope="col"
                  className={cn(
                    dataTableControlCellClass,
                    'border-b border-line-default px-2 py-2',
                    stickyFirstColumn && stickyHead(0)
                  )}
                >
                  <span className="sr-only">Detalhes</span>
                </th>
              )}
              {selectable && (
                <th
                  scope="col"
                  className={cn(
                    dataTableControlCellClass,
                    'border-b border-line-default px-3 py-2',
                    stickyFirstColumn && stickyHead(checkboxPosition)
                  )}
                >
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
              {columns.map((column, index) => {
                const sortable = column.sortable === true && column.accessor !== undefined
                const columnLabel = typeof column.header === 'string' ? column.header : column.id
                const width = state.columnWidths[column.id]
                const sticky = stickyFirstColumn && index === 0
                const headClass = cn(column.className, sticky && stickyHead(controlCount, true))
                return (
                  <DataTableHeaderCell
                    key={column.id}
                    header={column.header}
                    align={column.align ?? state.align}
                    {...(sortable && { onToggleSort: () => state.toggleSort(column.id) })}
                    sortDirection={state.sort?.columnId === column.id ? state.sort.direction : null}
                    {...(column.filterOptions && {
                      filter: (
                        <DataTableColumnFilter
                          columnLabel={columnLabel}
                          options={column.filterOptions}
                          selected={state.columnFilters[column.id] ?? []}
                          onChange={(values) => state.setColumnFilter(column.id, values)}
                        />
                      ),
                    })}
                    {...(resizableColumns && {
                      resizer: (
                        <DataTableResizer
                          columnLabel={columnLabel}
                          width={
                            width ??
                            measuredWidths[column.id] ??
                            column.minWidth ??
                            DEFAULT_MIN_WIDTH
                          }
                          minWidth={column.minWidth ?? DEFAULT_MIN_WIDTH}
                          onResize={(next) => state.setColumnWidth(column.id, next)}
                        />
                      ),
                    })}
                    {...(resizableColumns && width !== undefined && { width })}
                    {...(sticky && { sticky })}
                    {...(headClass !== '' && { className: headClass })}
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
                  {expandable && (
                    <td className={cn(expandCell, stickyFirstColumn && stickyBody(0))} />
                  )}
                  {selectable && (
                    <td
                      className={cn(
                        checkboxCell,
                        stickyFirstColumn && stickyBody(checkboxPosition)
                      )}
                    />
                  )}
                  {columns.map((column, columnIndex) => (
                    <td key={column.id} className={cell(column, columnIndex)}>
                      <Skeleton className="h-4 w-full rounded-1" />
                    </td>
                  ))}
                  {rowActions && <td className={fixedCell} />}
                </tr>
              ))
            ) : state.rows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-7 text-center text-text-secondary">
                  {state.isFiltered ? (
                    <div className="flex flex-col items-center gap-3">
                      <p>Nenhum resultado para a busca.</p>
                      <Button
                        size="small"
                        variant="outlined"
                        color="code"
                        onClick={state.clearFilters}
                      >
                        Limpar filtros
                      </Button>
                    </div>
                  ) : (
                    (emptyState ?? 'Nenhum registro encontrado.')
                  )}
                </td>
              </tr>
            ) : (
              state.rows.map((row, rowIndex) => {
                const id = options.getRowId(row)
                const selected = state.isSelected(id)
                const expanded = expandable && state.isExpanded(id)
                const name = rowName(row, id, columns[0])
                const detailId = `${detailIdPrefix}-detalhe-${rowIndex}`
                return (
                  <Fragment key={id}>
                    <tr
                      className={dataTableRowVariants({ striped })}
                      aria-selected={selectable ? selected : undefined}
                      data-selected={selectable ? selected : undefined}
                    >
                      {expandable && (
                        <td className={cn(expandCell, stickyFirstColumn && stickyBody(0))}>
                          <button
                            type="button"
                            aria-expanded={expanded}
                            aria-controls={detailId}
                            aria-label={`Detalhes de ${name}`}
                            onClick={() => state.toggleExpanded(id)}
                            className={cn(paginationItemClass, dataTableExpandButtonClass)}
                          >
                            <ChevronRight />
                          </button>
                        </td>
                      )}
                      {selectable && (
                        <td
                          className={cn(
                            checkboxCell,
                            stickyFirstColumn && stickyBody(checkboxPosition)
                          )}
                        >
                          <input
                            type="checkbox"
                            aria-label={`Selecionar linha ${name}`}
                            className={dataTableCheckboxClass}
                            checked={selected}
                            onChange={() => state.toggleRow(id)}
                          />
                        </td>
                      )}
                      {columns.map((column, columnIndex) => (
                        <td key={column.id} className={cell(column, columnIndex)}>
                          {renderCell(column, row)}
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
                    {expanded && (
                      <tr id={detailId} className={dataTableDetailRowClass}>
                        <td colSpan={colSpan} className={dataTableDetailCellClass}>
                          {renderExpanded?.(row)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {showCards && (
        <div className={dataTableCardsAreaClass}>
          <DataTableCardList
            rows={state.rows}
            columns={columns}
            getRowId={options.getRowId}
            renderCell={renderCell}
            rowLabel={rowLabel}
            {...(rowActions && { rowActions })}
            selectable={selectable}
            isSelected={state.isSelected}
            toggleRow={state.toggleRow}
            {...(renderExpanded && { renderExpanded })}
            isExpanded={state.isExpanded}
            toggleExpanded={state.toggleExpanded}
          />
        </div>
      )}

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

/**
 * Largura medida de cada coluna de dados, com `resizableColumns`. A alça precisa de uma largura
 * de partida: coluna sem largura definida (automática) começa da que o navegador deu a ela, não
 * de um número inventado, senão o primeiro arraste daria um salto.
 */
function useHeaderWidths<Row>(
  enabled: boolean,
  columns: DataTableColumn<Row>[],
  controlCount: number
) {
  const tableRef = useRef<HTMLTableElement>(null)
  const [measuredWidths, setMeasuredWidths] = useState<Record<string, number>>({})

  useEffect(() => {
    const table = tableRef.current
    if (!enabled || !table || typeof ResizeObserver === 'undefined') return
    const measure = () => {
      const cells = table.tHead?.rows[0]?.cells
      if (!cells) return
      const next: Record<string, number> = {}
      columns.forEach((column, index) => {
        const th = cells[controlCount + index]
        if (th) next[column.id] = Math.round(th.getBoundingClientRect().width)
      })
      // Mesmo resultado, mesmo objeto: não renderiza de novo à toa.
      setMeasuredWidths((previous) => (sameWidths(previous, next) ? previous : next))
    }
    const observer = new ResizeObserver(measure)
    observer.observe(table)
    measure()
    return () => observer.disconnect()
  }, [enabled, columns, controlCount])

  return { tableRef, measuredWidths }
}

function sameWidths(a: Record<string, number>, b: Record<string, number>) {
  const keys = Object.keys(a)
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key])
}
