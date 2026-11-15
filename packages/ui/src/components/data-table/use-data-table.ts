'use client'

import { useCallback, useMemo, useState } from 'react'
import type {
  DataTableAlign,
  DataTableDensity,
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

export function useDataTable<Row>(options: UseDataTableOptions<Row>): DataTableState<Row> {
  const { data, columns, getRowId, pagination = true } = options

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

  const sortedRows = useMemo(() => {
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
  }, [data, columns, sort])

  const totalRows = sortedRows.length
  const pageCount = pagination ? Math.max(1, Math.ceil(totalRows / pageSize)) : 1
  const page = clamp(rawPage, 1, pageCount)

  const rows = useMemo(
    () => (pagination ? sortedRows.slice((page - 1) * pageSize, page * pageSize) : sortedRows),
    [sortedRows, pagination, page, pageSize]
  )

  const setPage = (next: number) => {
    if (next !== page) setRawPage(clamp(next, 1, pageCount))
  }

  const setPageSize = (next: number) => {
    setRawPageSize(next)
    if (page !== 1) setRawPage(1)
  }

  const toggleSort = (columnId: string) => {
    const column = columns.find((candidate) => candidate.id === columnId)
    if (!column?.sortable || !column.accessor) return
    if (sort?.columnId !== columnId) setSort({ columnId, direction: 'asc' })
    else if (sort.direction === 'asc') setSort({ columnId, direction: 'desc' })
    else setSort(null)
    if (page !== 1) setRawPage(1)
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

  const toggleColumn = (id: string) => {
    const column = columns.find((candidate) => candidate.id === id)
    if (!column || column.hideable === false) return
    setHiddenColumnIds(
      hiddenColumnIds.includes(id)
        ? hiddenColumnIds.filter((hidden) => hidden !== id)
        : [...hiddenColumnIds, id]
    )
  }

  const visibleColumns = useMemo(
    () => columns.filter((column) => !hiddenColumnIds.includes(column.id)),
    [columns, hiddenColumnIds]
  )

  return {
    rows,
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
