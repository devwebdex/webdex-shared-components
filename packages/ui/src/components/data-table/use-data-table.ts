'use client'

import { useCallback, useMemo, useState } from 'react'
import type {
  DataTableAlign,
  DataTableColumn,
  DataTableDensity,
  DataTableSort,
  DataTableSortValue,
  DataTableState,
  UseDataTableOptions,
} from './types.js'

const NEXT_ALIGN: Record<DataTableAlign, DataTableAlign> = {
  start: 'center',
  center: 'end',
  end: 'start',
}

const NO_IDS: string[] = []
const NO_FILTERS: Record<string, string[]> = {}
const DEFAULT_MIN_WIDTH = 64

export function useDataTable<Row>(options: UseDataTableOptions<Row>): DataTableState<Row> {
  const { data, columns, getRowId, pagination = true, manual = false } = options

  const [sort, setSort] = useControllable(
    options.sort,
    options.defaultSort ?? null,
    options.onSortChange
  )
  const [rawPage, setRawPage] = useControllable(
    options.page,
    options.defaultPage ?? 1,
    options.onPageChange
  )
  const [pageSize, setRawPageSize] = useControllable(
    options.pageSize,
    options.defaultPageSize ?? 10,
    options.onPageSizeChange
  )
  const [selectedRowIds, setSelectedRowIds] = useControllable(
    options.selectedRowIds,
    options.defaultSelectedRowIds ?? NO_IDS,
    options.onSelectionChange
  )
  const [align, setAlign] = useControllable(
    options.align,
    options.defaultAlign ?? 'start',
    options.onAlignChange
  )
  const [density, setDensity] = useControllable<DataTableDensity>(
    options.density,
    options.defaultDensity ?? 'comfortable',
    options.onDensityChange
  )
  const [hiddenColumnIds, setHiddenColumnIds] = useControllable(
    options.hiddenColumnIds,
    options.defaultHiddenColumnIds ?? NO_IDS,
    options.onHiddenColumnsChange
  )

  const [globalFilter, setRawGlobalFilter] = useControllable(
    options.globalFilter,
    options.defaultGlobalFilter ?? '',
    options.onGlobalFilterChange
  )
  const [columnFilters, setColumnFilters] = useControllable(
    options.columnFilters,
    options.defaultColumnFilters ?? NO_FILTERS,
    options.onColumnFiltersChange
  )
  const [expandedRowIds, setExpandedRowIds] = useControllable(
    options.expandedRowIds,
    options.defaultExpandedRowIds ?? NO_IDS,
    options.onExpandedChange
  )
  const [columnWidths, setColumnWidths] = useControllable(
    options.columnWidths,
    options.defaultColumnWidths ?? initialWidths(columns),
    options.onColumnWidthsChange
  )

  const visibleColumns = useMemo(
    () => columns.filter((column) => !hiddenColumnIds.includes(column.id)),
    [columns, hiddenColumnIds]
  )

  const filteredRows = useMemo(() => {
    if (manual) return data
    const matching = filterRows(data, columns, visibleColumns, globalFilter, columnFilters)
    return sortRows(matching, columns, sort)
  }, [manual, data, columns, visibleColumns, globalFilter, columnFilters, sort])

  const totalRows = manual ? (options.rowCount ?? data.length) : filteredRows.length
  const pageCount = pagination ? Math.max(1, Math.ceil(totalRows / pageSize)) : 1
  const page = clamp(rawPage, 1, pageCount)

  const rows = useMemo(
    () =>
      pagination && !manual
        ? filteredRows.slice((page - 1) * pageSize, page * pageSize)
        : filteredRows,
    [filteredRows, pagination, manual, page, pageSize]
  )

  const backToFirstPage = () => {
    if (page !== 1) setRawPage(1)
  }

  const setPage = (next: number) => {
    if (next !== page) setRawPage(clamp(next, 1, pageCount))
  }

  const setPageSize = (next: number) => {
    setRawPageSize(next)
    backToFirstPage()
  }

  const toggleSort = (columnId: string) => {
    const column = columns.find((candidate) => candidate.id === columnId)
    if (!column?.sortable || !column.accessor) return
    if (sort?.columnId !== columnId) setSort({ columnId, direction: 'asc' })
    else if (sort.direction === 'asc') setSort({ columnId, direction: 'desc' })
    else setSort(null)
    backToFirstPage()
  }

  const setGlobalFilter = (value: string) => {
    if (value === globalFilter) return
    setRawGlobalFilter(value)
    backToFirstPage()
  }

  const setColumnFilter = (columnId: string, values: string[]) => {
    const current = columnFilters[columnId] ?? NO_IDS
    if (sameIds(current, values)) return
    const { [columnId]: _removed, ...rest } = columnFilters
    setColumnFilters(values.length > 0 ? { ...rest, [columnId]: values } : rest)
    backToFirstPage()
  }

  const isFiltered =
    globalFilter.trim() !== '' || Object.values(columnFilters).some((values) => values.length > 0)

  const clearFilters = () => {
    const hasSearch = globalFilter !== ''
    const hasColumnFilters = Object.keys(columnFilters).length > 0
    if (hasSearch) setRawGlobalFilter('')
    if (hasColumnFilters) setColumnFilters(NO_FILTERS)
    if (hasSearch || hasColumnFilters) backToFirstPage()
  }

  const selectedSet = useMemo(() => new Set(selectedRowIds), [selectedRowIds])
  const pageRowIds = rows.map(getRowId)
  const selectedOnPage = pageRowIds.filter((id) => selectedSet.has(id)).length
  const pageSelection =
    selectedOnPage === 0 ? 'none' : selectedOnPage === pageRowIds.length ? 'all' : 'some'

  const isSelected = useCallback((id: string) => selectedSet.has(id), [selectedSet])

  const toggleRow = (id: string) => {
    setSelectedRowIds(
      selectedSet.has(id)
        ? selectedRowIds.filter((selected) => selected !== id)
        : [...selectedRowIds, id]
    )
  }

  const togglePage = () => {
    if (pageRowIds.length === 0) return
    if (pageSelection === 'all') {
      const onPage = new Set(pageRowIds)
      setSelectedRowIds(selectedRowIds.filter((id) => !onPage.has(id)))
    } else {
      setSelectedRowIds([...selectedRowIds, ...pageRowIds.filter((id) => !selectedSet.has(id))])
    }
  }

  const selectedRows = useMemo(
    () => data.filter((row) => selectedSet.has(getRowId(row))),
    [data, getRowId, selectedSet]
  )

  const clearSelection = () => {
    if (selectedRowIds.length > 0) setSelectedRowIds(NO_IDS)
  }

  const expandedSet = useMemo(() => new Set(expandedRowIds), [expandedRowIds])
  const isExpanded = useCallback((id: string) => expandedSet.has(id), [expandedSet])

  const toggleExpanded = (id: string) => {
    setExpandedRowIds(
      expandedSet.has(id)
        ? expandedRowIds.filter((expanded) => expanded !== id)
        : [...expandedRowIds, id]
    )
  }

  const setColumnWidth = (columnId: string, width: number) => {
    if (!Number.isFinite(width)) return
    const column = columns.find((candidate) => candidate.id === columnId)
    const next = Math.max(Math.round(width), column?.minWidth ?? DEFAULT_MIN_WIDTH)
    if (columnWidths[columnId] === next) return
    setColumnWidths({ ...columnWidths, [columnId]: next })
  }

  const toggleColumn = (id: string) => {
    const column = columns.find((candidate) => candidate.id === id)
    if (!column || column.hideable === false) return
    setHiddenColumnIds(
      hiddenColumnIds.includes(id)
        ? hiddenColumnIds.filter((hidden) => hidden !== id)
        : [...hiddenColumnIds, id]
    )
  }

  return {
    rows,
    filteredRows,
    totalRows,
    page,
    pageCount,
    pageSize,
    setPage,
    setPageSize,
    sort,
    toggleSort,
    selectedRowIds,
    isSelected,
    toggleRow,
    togglePage,
    pageSelection,
    align,
    setAlign,
    cycleAlign: () => setAlign(NEXT_ALIGN[align]),
    density,
    setDensity,
    toggleDensity: () => setDensity(density === 'comfortable' ? 'compact' : 'comfortable'),
    hiddenColumnIds,
    toggleColumn,
    visibleColumns,
    globalFilter,
    setGlobalFilter,
    columnFilters,
    setColumnFilter,
    clearFilters,
    isFiltered,
    selectedRows,
    clearSelection,
    expandedRowIds,
    isExpanded,
    toggleExpanded,
    columnWidths,
    setColumnWidth,
  }
}

