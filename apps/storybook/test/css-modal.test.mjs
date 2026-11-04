// Base e motivo: css-helpers.mjs.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { modalContentVariants, modalOverlayClass, modalSlotClasses } from '@devwebdex/ui'
import { css, missingFromCss, toSelector } from './css-helpers.mjs'

/**
 * O Modal renderiza num portal, que o renderToStaticMarkup não desenha: as classes saem do
 * que o componente exporta (fundo, caixa em cada tamanho e as partes internas).
 */
function modalClasses() {
  const lists = [
    modalOverlayClass,
    ...['sm', 'md', 'lg'].map((size) => modalContentVariants({ size })),
    ...Object.values(modalSlotClasses),
  ]
  return [...new Set(lists.join(' ').split(/\s+/).filter(Boolean))]
}

test('toda classe que o Modal produz existe no CSS compilado', () => {
  assert.deepEqual(
    missingFromCss(modalClasses()),
    [],
    'classes do Modal sem regra no CSS: o @source de packages/ui/src não está varrendo modal/'
  )
})

test('o fundo do Modal usa o token de opacidade, não um valor solto', () => {
  // `bg-background/overlay` só gera regra se --opacity-overlay existir no tema: sem o token, o
  // Tailwind descarta a classe e o fundo fica transparente sem aviso.
  assert.match(css, /--opacity-overlay:\s*72%/, 'opacity.overlay não chegou no theme.css')
  assert.ok(css.includes(toSelector('bg-background/overlay')), 'bg-background/overlay sem regra')
})
