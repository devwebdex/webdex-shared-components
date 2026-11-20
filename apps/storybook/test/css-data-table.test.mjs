// Base e motivo: css-helpers.mjs.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  DataTable,
  DataTableCopyButton,
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
} from '@devwebdex/ui'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { classesFromHtml, missingFromCss } from './css-helpers.mjs'

const rows = Array.from({ length: 12 }, (_, index) => ({
  id: `tx-${index + 1}`,
  hash: `0x${String(index).padStart(4, '0')}…c21b`,
  amount: (index + 1) * 100,
  status: index % 3 === 0 ? 'Pendente' : 'Confirmada',
}))

const columns = [
  { id: 'hash', header: 'Hash', accessor: (row) => row.hash },
  { id: 'amount', header: 'Valor', accessor: (row) => row.amount, sortable: true, align: 'end' },
]

/** Com filtro e largura, para o funil do cabeçalho e a alça de redimensionar. */
const featureColumns = [
  {
    id: 'hash',
    header: 'Hash',
    accessor: (row) => row.hash,
    cell: (row) => createElement(DataTableCopyButton, { value: row.hash, label: 'Copiar hash' }),
    width: 160,
  },
  { ...columns[1], width: 120 },
  {
    id: 'status',
    header: 'Status',
    accessor: (row) => row.status,
    filterOptions: [
      { value: 'Pendente', label: 'Pendente' },
      { value: 'Confirmada', label: 'Confirmada' },
    ],
  },
]

const bulkActions = () => [
  { label: 'Exportar seleção', onSelect: () => {} },
  { label: 'Cancelar pendentes', tone: 'danger', disabled: true, onSelect: () => {} },
]

const renderExpanded = (row) => createElement('p', null, row.hash)

const base = {
  data: rows,
  columns,
  getRowId: (row) => row.id,
  caption: 'Transações',
}

const rowActions = () => [
  { label: 'Ver no explorador' },
  'separator',
  { label: 'Cancelar', tone: 'danger', disabled: true },
]

/**
 * Sai do HTML, como no Alert: o cabeçalho, a barra e o rodapé põem classe fora do `cva`. Os
 * estados que o HTML estático não mostra (hover, linha selecionada, listra par) estão nas
 * variantes exportadas, que entram inteiras com todos os valores.
 */
function dataTableClasses() {
  const cases = [
    {},
    { defaultDensity: 'compact' },
    { striped: true },
    { stickyHeader: true, maxHeight: '20rem', showCaption: true },
    { selectable: true, defaultSelectedRowIds: ['tx-1'] },
    { rowActions },
    { loading: true, selectable: true, rowActions },
    { data: [] },
    { defaultSort: { columnId: 'amount', direction: 'asc' } },
    { defaultSort: { columnId: 'amount', direction: 'desc' }, defaultAlign: 'center' },
    { defaultAlign: 'end', defaultHiddenColumnIds: ['hash'] },
    // Recursos novos. Busca com texto, para o X de limpar; filtro ativo, para o funil na cor da
    // marca e o "Limpar filtros" da barra; filtro sem resultado, para a mensagem com o botão.
    { columns: featureColumns, searchable: true, defaultGlobalFilter: '0x0001' },
    { columns: featureColumns, defaultColumnFilters: { status: ['Pendente'] } },
    { columns: featureColumns, searchable: true, defaultGlobalFilter: 'nada' },
    {
      columns: featureColumns,
      selectable: true,
      bulkActions,
      defaultSelectedRowIds: ['tx-1', 'tx-2'],
    },
    { columns: featureColumns, renderExpanded, defaultExpandedRowIds: ['tx-1'] },
    { columns: featureColumns, exportable: true },
    {
      columns: featureColumns,
      stickyFirstColumn: true,
      resizableColumns: true,
      selectable: true,
      renderExpanded,
      rowActions,
    },
    { columns: featureColumns, stickyFirstColumn: true, stickyHeader: true, loading: true },
    {
      columns: featureColumns,
      mobileLayout: 'cards',
      selectable: true,
      defaultSelectedRowIds: ['tx-1'],
      renderExpanded,
      defaultExpandedRowIds: ['tx-1'],
      rowActions,
    },
    { columns: featureColumns, manual: true, rowCount: 40 },
  ]
  const html = cases.map((props) =>
    renderToStaticMarkup(createElement(DataTable, { ...base, ...props }))
  )
  html.push(
    renderToStaticMarkup(
      createElement(DataTableCopyButton, { value: '0x3fa9c21b', label: 'Copiar hash' })
    )
  )
  const variants = [
    dataTableContainerClass,
    dataTableToolbarAreaClass,
    dataTableFooterAreaClass,
    dataTableBulkAreaClass,
    dataTableScrollAreaClass,
    dataTableScrollAreaCardsClass,
    dataTableCardsAreaClass,
    dataTableCardsContainerClass,
    dataTableClass,
    dataTableCaptionClass,
    dataTableCheckboxClass,
    dataTableControlCellClass,
    dataTableActionsColClass,
    dataTableExpandButtonClass,
    dataTableDetailRowClass,
    dataTableDetailCellClass,
    dataTableStickyBodyCellClass,
    dataTableStickyEdgeClass,
    ...dataTableStickyLeftClass,
    ...[true, false].map((stickyHeader) => dataTableStickyHeadCellVariants({ stickyHeader })),
    // O ícone de copiado só aparece depois do clique, que o HTML estático não mostra.
    'text-success hover:text-success',
    ...[true, false].map((sticky) => dataTableHeadVariants({ sticky })),
    ...[true, false].map((striped) => dataTableRowVariants({ striped })),
    ...['start', 'center', 'end'].flatMap((align) =>
      ['comfortable', 'compact'].map((density) => dataTableCellVariants({ align, density }))
    ),
  ]
  return [...new Set([...classesFromHtml(...html), ...variants.join(' ').split(/\s+/)])].filter(
    Boolean
  )
}

test('toda classe que a DataTable produz existe no CSS compilado', () => {
  const missing = missingFromCss(dataTableClasses())
  assert.deepEqual(missing, [], `classes da DataTable sem regra no CSS: ${missing.join(', ')}`)
})