/**
 * Valor controlado ou interno, no padrão dos outros componentes: com `value` definido, ele manda
 * e o estado interno é ignorado; `onChange` é chamado sempre que o valor muda.
 */
function useControllable<T>(
  value: T | undefined,
  defaultValue: T,
  onChange: ((next: T) => void) | undefined
): [T, (next: T) => void] {
  const [internal, setInternal] = useState(defaultValue)
  const current = value === undefined ? internal : value
  const set = (next: T) => {
    if (Object.is(next, current)) return
    if (value === undefined) setInternal(next)
    onChange?.(next)
  }
  return [current, set]
}

/**
 * Busca global e filtros de coluna. A busca olha só as colunas visíveis: o que não está na tela
 * não explica por que a linha apareceu. Os filtros de coluna valem mesmo com a coluna escondida,
 * porque continuam ativos no estado (e `clearFilters` os limpa).
 */
function filterRows<Row>(
  data: Row[],
  columns: DataTableColumn<Row>[],
  visibleColumns: DataTableColumn<Row>[],
  globalFilter: string,
  columnFilters: Record<string, string[]>
): Row[] {
  const term = normalizeText(globalFilter)
  const searchable = term === '' ? [] : visibleColumns.filter(isSearchable)
  const filters = Object.entries(columnFilters).flatMap(([columnId, values]) => {
    const column = columns.find((candidate) => candidate.id === columnId)
    if (!column || values.length === 0 || (!column.filterValue && !column.accessor)) return []
    return [{ column, values: new Set(values) }]
  })
  if (term === '' && filters.length === 0) return data

  return data.filter((row) => {
    const passesFilters = filters.every(({ column, values }) =>
      values.has(column.filterValue?.(row) ?? toText(column.accessor?.(row)))
    )
    if (!passesFilters) return false
    if (term === '') return true
    return searchable.some((column) => normalizeText(searchText(column, row)).includes(term))
  })
}

