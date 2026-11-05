// Base e motivo: css-helpers.mjs.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buttonVariants } from '@devwebdex/ui'
import { COLORS, missingFromCss, SIZES, VARIANTS, withForcedStates } from './css-helpers.mjs'

/** As 18 combinações dos três eixos, mais as versões sem prefixo que a Matriz força. */
function buttonClasses() {
  const lists = []
  for (const size of SIZES) {
    for (const color of COLORS) {
      for (const variant of VARIANTS) {
        lists.push(buttonVariants({ size, color, variant }))
      }
    }
  }
  return withForcedStates(lists)
}

test('toda classe que o Button produz existe no CSS compilado', () => {
  assert.deepEqual(
    missingFromCss(buttonClasses()),
    [],
    `classes sem regra no CSS. Se forem versões sem prefixo (shadow-elevation-4, outline-brand),
     o @source inline gerado por .storybook/main.ts não cobriu. Se forem classes normais,
     o @source de packages/ui/src não está varrendo o componente.`
  )
})
