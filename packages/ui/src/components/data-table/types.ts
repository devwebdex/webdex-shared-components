import type { ReactNode } from 'react'
import type { MenuItem } from '../menu/menu.js'

/**
 * Contrato da DataTable: os tipos públicos, a forma do estado (`useDataTable`) e as props das
 * partes (cabeçalho, ações da linha, barra de ferramentas e rodapé). Cada parte vive no seu
 * arquivo; este é o único lugar que todas importam.
 */

/** Alinhamento horizontal do texto das células. */
export type DataTableAlign = 'start' | 'center' | 'end'

/** Altura das linhas: `comfortable` (padrão) ou `compact`, para tabelas longas. */
export type DataTableDensity = 'comfortable' | 'compact'

export type DataTableSortDirection = 'asc' | 'desc'

export type DataTableSort = { columnId: string; direction: DataTableSortDirection }

/** Valor usado para ordenar. `null` e `undefined` vão para o fim, nas duas direções. */
export type DataTableSortValue = string | number | bigint | Date | null | undefined

export type DataTableColumn<Row> = {
  /** Identificador estável: chave da ordenação, da visibilidade e do React. */
  id: string
  header: ReactNode
  /** Valor da célula para ordenar e para a célula padrão (texto). */
  accessor?: (row: Row) => DataTableSortValue
  /** Conteúdo da célula. Sem ele, a célula mostra o `accessor` como texto. */
  cell?: (row: Row) => ReactNode
  /** Mostra o botão de ordenar no cabeçalho. Exige `accessor`. */
  sortable?: boolean
  /** Alinhamento fixo (ex.: `end` para valores). Sem ele, a coluna segue o alinhamento da tabela. */
  align?: DataTableAlign
  /** Pode ser escondida pelo menu de colunas. Padrão: `true`. */
  hideable?: boolean
  /** Classe da célula e do cabeçalho da coluna (ex.: largura). */
  className?: string
  /** Texto que a busca global procura. Padrão: o `accessor` como texto. `false` tira da busca. */
  searchValue?: ((row: Row) => string) | false
  /** Opções do filtro da coluna. Com elas, o cabeçalho ganha o menu de filtro. */
  filterOptions?: DataTableFilterOption[]
  /** Valor da linha comparado com as opções do filtro. Padrão: o `accessor` como texto. */
  filterValue?: (row: Row) => string
  /** Valor no CSV. Padrão: o `accessor`. `false` tira a coluna do CSV. */
  exportValue?: ((row: Row) => string | number | null | undefined) | false
  /** Largura inicial em px, com `resizableColumns`. */
  width?: number
  /** Largura mínima em px ao redimensionar. Padrão: 64. */
  minWidth?: number
}

export type DataTableFilterOption = { value: string; label: ReactNode }

/** Ação da barra de ações em lote. */
export type DataTableBulkAction = {
  label: ReactNode
  icon?: ReactNode
  onSelect: () => void
  /** `danger` para ação destrutiva (ex.: Cancelar selecionadas). */
  tone?: 'default' | 'danger'
  disabled?: boolean
}

