// Spinner, Skeleton e o estado loading do Button.
// Base e motivo: css-helpers.mjs.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Button, SkeletonAvatar, SkeletonCard, SkeletonText, Spinner } from '@devwebdex/ui'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { classesFromHtml, css, missingFromCss, SIZES } from './css-helpers.mjs'

/** Como no Alert, sai do HTML: as células do losango e as formas do Skeleton não têm cva. */
function loadingClasses() {
  const cases = [
    ...SIZES.map((size) => [Spinner, { size }]),
    ...['pixel', 'ring', 'dots'].flatMap((variant) =>
      ['brand', 'current'].map((tone) => [Spinner, { variant, tone }])
    ),
    ...SIZES.map((size) => [Button, { size, loading: true, children: 'Salvar' }]),
    ...['ring', 'pixel', 'dots'].flatMap((loadingIndicator) =>
      ['start', 'end', 'center'].map((loadingPosition) => [
        Button,
        { loading: true, loadingIndicator, loadingPosition, children: 'Salvar' },
      ])
    ),
    ...SIZES.map((size) => [SkeletonAvatar, { size }]),
    [SkeletonText, { lines: 3 }],
    [SkeletonCard, {}],
  ]
  return classesFromHtml(
    ...cases.map(([component, props]) => renderToStaticMarkup(createElement(component, props)))
  )
}

test('toda classe do Spinner, do Skeleton e do Button loading existe no CSS compilado', () => {
  assert.deepEqual(
    missingFromCss(loadingClasses()),
    [],
    'classes sem regra no CSS: o @source de packages/ui/src não está varrendo spinner/ ou skeleton/'
  )
})

test('o losango do Spinner tem o @keyframes dos tokens', () => {
  // Sem ele o losango fica parado: o animate-pixel-cell vem do motion.css dos tokens.
  assert.match(css, /@keyframes pixel-cell/, 'o theme.css não trouxe o @keyframes pixel-cell')
})
