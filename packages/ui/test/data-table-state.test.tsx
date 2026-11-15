import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { DataTableColumn, UseDataTableOptions } from '../src/components/data-table/types.js'
import { useDataTable } from '../src/components/data-table/use-data-table.js'

type Row = { id: string; name: string; amount: number | null; tag: string }

const rows: Row[] = [
  { id: 'a', name: 'Carteira 10', amount: 30, tag: 'x' },
  { id: 'b', name: 'carteira 2', amount: null, tag: 'y' },
  { id: 'c', name: 'Ávila', amount: 10, tag: 'x' },
  { id: 'd', name: 'Bruno', amount: 30, tag: 'y' },
  { id: 'e', name: 'Ana', amount: 20, tag: 'x' },
]

const columns: DataTableColumn<Row>[] = [
  { id: 'name', header: 'Nome', accessor: (row) => row.name, sortable: true, hideable: false },
  { id: 'amount', header: 'Valor', accessor: (row) => row.amount, sortable: true },
  { id: 'tag', header: 'Tag', accessor: (row) => row.tag },
  { id: 'actions', header: 'Ações' },
]

function setup(options: Partial<UseDataTableOptions<Row>> = {}) {
  return renderHook(
    (props: Partial<UseDataTableOptions<Row>>) =>
      useDataTable<Row>({ data: rows, columns, getRowId: (row) => row.id, ...props }),
    { initialProps: options }
  )
}

const ids = (list: Row[]) => list.map((row) => row.id)

