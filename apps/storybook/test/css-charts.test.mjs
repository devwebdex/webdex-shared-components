import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  AreaChart,
  BarChart,
  chartFrameClasses,
  chartPlaceholderClasses,
  chartSwatchClasses,
  chartTokenClasses,
  LineChart,
  PieChart,
  pieCenterClasses,
} from '@devwebdex/ui'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { classesFromHtml, css, missingFromCss } from './css-helpers.mjs'

const data = [{ month: 'Jan', a: 1, b: 2 }]
const series = [
  { key: 'a', label: 'A' },
  { key: 'b', label: 'B' },
]
const cartesian = { title: 'T', data, categoryKey: 'month', series }
const slices = [
  { label: 'A', value: 1 },
  { label: 'B', value: 2 },
]

function chartClasses() {
  const html = [
    createElement(LineChart, cartesian),
    createElement(AreaChart, { ...cartesian, loading: true }),
    createElement(BarChart, { ...cartesian, loading: true }),
    createElement(BarChart, { ...cartesian, data: [] }),
    createElement(PieChart, { title: 'T', data: slices, donut: true }),
    createElement(PieChart, { title: 'T', data: slices, donut: true, loading: true }),
    createElement(PieChart, { title: 'T', data: [] }),
  ]
    .map((element) => renderToStaticMarkup(element))
    .join('')
  return [
    ...new Set([
      ...classesFromHtml(html),
      ...Object.values(chartFrameClasses).join(' ').split(/\s+/),
      ...Object.values(chartPlaceholderClasses).join(' ').split(/\s+/),
      ...Object.values(chartSwatchClasses),
      ...Object.values(pieCenterClasses).join(' ').split(/\s+/),
    ]),
  ].filter(Boolean)
}

test('toda classe que os gráficos produzem existe no CSS compilado', () => {
  assert.deepEqual(
    missingFromCss(chartClasses()),
    [],
    'classes dos gráficos sem regra no CSS: o @source de packages/ui/src não está varrendo chart/'
  )
})

test('os tokens que o ECharts lê pelo JS chegaram como variável', () => {
  assert.deepEqual(missingFromCss(chartTokenClasses.split(/\s+/)), [])
  const variables = [
    ...[1, 2, 3, 4, 5, 6].map((index) => `--color-chart-${index}`),
    '--color-background',
    '--color-surface-card',
    '--color-text-primary',
    '--color-text-secondary',
    '--color-line-default',
    '--color-line-enabled',
    '--opacity-chart-area',
    '--font-sans',
    '--text-3xs',
    '--text-2xs',
    '--radius-2',
    ...[1, 2, 3, 4, 5].map((step) => `--spacing-${step}`),
  ]
  const missing = variables.filter((name) => !new RegExp(`${name}:`).test(css))
  assert.deepEqual(missing, [], 'variáveis que o gráfico lê e que não chegaram no CSS')
})

test('o modo claro redefine as cores e a paleta dos gráficos acompanha', () => {
  const block = css.match(/\[data-theme=["']?light["']?\]\s*\{([^}]*)\}/)?.[1]
  assert.ok(block, 'bloco [data-theme="light"] ausente do CSS')
  assert.match(block, /--color-background:\s*#fbf7fa/)
  assert.match(block, /--color-chart-2:\s*var\(--color-info\)/)
})