export type DataTableProps<Row> = {
  data: Row[]
  columns: DataTableColumn<Row>[]
  getRowId: (row: Row) => string
  /** Nome da tabela para leitor de tela; vira o `<caption>`. */
  caption: string
  /** Mostra o `caption` na tela, acima da tabela. Padrão: escondido. */
  showCaption?: boolean

  /** Ações da linha; com elas, a última coluna ganha o botão "…" que abre o Menu. */
  rowActions?: (row: Row) => MenuItem[]

  /** Mostra a paginação no rodapé. Padrão: `true`. */
  pagination?: boolean
  page?: number
  defaultPage?: number
  onPageChange?: (page: number) => void
  pageSize?: number
  /** Padrão: 10. */
  defaultPageSize?: number
  onPageSizeChange?: (pageSize: number) => void
  /** Opções do seletor de linhas por página. Padrão: `[10, 20, 50]`. Vazio esconde o seletor. */
  pageSizeOptions?: number[]

  sort?: DataTableSort | null
  defaultSort?: DataTableSort | null
  onSortChange?: (sort: DataTableSort | null) => void

  /** Primeira coluna com checkbox por linha e "selecionar a página" no cabeçalho. */
  selectable?: boolean
  selectedRowIds?: string[]
  defaultSelectedRowIds?: string[]
  onSelectionChange?: (ids: string[]) => void

  align?: DataTableAlign
  /** Padrão: `start`. */
  defaultAlign?: DataTableAlign
  onAlignChange?: (align: DataTableAlign) => void

  density?: DataTableDensity
  /** Padrão: `comfortable`. */
  defaultDensity?: DataTableDensity
  onDensityChange?: (density: DataTableDensity) => void

  hiddenColumnIds?: string[]
  defaultHiddenColumnIds?: string[]
  onHiddenColumnsChange?: (ids: string[]) => void

  /** Linhas alternadas com fundo levemente diferente. */
  striped?: boolean
  /** Cabeçalho fica no topo ao rolar; use com `maxHeight`. */
  stickyHeader?: boolean
  /** Altura máxima da área rolável (valor CSS, ex.: `'24rem'`). */
  maxHeight?: string

  /** Mostra a barra de ferramentas (alinhamento, densidade, colunas). Padrão: `true`. */
  toolbar?: boolean
  /** Conteúdo no começo da barra de ferramentas (ex.: um campo de busca). */
  toolbarStart?: ReactNode

  /** Campo de busca na barra, que procura em todas as colunas. */
  searchable?: boolean
  /** Padrão: "Buscar". */
  searchPlaceholder?: string
  globalFilter?: string
  defaultGlobalFilter?: string
  onGlobalFilterChange?: (value: string) => void

  /** Filtros por coluna: id da coluna → valores marcados. Coluna sem valores não filtra. */
  columnFilters?: Record<string, string[]>
  defaultColumnFilters?: Record<string, string[]>
  onColumnFiltersChange?: (filters: Record<string, string[]>) => void

  /** Ações em lote: com linhas selecionadas, a barra delas aparece acima da tabela. */
  bulkActions?: (rows: Row[]) => DataTableBulkAction[]

  /** Detalhes da linha: com ele, a primeira coluna ganha a seta que expande. */
  renderExpanded?: (row: Row) => ReactNode
  expandedRowIds?: string[]
  defaultExpandedRowIds?: string[]
  onExpandedChange?: (ids: string[]) => void

  /** Botão "Exportar CSV" na barra: as linhas filtradas e ordenadas, ou só as selecionadas. */
  exportable?: boolean
  /** Padrão: "tabela.csv". */
  exportFileName?: string
  /** Botão "Exportar Excel": .xlsx com a marca WEbdEX, as mesmas linhas do CSV. */
  excelExportable?: boolean
  /** Padrão: "tabela.xlsx". */
  excelFileName?: string

  /**
   * Dados vindos do servidor: `data` já é a página atual, ordenada e filtrada. A tabela não
   * ordena, não filtra nem pagina; só avisa as mudanças pelos `on*Change`.
   */
  manual?: boolean
  /** Total de linhas no servidor, com `manual`. Padrão: `data.length`. */
  rowCount?: number

  /** A primeira coluna de dados fica parada ao rolar para o lado. */
  stickyFirstColumn?: boolean
  /** Borda do cabeçalho arrastável (e setas do teclado) para mudar a largura das colunas. */
  resizableColumns?: boolean
  columnWidths?: Record<string, number>
  defaultColumnWidths?: Record<string, number>
  onColumnWidthsChange?: (widths: Record<string, number>) => void

  /** `cards`: em contêiner estreito (menos de 40rem), cada linha vira um card. Padrão: `scroll`. */
  mobileLayout?: 'scroll' | 'cards'

  /** Linhas de Skeleton no lugar dos dados, com `aria-busy` na tabela. */
  loading?: boolean
  /** Conteúdo quando não há linhas. Padrão: "Nenhum registro encontrado." */
  emptyState?: ReactNode

  className?: string
}

