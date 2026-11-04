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
  Button,
  buttonVariants,
  Card,
  chevronClass,
  inputFieldVariants,
  listItemVariants,
  listPopupVariants,
  listSeparatorClass,
  modalContentVariants,
  modalOverlayClass,
  modalSlotClasses,
  Pagination,
  paginationItemClass,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonText,
  Spinner,
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

/**
 * Desfaz o escape de atributo do renderToStaticMarkup.
 *
 * Variante arbitrária (`[&>img]:w-full`) sai do HTML como `[&amp;&gt;img]:w-full`, e a busca
 * pelo seletor falharia com a classe presente no CSS -- o teste acusaria um problema que não
 * existe. Só as cinco entidades que o React escapa em atributo.
 */
function decodeEntities(text) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
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
      for (const utility of decodeEntities(classes).split(/\s+/)) {
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

/**
 * Toda classe que o Card renderiza, nas quatro combinações de interactive x selected,
 * com mídia, header, conteúdo e ações.
 *
 * Sai do HTML renderizado, não só do cva: a mídia sangrada, o header e o rodapé de ações têm
 * classes fora do cardVariants, e são justamente as que sumiriam sem ninguém notar. O slot de
 * mídia é o caso mais frágil: `-mt-4 -mx-4` e `[&>img]:w-full` só existem no JSX.
 */
function cardClasses() {
  const all = new Set()
  for (const interactive of [false, true]) {
    for (const selected of [false, true]) {
      const html = renderToStaticMarkup(
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
      for (const [, classes] of html.matchAll(/class="([^"]*)"/g)) {
        for (const utility of decodeEntities(classes).split(/ +/)) {
          if (utility) all.add(utility)
        }
      }
    }
  }
  return [...all]
}

test('toda classe que o Card produz existe no CSS compilado', () => {
  const missing = cardClasses().filter((className) => !css.includes(toSelector(className)))
  assert.deepEqual(
    missing,
    [],
    'classes do Card sem regra no CSS: o @source de packages/ui/src não está varrendo o componente'
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

/**
 * Toda classe que o Spinner, o Skeleton e o Button `loading` renderizam. Como no Alert, sai do
 * HTML: as células do losango e as formas do Skeleton têm classes fora de qualquer cva.
 */
function loadingClasses() {
  const sizes = ['small', 'medium', 'large']
  const cases = [
    ...sizes.map((size) => [Spinner, { size }]),
    ...['pixel', 'ring', 'dots'].flatMap((variant) =>
      ['brand', 'current'].map((tone) => [Spinner, { variant, tone }])
    ),
    ...sizes.map((size) => [Button, { size, loading: true, children: 'Salvar' }]),
    ...['ring', 'pixel', 'dots'].flatMap((loadingIndicator) =>
      ['start', 'end', 'center'].map((loadingPosition) => [
        Button,
        { loading: true, loadingIndicator, loadingPosition, children: 'Salvar' },
      ])
    ),
    ...sizes.map((size) => [SkeletonAvatar, { size }]),
    [SkeletonText, { lines: 3 }],
    [SkeletonCard, {}],
  ]
  const all = new Set()
  for (const [component, props] of cases) {
    const html = renderToStaticMarkup(createElement(component, props))
    for (const [, classes] of html.matchAll(/class="([^"]*)"/g)) {
      // O HTML escapa o `&` de seletores como `[&_svg]:size-[20px]`.
      for (const utility of classes.replaceAll('&amp;', '&').split(/\s+/)) {
        if (utility) all.add(utility)
      }
    }
  }
  return [...all]
}

test('toda classe do Spinner, do Skeleton e do Button loading existe no CSS compilado', () => {
  const missing = loadingClasses().filter((className) => !css.includes(toSelector(className)))
  assert.deepEqual(
    missing,
    [],
    'classes sem regra no CSS: o @source de packages/ui/src não está varrendo spinner/ ou skeleton/'
  )
  // Sem o @keyframes, o losango fica parado: o animate-pixel-cell vem do motion.css dos tokens.
  assert.match(css, /@keyframes pixel-cell/, 'o theme.css não trouxe o @keyframes pixel-cell')
})

/**
 * O Modal renderiza num portal, que o renderToStaticMarkup não desenha: as classes saem do que
 * o componente exporta (fundo, caixa em cada tamanho e as partes internas).
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
  const missing = modalClasses().filter((className) => !css.includes(toSelector(className)))
  assert.deepEqual(
    missing,
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

/**
 * Toda classe que a Pagination renderiza (lista, itens e reticências, com página atual e as duas
 * reticências na tela), mais as versões sem prefixo que a story Estados força no item.
 */
function paginationClasses() {
  const html = renderToStaticMarkup(createElement(Pagination, { count: 20, defaultPage: 10 }))
  // O React escreve `&` como `&amp;` dentro do atributo: sem desfazer, `[&_svg]:size-4` chegaria
  // aqui com outro nome e nunca seria achado no CSS.
  const rendered = [...html.matchAll(/class="([^"]*)"/g)].map(([, classes]) =>
    classes.replaceAll('&amp;', '&')
  )
  return withForcedStates([...rendered, paginationItemClass])
}

test('toda classe que a Pagination produz existe no CSS compilado', () => {
  const missing = paginationClasses().filter((className) => !css.includes(toSelector(className)))
  assert.deepEqual(missing, [], `classes da Pagination sem regra no CSS: ${missing.join(', ')}`)
})
