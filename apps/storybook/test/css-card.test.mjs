// Base e motivo: css-helpers.mjs.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Card } from '@devwebdex/ui'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { classesFromHtml, missingFromCss } from './css-helpers.mjs'

/**
 * As quatro combinações de interactive x selected, com mídia, header, conteúdo e ações.
 *
 * O slot de mídia é o caso mais frágil: `-mt-4 -mx-4` e `[&>img]:w-full` só existem no JSX,
 * fora de qualquer cva.
 */
function cardClasses() {
  const htmls = []
  for (const interactive of [false, true]) {
    for (const selected of [false, true]) {
      htmls.push(
        renderToStaticMarkup(
          createElement(
            Card,
            {
              interactive,
              selected,
              media: createElement('img', { src: 'data:,', alt: '' }),
              title: 'Título',
              actions: createElement('span', null, 'Ação'),
            },
            'Conteúdo.'
          )
        )
      )
    }
  }
  return classesFromHtml(...htmls)
}

test('toda classe que o Card produz existe no CSS compilado', () => {
  assert.deepEqual(
    missingFromCss(cardClasses()),
    [],
    'classes do Card sem regra no CSS: o @source de packages/ui/src não está varrendo o componente'
  )
})