/** Opções do `useDataTable`: as props que mudam estado, sem as de aparência pura. */
export type UseDataTableOptions<Row> = Pick<
  DataTableProps<Row>,
  | 'data'
  | 'columns'
  | 'getRowId'
  | 'pagination'
  | 'page'
  | 'defaultPage'
  | 'onPageChange'
  | 'pageSize'
  | 'defaultPageSize'
  | 'onPageSizeChange'
  | 'sort'
  | 'defaultSort'
  | 'onSortChange'
  | 'selectedRowIds'
  | 'defaultSelectedRowIds'
  | 'onSelectionChange'
  | 'align'
  | 'defaultAlign'
  | 'onAlignChange'
  | 'density'
  | 'defaultDensity'
  | 'onDensityChange'
  | 'hiddenColumnIds'
  | 'defaultHiddenColumnIds'
  | 'onHiddenColumnsChange'
  | 'globalFilter'
  | 'defaultGlobalFilter'
  | 'onGlobalFilterChange'
  | 'columnFilters'
  | 'defaultColumnFilters'
  | 'onColumnFiltersChange'
  | 'expandedRowIds'
  | 'defaultExpandedRowIds'
  | 'onExpandedChange'
  | 'manual'
  | 'rowCount'
  | 'columnWidths'
  | 'defaultColumnWidths'
  | 'onColumnWidthsChange'
>

/** O que o `useDataTable` devolve. Toda prop controlada tem a sua versão interna aqui. */
export type DataTableState<Row> = {
  /** Linhas da página atual, filtradas e ordenadas. Sem paginação, todas. Com `manual`, `data`. */
  rows: Row[]
  /** Todas as linhas depois de filtrar e ordenar, sem paginar (base do CSV). Com `manual`, `data`. */
  filteredRows: Row[]
  /** Total depois de filtrar. Com `manual`, `rowCount ?? data.length`. */
  totalRows: number

  page: number
  /** Ao menos 1, mesmo sem linhas. */
  pageCount: number
  pageSize: number
  setPage: (page: number) => void
  /** Troca o tamanho e volta para a página 1. */
  setPageSize: (pageSize: number) => void

  sort: DataTableSort | null
  /** Ciclo: sem ordem → ascendente → descendente → sem ordem. Trocar de coluna começa em ascendente. */
  toggleSort: (columnId: string) => void

  selectedRowIds: string[]
  isSelected: (id: string) => boolean
  toggleRow: (id: string) => void
  /** Marca todas as linhas da página; se todas já estiverem marcadas, desmarca as da página. */
  togglePage: () => void
  pageSelection: 'none' | 'some' | 'all'

  align: DataTableAlign
  setAlign: (align: DataTableAlign) => void
  /** Avança start → center → end → start. */
  cycleAlign: () => void

  density: DataTableDensity
  setDensity: (density: DataTableDensity) => void
  toggleDensity: () => void

  hiddenColumnIds: string[]
  toggleColumn: (id: string) => void
  /** As colunas sem as escondidas, na ordem original. */
  visibleColumns: DataTableColumn<Row>[]

  /** Mudar a busca ou um filtro volta para a página 1. */
  globalFilter: string
  setGlobalFilter: (value: string) => void
  columnFilters: Record<string, string[]>
  /** Lista vazia remove o filtro da coluna. */
  setColumnFilter: (columnId: string, values: string[]) => void
  /** Limpa a busca e todos os filtros de coluna. */
  clearFilters: () => void
  /** Há busca ou filtro de coluna ativo. */
  isFiltered: boolean

  /** As linhas de `data` cujos ids estão selecionados (base das ações em lote). */
  selectedRows: Row[]
  clearSelection: () => void

  expandedRowIds: string[]
  isExpanded: (id: string) => boolean
  toggleExpanded: (id: string) => void

  columnWidths: Record<string, number>
  setColumnWidth: (columnId: string, width: number) => void
}

