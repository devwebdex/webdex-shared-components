// Confere que o CSS que o Storybook publicou contém de fato tudo que os componentes
// usam. As três falhas que este teste existe para pegar são mudas: o build termina
// com "completed successfully" e a saída sai errada.
//
//   1. dist velho depois de trocar de branch -- o Tailwind usa o tema padrão dele
//      em vez dos tokens, e `p-8` vira 2rem em vez dos 64px de spacing.8;
//   2. classe montada em tempo de execução -- a story Matriz tira o prefixo de
//      `hover:shadow-elevation-4`, e o Tailwind nunca viu `shadow-elevation-4`
//      escrito em lugar nenhum;
//   3. caminho de @source errado -- as classes dos componentes somem do CSS.
//
// A lista de classes vem do próprio cva, então o teste não desatualiza quando
// alguém mexe no componente.

import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  Alert,
  attentionClass,
  buttonVariants,
  chevronClass,
  inputFieldVariants,
  listItemVariants,
  listPopupVariants,
  listSeparatorClass,
  selectTriggerVariants,
} from '@devwebdex/ui'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'storybook-static', 'assets')

const SIZES = ['large', 'medium', 'small']
const COLORS = ['brand', 'code']
const VARIANTS = ['contained', 'outlined', 'text']
const STATUSES = ['default', 'error', 'success']
const STATE_PREFIXES = ['hover:', 'active:', 'focus-visible:']

function readCss() {
  let files
  try {
    files = readdirSync(outDir).filter((name) => name.endsWith('.css'))
  } catch {
    assert.fail(`${outDir} não existe. Rode o build do Storybook antes do teste.`)
  }
  assert.ok(files.length > 0, `nenhum .css em ${outDir}`)
  return files.map((name) => readFileSync(join(outDir, name), 'utf8')).join('\n')
}

/** Tailwind escapa, no seletor, tudo que não é letra, dígito, hífen ou sublinhado. */
function toSelector(className) {
  return `.${className.replace(/[^a-zA-Z0-9_-]/g, (char) => `\\${char}`)}`
}

/** Toda classe da lista, mais as versões sem prefixo que as stories Matriz forçam. */
function withForcedStates(classLists) {
  const all = new Set()
  for (const utility of classLists.join(' ').split(/\s+/)) {
    if (!utility) continue
    all.add(utility)
    const prefix = STATE_PREFIXES.find((candidate) => utility.startsWith(candidate))
    if (prefix) all.add(utility.slice(prefix.length))
  }
  return [...all]
}

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

function inputFieldClasses() {
  return withForcedStates(STATUSES.map((status) => inputFieldVariants({ status })))
}

const css = readCss()

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

test('toda classe que o Button produz existe no CSS compilado', () => {
  const missing = buttonClasses().filter((className) => !css.includes(toSelector(className)))
  assert.deepEqual(
    missing,
    [],
    `classes sem regra no CSS. Se forem versões sem prefixo (shadow-elevation-4, outline-brand),
     o @source inline gerado por .storybook/main.ts não cobriu. Se forem classes normais,
     o @source de packages/ui/src não está varrendo o componente.`
  )
})

const RADII = ['0', '1', '2', '3', '4', '5', 'full']
const TONES = ['default', 'danger']

/** Toda classe do Select e do Menu: gatilho (com e sem halo), seta, lista, itens e separador. */
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
  const missing = listClasses().filter((className) => !css.includes(toSelector(className)))
  assert.deepEqual(
    missing,
    [],
    'classes sem regra no CSS: o @source de packages/ui/src não está varrendo select/, menu/ ou lib/list.ts'
  )
})

/**
 * Toda classe que o Alert renderiza, em cada variante, com título e texto.
 *
 * Sai do HTML renderizado, não só do cva: o símbolo e o título têm classes fora do
 * alertVariants, e são justamente as que sumiriam sem ninguém notar.
 */
function alertClasses() {
  const all = new Set()
  for (const variant of ['info', 'warning', 'error', 'success']) {
    const html = renderToStaticMarkup(createElement(Alert, { variant, title: 'Título.' }, 'Texto.'))
    for (const [, classes] of html.matchAll(/class="([^"]*)"/g)) {
      for (const utility of classes.split(/\s+/)) {
        if (utility) all.add(utility)
      }
    }
  }
  return [...all]
}

test('toda classe que o Alert produz existe no CSS compilado', () => {
  const missing = alertClasses().filter((className) => !css.includes(toSelector(className)))
  assert.deepEqual(
    missing,
    [],
    'classes do Alert sem regra no CSS: o @source de packages/ui/src não está varrendo o componente'
  )
})

test('toda classe que o InputField produz existe no CSS compilado', () => {
  const missing = inputFieldClasses().filter((className) => !css.includes(toSelector(className)))
  assert.deepEqual(
    missing,
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
  const expected = [
    'text-[11.5px]',
    'leading-[16px]',
    'text-danger',
    'text-success',
    'text-text-disabled',
  ]
  const missing = expected.filter((className) => !css.includes(toSelector(className)))
  assert.deepEqual(missing, [], 'classes do TextField sem regra no CSS')
})
