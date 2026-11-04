// Base e motivo: css-helpers.mjs.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Pagination, paginationItemClass } from '@devwebdex/ui'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { classesFromHtml, missingFromCss, withForcedStates } from './css-helpers.mjs'

/**
 * Lista, itens e reticências, com a página atual e as duas reticências na tela, mais as
 * versões sem prefixo que a story Estados força no item.
 */
function paginationClasses() {
  const html = renderToStaticMarkup(createElement(Pagination, { count: 20, defaultPage: 10 }))
  return withForcedStates([...classesFromHtml(html), paginationItemClass])
}

test('toda classe que a Pagination produz existe no CSS compilado', () => {
  const missing = missingFromCss(paginationClasses())
  assert.deepEqual(missing, [], `classes da Pagination sem regra no CSS: ${missing.join(', ')}`)
})
