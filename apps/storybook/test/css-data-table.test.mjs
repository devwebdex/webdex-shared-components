// Base e motivo: css-helpers.mjs.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  DataTable,
  dataTableCaptionClass,
  dataTableCellVariants,
  dataTableCheckboxClass,
  dataTableClass,
  dataTableContainerClass,
  dataTableHeadVariants,
  dataTableRowVariants,
  dataTableScrollAreaClass,
} from '@devwebdex/ui'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { classesFromHtml, missingFromCss } from './css-helpers.mjs'

const rows = Array.from({ length: 12 }, (_, index) => ({
  id: `tx-${index + 1}`,
  hash: `0x${String(index).padStart(4, '0')}…c21b`,
  amount: (index + 1) * 100,
}))

const columns = [
  { id: 'hash', header: 'Hash', accessor: (row) => row.hash },
  { id: 'amount', header: 'Valor', accessor: (row) => row.amount, sortable: true, align: 'end' },
]

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
  ]
  const html = cases.map((props) =>
    renderToStaticMarkup(createElement(DataTable, { ...base, ...props }))
  )
  const variants = [
    dataTableContainerClass,
    dataTableScrollAreaClass,
    dataTableClass,
    dataTableCaptionClass,
    dataTableCheckboxClass,
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
