// Select, Menu e Combobox: os três compartilham lib/list.ts.
// Base e motivo: css-helpers.mjs.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  attentionClass,
  chevronClass,
  listItemVariants,
  listPopupVariants,
  listSeparatorClass,
  selectTriggerVariants,
} from '@devwebdex/ui'
import { missingFromCss, RADII, SIZES, TONES } from './css-helpers.mjs'

/** Gatilho (com e sem halo), seta, lista, itens e separador. */
function listClasses() {
  // Classes que o Select e o Combobox acrescentam ao item (marca e destaque do cmdk).
  const extra =
    'justify-between data-[selected=true]:bg-brand-soft/10 data-[selected=true]:before:opacity-100'
  const all = new Set(
    [listSeparatorClass, attentionClass, chevronClass, extra].join(' ').split(/\s+/)
  )
  for (const radius of RADII) {
    for (const utility of listPopupVariants({ radius }).split(/\s+/)) all.add(utility)
    for (const size of SIZES) {
      for (const attention of [false, true]) {
        for (const utility of selectTriggerVariants({ size, radius, attention }).split(/\s+/)) {
          all.add(utility)
        }
      }
      for (const tone of TONES) {
        for (const utility of listItemVariants({ size, radius, tone }).split(/\s+/))
          all.add(utility)
      }
    }
  }
  return [...all].filter(Boolean)
}

test('toda classe que o Select, o Menu e o Combobox produzem existe no CSS compilado', () => {
  assert.deepEqual(
    missingFromCss(listClasses()),
    [],
    'classes sem regra no CSS: o @source de packages/ui/src não está varrendo select/, menu/ ou lib/list.ts'
  )
})
