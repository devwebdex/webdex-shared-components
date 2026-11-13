// InputField e TextField, que são o mesmo campo: o segundo monta o primeiro.
// Base e motivo: css-helpers.mjs.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { inputFieldVariants } from '@devwebdex/ui'
import { missingFromCss, STATUSES, withForcedStates } from './css-helpers.mjs'

function inputFieldClasses() {
  return withForcedStates(STATUSES.map((status) => inputFieldVariants({ status })))
}

test('toda classe que o InputField produz existe no CSS compilado', () => {
  assert.deepEqual(
    missingFromCss(inputFieldClasses()),
    [],
    `classes sem regra no CSS. Se forem versões sem prefixo (border-white/22, ring-brand/12),
     o @source inline gerado por .storybook/main.ts não cobriu. Se forem classes normais,
     o @source de packages/ui/src não está varrendo o componente.`
  )
})

test('as classes literais do TextField existem no CSS compilado', () => {
  // O TextField não tem cva com eixos para percorrer: as classes dele são escritas
  // direto no JSX. A lista é a que tem valor arbitrário ou token, que é onde um
  // @source errado ou um tema faltando aparecem.
  const expected = ['text-3xs', 'leading-4xs', 'text-danger', 'text-success', 'text-text-disabled']
  assert.deepEqual(missingFromCss(expected), [], 'classes do TextField sem regra no CSS')
})
