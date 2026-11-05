// Base e motivo: css-helpers.mjs.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Alert } from '@devwebdex/ui'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { classesFromHtml, missingFromCss } from './css-helpers.mjs'

/** Cada variante, com título e texto: o símbolo e o título têm classes fora do cva. */
function alertClasses() {
  return classesFromHtml(
    ...['info', 'warning', 'error', 'success'].map((variant) =>
      renderToStaticMarkup(createElement(Alert, { variant, title: 'Título.' }, 'Texto.'))
    )
  )
}

test('toda classe que o Alert produz existe no CSS compilado', () => {
  assert.deepEqual(
    missingFromCss(alertClasses()),
    [],
    'classes do Alert sem regra no CSS: o @source de packages/ui/src não está varrendo o componente'
  )
})
