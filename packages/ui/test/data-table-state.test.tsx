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

describe('useDataTable: busca global', () => {
  it('ignora caixa e acento e devolve filteredRows e totalRows sem paginar', () => {
    const { result } = setup({ defaultPageSize: 1 })
    act(() => result.current.setGlobalFilter('  AVI '))
    expect(ids(result.current.filteredRows)).toEqual(['c'])
    act(() => result.current.setGlobalFilter('carteira'))
    expect(ids(result.current.filteredRows)).toEqual(['a', 'b'])
    expect(result.current.totalRows).toBe(2)
    expect(ids(result.current.rows)).toEqual(['a'])
    expect(result.current.isFiltered).toBe(true)
  })

  it('busca vazia não filtra', () => {
    const { result } = setup()
    act(() => result.current.setGlobalFilter('   '))
    expect(result.current.totalRows).toBe(5)
    expect(result.current.isFiltered).toBe(false)
  })

  it('usa searchValue, ignora coluna com searchValue false e colunas escondidas', () => {
    const cols: DataTableColumn<Row>[] = [
      { id: 'name', header: 'Nome', accessor: (row) => row.name, searchValue: false },
      {
        id: 'tag',
        header: 'Tag',
        accessor: (row) => row.tag,
        searchValue: (row) => `tag-${row.tag}`,
      },
      { id: 'amount', header: 'Valor', accessor: (row) => row.amount },
    ]
    const { result } = setup({ columns: cols })
    act(() => result.current.setGlobalFilter('bruno'))
    expect(result.current.filteredRows).toEqual([])
    act(() => result.current.setGlobalFilter('tag-y'))
    expect(ids(result.current.filteredRows)).toEqual(['b', 'd'])
    act(() => result.current.setGlobalFilter('30'))
    expect(ids(result.current.filteredRows)).toEqual(['a', 'd'])
    act(() => result.current.toggleColumn('amount'))
    expect(result.current.filteredRows).toEqual([])
  })

  it('filtra antes de ordenar', () => {
    const { result } = setup({ defaultSort: { columnId: 'amount', direction: 'desc' } })
    act(() => result.current.setGlobalFilter('a'))
    expect(ids(result.current.filteredRows)).toEqual(['a', 'e', 'c', 'b'])
  })

  it('mudar a busca volta para a página 1, sem chamar onPageChange se já está nela', () => {
    const onPageChange = vi.fn()
    const onGlobalFilterChange = vi.fn()
    const { result } = setup({
      defaultPageSize: 2,
      defaultPage: 2,
      onPageChange,
      onGlobalFilterChange,
    })
    act(() => result.current.setGlobalFilter('a'))
    expect(result.current.page).toBe(1)
    expect(onPageChange).toHaveBeenCalledTimes(1)
    act(() => result.current.setGlobalFilter('ab'))
    expect(onPageChange).toHaveBeenCalledTimes(1)
    act(() => result.current.setGlobalFilter('ab'))
    expect(onGlobalFilterChange.mock.calls).toEqual([['a'], ['ab']])
  })
})

