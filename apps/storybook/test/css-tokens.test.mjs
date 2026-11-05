// Os tokens chegaram no CSS, e o tema que o Tailwind usou é o nosso.
// Base e motivo: css-helpers.mjs.

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { css } from './css-helpers.mjs'

test('os tokens do design system chegaram no CSS, e não o tema padrão do Tailwind', () => {
  const expected = [
    ['--color-brand', '#f5127c'],
    ['--color-coral-50', '#ff4d5e'],
    ['--spacing-4', '16px'],
    ['--radius-2', '8px'],
  ]
  const missing = expected.filter(
    ([name, value]) => !css.includes(`${name}: ${value}`) && !css.includes(`${name}:${value}`)
  )
  assert.deepEqual(
    missing.map(([name]) => name),
    [],
    'tokens ausentes do CSS: o packages/tokens/dist está velho ou o @import do theme.css não resolveu'
  )
})

test('a elevação da sombra veio do token, com o valor certo', () => {
  // O Tailwind não emite --shadow-* como variável do tema: ele embute o valor no
  // --tw-shadow da própria classe. Por isso a conferência é pelo valor, não pelo nome.
  assert.match(
    css.replace(/\s+/g, ' '),
    /\.shadow-elevation-2\{--tw-shadow:0 3px 1px -2px/,
    'a elevation-2 não saiu com o valor de shadow.json'
  )
})

test('a escala de espaçamento é a nossa, não a do Tailwind', () => {
  // Com o tema padrão, `p-8` sai como calc(var(--spacing) * 8). Com o nosso, lê --spacing-8.
  assert.ok(
    !/\.p-8\{padding:calc\(var\(--spacing\)/.test(css.replace(/\s/g, '')),
    'p-8 está usando o multiplicador padrão do Tailwind: o theme.css dos tokens não foi aplicado'
  )
})
