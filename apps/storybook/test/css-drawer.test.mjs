// Base e motivo: css-helpers.mjs.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { drawerContentVariants, drawerSlotClasses } from '@devwebdex/ui'
import { css, missingFromCss } from './css-helpers.mjs'

/**
 * A Drawer renderiza num portal, que o renderToStaticMarkup não desenha: as classes saem do que
 * o componente exporta: o painel em cada lado e tamanho, e as partes internas, que são as do
 * Modal com o anel de foco corrigido. O fundo escurecido é o do Modal, conferido em
 * css-modal.test.mjs.
 */
function drawerClasses() {
  const lists = []
  for (const side of ['right', 'left']) {
    for (const size of ['sm', 'md', 'lg']) lists.push(drawerContentVariants({ side, size }))
  }
  lists.push(...Object.values(drawerSlotClasses))
  return [...new Set(lists.join(' ').split(/\s+/).filter(Boolean))]
}

test('toda classe que a Drawer produz existe no CSS compilado', () => {
  assert.deepEqual(
    missingFromCss(drawerClasses()),
    [],
    'classes da Drawer sem regra no CSS: o @source de packages/ui/src não está varrendo drawer/'
  )
})

test('a saída da Drawer usa as animações dos tokens', () => {
  // Sem o token, `animate-slide-out-*` não gera regra: a gaveta fecharia de uma vez, sem aviso.
  for (const side of ['right', 'left']) {
    assert.match(css, new RegExp(`--animate-slide-out-${side}:`), `slide-out-${side} sem token`)
    assert.match(css, new RegExp(`@keyframes slide-out-${side}`), `slide-out-${side} sem keyframes`)
  }
})