// --- Partes ---------------------------------------------------------------------------------

export type DataTableHeaderCellProps = {
  header: ReactNode
  align: DataTableAlign
  /** Menu de filtro da coluna (`DataTableColumnFilter`), ao lado do título. */
  filter?: ReactNode
  /** Alça de redimensionar (`DataTableResizer`), na borda direita. */
  resizer?: ReactNode
  /** Largura em px, com `resizableColumns`. */
  width?: number
  /** Fixa a célula à esquerda ao rolar para o lado (`stickyFirstColumn`). */
  sticky?: boolean
  /** Sem ele, a coluna não ordena. */
  onToggleSort?: () => void
  /** Direção desta coluna, se ela for a ordenada. */
  sortDirection?: DataTableSortDirection | null
  className?: string
}

export type DataTableRowActionsProps = {
  items: MenuItem[]
  /** Nome acessível do botão "…" (ex.: "Ações de 0x3fA9…c21B"). */
  label: string
}

export type DataTableToolbarProps = {
  start?: ReactNode
  align: DataTableAlign
  onCycleAlign: () => void
  density: DataTableDensity
  onToggleDensity: () => void
  /** Colunas que aparecem no menu de colunas (as `hideable`). Vazio esconde o menu. */
  columns: { id: string; header: ReactNode; hidden: boolean }[]
  onToggleColumn: (id: string) => void
  /** Linhas selecionadas; com mais de 0, a barra mostra "N selecionadas". */
  selectedCount: number
  /** Com ele, a barra mostra o botão "Exportar CSV". */
  onExport?: () => void
  /** Com ele, a barra mostra o botão "Exportar Excel". */
  onExportExcel?: () => void
  /** O Excel está sendo gerado: o botão fica ocupado. */
  exportingExcel?: boolean
  /** Com ele, a barra mostra "Limpar filtros". */
  onClearFilters?: () => void
}

export type DataTableFooterProps = {
  page: number
  pageCount: number
  pageSize: number
  totalRows: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  /** Vazio esconde o seletor de linhas por página. */
  pageSizeOptions: number[]
}

export type DataTableSearchProps = {
  value: string
  onChange: (value: string) => void
  placeholder: string
  /** Nome acessível do campo (ex.: "Buscar em Transações recentes"). */
  label: string
}

export type DataTableColumnFilterProps = {
  /** Nome da coluna, para o nome acessível do botão ("Filtrar Status"). */
  columnLabel: string
  options: DataTableFilterOption[]
  selected: string[]
  onChange: (values: string[]) => void
}

export type DataTableBulkBarProps = {
  count: number
  actions: DataTableBulkAction[]
  onClear: () => void
}

export type DataTableCopyButtonProps = {
  /** Texto copiado para a área de transferência. */
  value: string
  /** Nome acessível (ex.: "Copiar hash"). */
  label: string
  className?: string
}

export type DataTableResizerProps = {
  /** Nome da coluna, para o nome acessível ("Largura da coluna Valor"). */
  columnLabel: string
  width: number
  minWidth: number
  onResize: (width: number) => void
}

export type DataTableCardListProps<Row> = {
  rows: Row[]
  columns: DataTableColumn<Row>[]
  getRowId: (row: Row) => string
  /** O conteúdo da célula, igual ao da tabela. */
  renderCell: (column: DataTableColumn<Row>, row: Row) => ReactNode
  /** Identificação da linha para nomes acessíveis (ex.: o hash). */
  rowLabel: (row: Row) => string
  rowActions?: (row: Row) => MenuItem[]
  selectable?: boolean
  isSelected: (id: string) => boolean
  toggleRow: (id: string) => void
  renderExpanded?: (row: Row) => ReactNode
  isExpanded: (id: string) => boolean
  toggleExpanded: (id: string) => void
}
