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
>

/** O que o `useDataTable` devolve. Toda prop controlada tem a sua versão interna aqui. */
export type DataTableState<Row> = {
  /** Linhas da página atual, já ordenadas. Sem paginação, todas. */
  rows: Row[]
  /** Total de linhas, depois de ordenar (a ordenação não filtra). */
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
}

// --- Partes ---------------------------------------------------------------------------------

export type DataTableHeaderCellProps = {
  header: ReactNode
  align: DataTableAlign
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