describe('useDataTable: ordenação', () => {
  it('cicla nada → asc → desc → nada, com nulos no fim e empates estáveis', () => {
    const { result } = setup()
    expect(ids(result.current.rows)).toEqual(['a', 'b', 'c', 'd', 'e'])

    act(() => result.current.toggleSort('amount'))
    expect(result.current.sort).toEqual({ columnId: 'amount', direction: 'asc' })
    expect(ids(result.current.rows)).toEqual(['c', 'e', 'a', 'd', 'b'])

    act(() => result.current.toggleSort('amount'))
    expect(result.current.sort).toEqual({ columnId: 'amount', direction: 'desc' })
    expect(ids(result.current.rows)).toEqual(['a', 'd', 'e', 'c', 'b'])

    act(() => result.current.toggleSort('amount'))
    expect(result.current.sort).toBeNull()
    expect(ids(result.current.rows)).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('compara texto em pt-BR, com números em ordem natural', () => {
    const { result } = setup({ defaultSort: { columnId: 'name', direction: 'asc' } })
    expect(result.current.rows.map((row) => row.name)).toEqual([
      'Ana',
      'Ávila',
      'Bruno',
      'carteira 2',
      'Carteira 10',
    ])
  })

  it('compara datas e bigint pelo valor', () => {
    type Event = { id: string; at: Date; big: bigint }
    const data: Event[] = [
      { id: '1', at: new Date('2025-03-01'), big: 30n },
      { id: '2', at: new Date('2024-01-01'), big: 10n },
      { id: '3', at: new Date('2025-01-01'), big: 20n },
    ]
    const cols: DataTableColumn<Event>[] = [
      { id: 'at', header: 'Data', accessor: (row) => row.at, sortable: true },
      { id: 'big', header: 'Big', accessor: (row) => row.big, sortable: true },
    ]
    const { result } = renderHook(() =>
      useDataTable({ data, columns: cols, getRowId: (row) => row.id })
    )
    act(() => result.current.toggleSort('at'))
    expect(result.current.rows.map((row) => row.id)).toEqual(['2', '3', '1'])
    act(() => result.current.toggleSort('big'))
    expect(result.current.rows.map((row) => row.id)).toEqual(['2', '3', '1'])
    act(() => result.current.toggleSort('big'))
    expect(result.current.rows.map((row) => row.id)).toEqual(['1', '3', '2'])
  })

  it('trocar de coluna começa em asc', () => {
    const { result } = setup()
    act(() => result.current.toggleSort('amount'))
    act(() => result.current.toggleSort('amount'))
    act(() => result.current.toggleSort('name'))
    expect(result.current.sort).toEqual({ columnId: 'name', direction: 'asc' })
  })

  it('ignora coluna sem accessor ou não sortable', () => {
    const { result } = setup()
    act(() => result.current.toggleSort('tag'))
    act(() => result.current.toggleSort('actions'))
    act(() => result.current.toggleSort('inexistente'))
    expect(result.current.sort).toBeNull()
  })

  it('ordenar volta para a página 1', () => {
    const { result } = setup({ defaultPageSize: 2, defaultPage: 3 })
    expect(result.current.page).toBe(3)
    act(() => result.current.toggleSort('name'))
    expect(result.current.page).toBe(1)
  })
})

describe('useDataTable: paginação', () => {
  it('fatia as linhas e conta as páginas', () => {
    const { result } = setup({ defaultPageSize: 2 })
    expect(result.current.pageCount).toBe(3)
    expect(result.current.totalRows).toBe(5)
    expect(ids(result.current.rows)).toEqual(['a', 'b'])
    act(() => result.current.setPage(3))
    expect(ids(result.current.rows)).toEqual(['e'])
  })

  it('tem ao menos uma página, mesmo sem dados', () => {
    const { result } = setup({ data: [] })
    expect(result.current.pageCount).toBe(1)
    expect(result.current.page).toBe(1)
    expect(result.current.rows).toEqual([])
  })

  it('limita a página quando os dados encolhem', () => {
    const { result, rerender } = setup({ defaultPageSize: 2, defaultPage: 3 })
    rerender({ defaultPageSize: 2, data: rows.slice(0, 2) })
    expect(result.current.page).toBe(1)
    expect(ids(result.current.rows)).toEqual(['a', 'b'])
  })

  it('setPageSize volta para a página 1', () => {
    const onPageChange = vi.fn()
    const onPageSizeChange = vi.fn()
    const { result } = setup({ defaultPageSize: 2, defaultPage: 2, onPageChange, onPageSizeChange })
    act(() => result.current.setPageSize(20))
    expect(result.current.pageSize).toBe(20)
    expect(result.current.page).toBe(1)
    expect(onPageSizeChange).toHaveBeenCalledWith(20)
    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('sem paginação, devolve todas as linhas numa página', () => {
    const { result } = setup({ pagination: false, defaultPageSize: 2 })
    expect(result.current.rows).toHaveLength(5)
    expect(result.current.pageCount).toBe(1)
  })
})

describe('useDataTable: seleção', () => {
  it('preserva a seleção entre páginas e ordenações', () => {
    const { result } = setup({ defaultPageSize: 2 })
    act(() => result.current.toggleRow('a'))
    act(() => result.current.setPage(2))
    act(() => result.current.toggleRow('c'))
    act(() => result.current.toggleSort('amount'))
    expect(result.current.selectedRowIds).toEqual(['a', 'c'])
    expect(result.current.isSelected('a')).toBe(true)
    expect(result.current.isSelected('b')).toBe(false)
    act(() => result.current.toggleRow('a'))
    expect(result.current.selectedRowIds).toEqual(['c'])
  })

  it('togglePage marca a página e desmarca se já estava toda marcada', () => {
    const { result } = setup({ defaultPageSize: 2, defaultSelectedRowIds: ['e'] })
    expect(result.current.pageSelection).toBe('none')

    act(() => result.current.toggleRow('a'))
    expect(result.current.pageSelection).toBe('some')

    act(() => result.current.togglePage())
    expect(result.current.pageSelection).toBe('all')
    expect(result.current.selectedRowIds).toEqual(['e', 'a', 'b'])

    act(() => result.current.togglePage())
    expect(result.current.pageSelection).toBe('none')
    expect(result.current.selectedRowIds).toEqual(['e'])
  })

  it('sem linhas, a seleção da página é none', () => {
    const { result } = setup({ data: [], defaultSelectedRowIds: ['a'] })
    expect(result.current.pageSelection).toBe('none')
  })
})

describe('useDataTable: modo controlado', () => {
  it('a prop manda e o on*Change recebe o próximo valor', () => {
    const onPageChange = vi.fn()
    const onSortChange = vi.fn()
    const onSelectionChange = vi.fn()
    const onAlignChange = vi.fn()
    const { result, rerender } = setup({
      defaultPageSize: 2,
      page: 2,
      onPageChange,
      sort: null,
      onSortChange,
      selectedRowIds: [],
      onSelectionChange,
      align: 'end',
      onAlignChange,
    })

    act(() => result.current.setPage(3))
    expect(onPageChange).toHaveBeenCalledWith(3)
    expect(result.current.page).toBe(2)

    act(() => result.current.toggleSort('name'))
    expect(onSortChange).toHaveBeenCalledWith({ columnId: 'name', direction: 'asc' })
    expect(result.current.sort).toBeNull()
    expect(onPageChange).toHaveBeenLastCalledWith(1)

    act(() => result.current.toggleRow('c'))
    expect(onSelectionChange).toHaveBeenCalledWith(['c'])
    expect(result.current.selectedRowIds).toEqual([])

    act(() => result.current.cycleAlign())
    expect(onAlignChange).toHaveBeenCalledWith('start')
    expect(result.current.align).toBe('end')

    rerender({
      defaultPageSize: 2,
      page: 3,
      sort: { columnId: 'name', direction: 'desc' },
      selectedRowIds: ['c'],
    })
    expect(result.current.page).toBe(3)
    expect(result.current.sort).toEqual({ columnId: 'name', direction: 'desc' })
    expect(result.current.isSelected('c')).toBe(true)
  })

  it('não chama on*Change quando o valor não muda', () => {
    const onPageChange = vi.fn()
    const { result } = setup({ onPageChange })
    act(() => result.current.setPage(1))
    expect(onPageChange).not.toHaveBeenCalled()
  })
})

describe('useDataTable: aparência e colunas', () => {
  it('cycleAlign avança start → center → end → start', () => {
    const { result } = setup()
    expect(result.current.align).toBe('start')
    act(() => result.current.cycleAlign())
    expect(result.current.align).toBe('center')
    act(() => result.current.cycleAlign())
    expect(result.current.align).toBe('end')
    act(() => result.current.cycleAlign())
    expect(result.current.align).toBe('start')
  })

  it('toggleDensity alterna comfortable e compact', () => {
    const onDensityChange = vi.fn()
    const { result } = setup({ onDensityChange })
    expect(result.current.density).toBe('comfortable')
    act(() => result.current.toggleDensity())
    expect(result.current.density).toBe('compact')
    act(() => result.current.toggleDensity())
    expect(result.current.density).toBe('comfortable')
    expect(onDensityChange.mock.calls).toEqual([['compact'], ['comfortable']])
  })

  it('toggleColumn esconde e mostra, mantém a ordem e respeita hideable false', () => {
    const { result } = setup()
    act(() => result.current.toggleColumn('amount'))
    expect(result.current.hiddenColumnIds).toEqual(['amount'])
    expect(result.current.visibleColumns.map((column) => column.id)).toEqual([
      'name',
      'tag',
      'actions',
    ])

    act(() => result.current.toggleColumn('name'))
    expect(result.current.hiddenColumnIds).toEqual(['amount'])

    act(() => result.current.toggleColumn('amount'))
    expect(result.current.visibleColumns.map((column) => column.id)).toEqual([
      'name',
      'amount',
      'tag',
      'actions',
    ])
  })
})