describe('useDataTable: filtros de coluna', () => {
  it('OR dentro da coluna, AND entre colunas, e lista vazia remove a chave', () => {
    const onColumnFiltersChange = vi.fn()
    const cols: DataTableColumn<Row>[] = [
      ...columns,
      {
        id: 'big',
        header: 'Alto',
        filterValue: (row) => ((row.amount ?? 0) >= 30 ? 'sim' : 'não'),
      },
    ]
    const { result } = setup({ columns: cols, onColumnFiltersChange })

    act(() => result.current.setColumnFilter('tag', ['x', 'y']))
    expect(result.current.totalRows).toBe(5)
    act(() => result.current.setColumnFilter('tag', ['x']))
    expect(ids(result.current.filteredRows)).toEqual(['a', 'c', 'e'])
    act(() => result.current.setColumnFilter('big', ['sim']))
    expect(ids(result.current.filteredRows)).toEqual(['a'])
    expect(result.current.columnFilters).toEqual({ tag: ['x'], big: ['sim'] })

    act(() => result.current.setColumnFilter('tag', []))
    expect(result.current.columnFilters).toEqual({ big: ['sim'] })
    expect(ids(result.current.filteredRows)).toEqual(['a', 'd'])

    act(() => result.current.setColumnFilter('tag', []))
    expect(onColumnFiltersChange).toHaveBeenCalledTimes(4)
  })

  it('compara o accessor como texto', () => {
    const { result } = setup()
    act(() => result.current.setColumnFilter('amount', ['30', '10']))
    expect(ids(result.current.filteredRows)).toEqual(['a', 'c', 'd'])
  })

  it('mudar um filtro volta para a página 1', () => {
    const onPageChange = vi.fn()
    const { result } = setup({ defaultPageSize: 1, defaultPage: 3, onPageChange })
    act(() => result.current.setColumnFilter('tag', ['x']))
    expect(result.current.page).toBe(1)
    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('clearFilters limpa busca e filtros, chamando cada on*Change uma vez', () => {
    const onGlobalFilterChange = vi.fn()
    const onColumnFiltersChange = vi.fn()
    const onPageChange = vi.fn()
    const { result } = setup({
      defaultGlobalFilter: 'a',
      defaultColumnFilters: { tag: ['x'] },
      defaultPageSize: 1,
      defaultPage: 2,
      onGlobalFilterChange,
      onColumnFiltersChange,
      onPageChange,
    })
    expect(result.current.isFiltered).toBe(true)
    expect(ids(result.current.filteredRows)).toEqual(['a', 'c', 'e'])

    act(() => result.current.clearFilters())
    expect(result.current.isFiltered).toBe(false)
    expect(result.current.totalRows).toBe(5)
    expect(result.current.page).toBe(1)
    expect(onGlobalFilterChange.mock.calls).toEqual([['']])
    expect(onColumnFiltersChange.mock.calls).toEqual([[{}]])
    expect(onPageChange.mock.calls).toEqual([[1]])

    act(() => result.current.clearFilters())
    expect(onGlobalFilterChange).toHaveBeenCalledTimes(1)
    expect(onColumnFiltersChange).toHaveBeenCalledTimes(1)
  })

  it('só com filtro de coluna também conta como isFiltered', () => {
    const { result } = setup({ defaultColumnFilters: { tag: ['y'] } })
    expect(result.current.isFiltered).toBe(true)
  })
})

describe('useDataTable: modo manual', () => {
  it('não filtra, não ordena nem pagina; pageCount vem do rowCount', () => {
    const { result } = setup({
      manual: true,
      rowCount: 42,
      defaultPageSize: 2,
      defaultGlobalFilter: 'bruno',
      defaultColumnFilters: { tag: ['x'] },
      defaultSort: { columnId: 'amount', direction: 'asc' },
    })
    expect(ids(result.current.rows)).toEqual(['a', 'b', 'c', 'd', 'e'])
    expect(result.current.filteredRows).toBe(rows)
    expect(result.current.totalRows).toBe(42)
    expect(result.current.pageCount).toBe(21)
  })

  it('sem rowCount usa data.length', () => {
    const { result } = setup({ manual: true, defaultPageSize: 2 })
    expect(result.current.totalRows).toBe(5)
    expect(result.current.pageCount).toBe(3)
  })

  it('a página é limitada só pelo pageCount, e os setters avisam o servidor', () => {
    const onPageChange = vi.fn()
    const onSortChange = vi.fn()
    const onGlobalFilterChange = vi.fn()
    const onColumnFiltersChange = vi.fn()
    const { result } = setup({
      manual: true,
      rowCount: 100,
      defaultPageSize: 10,
      onPageChange,
      onSortChange,
      onGlobalFilterChange,
      onColumnFiltersChange,
    })
    act(() => result.current.setPage(7))
    expect(result.current.page).toBe(7)
    expect(ids(result.current.rows)).toEqual(['a', 'b', 'c', 'd', 'e'])
    expect(onPageChange).toHaveBeenLastCalledWith(7)

    act(() => result.current.setPage(50))
    expect(result.current.page).toBe(10)

    act(() => result.current.toggleSort('name'))
    expect(onSortChange).toHaveBeenCalledWith({ columnId: 'name', direction: 'asc' })
    expect(onPageChange).toHaveBeenLastCalledWith(1)
    expect(ids(result.current.rows)).toEqual(['a', 'b', 'c', 'd', 'e'])

    act(() => result.current.setGlobalFilter('x'))
    act(() => result.current.setColumnFilter('tag', ['y']))
    expect(onGlobalFilterChange).toHaveBeenCalledWith('x')
    expect(onColumnFiltersChange).toHaveBeenCalledWith({ tag: ['y'] })
    expect(result.current.rows).toHaveLength(5)
  })
})

describe('useDataTable: seleção em lote e expansão', () => {
  it('selectedRows segue a ordem de data, entre páginas, e clearSelection limpa', () => {
    const onSelectionChange = vi.fn()
    const { result } = setup({ defaultPageSize: 2, onSelectionChange })
    act(() => result.current.setPage(3))
    act(() => result.current.toggleRow('e'))
    act(() => result.current.setPage(1))
    act(() => result.current.toggleRow('a'))
    expect(ids(result.current.selectedRows)).toEqual(['a', 'e'])

    act(() => result.current.setGlobalFilter('ana'))
    expect(ids(result.current.selectedRows)).toEqual(['a', 'e'])

    act(() => result.current.clearSelection())
    expect(result.current.selectedRows).toEqual([])
    act(() => result.current.clearSelection())
    expect(onSelectionChange).toHaveBeenCalledTimes(3)
  })

  it('toggleExpanded e isExpanded', () => {
    const onExpandedChange = vi.fn()
    const { result } = setup({ defaultExpandedRowIds: ['b'], onExpandedChange })
    expect(result.current.isExpanded('b')).toBe(true)
    act(() => result.current.toggleExpanded('a'))
    expect(result.current.expandedRowIds).toEqual(['b', 'a'])
    act(() => result.current.toggleExpanded('b'))
    expect(result.current.expandedRowIds).toEqual(['a'])
    expect(result.current.isExpanded('b')).toBe(false)
    expect(onExpandedChange.mock.calls).toEqual([[['b', 'a']], [['a']]])
  })
})

describe('useDataTable: larguras de coluna', () => {
  const cols: DataTableColumn<Row>[] = [
    { id: 'name', header: 'Nome', accessor: (row) => row.name, width: 200 },
    { id: 'amount', header: 'Valor', accessor: (row) => row.amount, minWidth: 100 },
    { id: 'tag', header: 'Tag', accessor: (row) => row.tag },
  ]

  it('começa pelas widths das colunas', () => {
    const { result } = setup({ columns: cols })
    expect(result.current.columnWidths).toEqual({ name: 200 })
  })

  it('arredonda e respeita minWidth (padrão 64)', () => {
    const onColumnWidthsChange = vi.fn()
    const { result } = setup({ columns: cols, onColumnWidthsChange })
    act(() => result.current.setColumnWidth('name', 150.6))
    act(() => result.current.setColumnWidth('amount', 20))
    act(() => result.current.setColumnWidth('tag', 10))
    expect(result.current.columnWidths).toEqual({ name: 151, amount: 100, tag: 64 })
    act(() => result.current.setColumnWidth('tag', 30))
    expect(onColumnWidthsChange).toHaveBeenCalledTimes(3)
  })

  it('defaultColumnWidths vence as widths das colunas', () => {
    const { result } = setup({ columns: cols, defaultColumnWidths: { tag: 90 } })
    expect(result.current.columnWidths).toEqual({ tag: 90 })
  })
})