function isSearchable<Row>(column: DataTableColumn<Row>) {
  if (column.searchValue === false) return false
  return Boolean(column.searchValue ?? column.accessor)
}

function searchText<Row>(column: DataTableColumn<Row>, row: Row) {
  if (typeof column.searchValue === 'function') return column.searchValue(row)
  const value = column.accessor?.(row)
  // String(date) sai em inglês ("Sat Nov 14 2026"): a busca usa a data como a pessoa a lê
  // (14/11/2026, 17:19) e em ISO (2026-11-14), para "14/11" e "2026-11" encontrarem.
  if (value instanceof Date) return `${value.toLocaleString('pt-BR')} ${value.toISOString()}`
  return toText(value)
}

/** Minúsculas, sem acento e sem espaço nas pontas: "  Ávila " encontra "avila". */
function normalizeText(value: string) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
}

function toText(value: DataTableSortValue) {
  return value == null ? '' : String(value)
}

function sortRows<Row>(
  data: Row[],
  columns: DataTableColumn<Row>[],
  sort: DataTableSort | null
): Row[] {
  const accessor = sort && columns.find((column) => column.id === sort.columnId)?.accessor
  if (!sort || !accessor) return data
  const factor = sort.direction === 'asc' ? 1 : -1
  // Array.prototype.sort é estável: empates mantêm a ordem original dos dados.
  return data
    .map((row) => ({ row, value: accessor(row) }))
    .sort((a, b) => {
      // Vazios ficam no fim nas duas direções, então não passam pelo `factor`.
      if (a.value == null) return b.value == null ? 0 : 1
      if (b.value == null) return -1
      return compareValues(a.value, b.value) * factor
    })
    .map(({ row }) => row)
}

function initialWidths<Row>(columns: DataTableColumn<Row>[]): Record<string, number> {
  const widths: Record<string, number> = {}
  for (const column of columns) {
    if (column.width !== undefined) widths[column.id] = column.width
  }
  return widths
}

function sameIds(a: string[], b: string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index])
}

function compareValues(a: NonNullable<DataTableSortValue>, b: NonNullable<DataTableSortValue>) {
  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b, 'pt-BR', { numeric: true })
  }
  const left = a instanceof Date ? a.getTime() : a
  const right = b instanceof Date ? b.getTime() : b
  return left < right ? -1 : left > right ? 1 : 0
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
