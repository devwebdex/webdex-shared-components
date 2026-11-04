// Base dos testes `css-*.test.mjs`, que conferem se o CSS que o Storybook publicou contém de
// fato tudo que os componentes usam.
//
// As três falhas que esses testes existem para pegar são mudas: o build termina com
// "completed successfully" e a saída sai errada.
//
//   1. dist velho depois de trocar de branch -- o Tailwind usa o tema padrão dele em vez dos
//      tokens, e `p-8` vira 2rem em vez dos 64px de spacing.8;
//   2. classe montada em tempo de execução -- a story Matriz tira o prefixo de
//      `hover:shadow-elevation-4`, e o Tailwind nunca viu `shadow-elevation-4` escrito em
//      lugar nenhum;
//   3. caminho de @source errado -- as classes dos componentes somem do CSS.
//
// A lista de classes vem sempre do próprio componente -- do `cva` ou do HTML renderizado --,
// então o teste não desatualiza quando alguém mexe nele.
//
// UM ARQUIVO POR COMPONENTE, DE PROPÓSITO
//
// Isto já foi um `css.test.mjs` só, e ele conflitou em todas as quatro PRs de componente que
// entraram no mesmo dia: cada uma acrescentava o seu bloco no mesmo lugar do mesmo arquivo.
// Com um arquivo por componente, PR nova cria arquivo novo em vez de editar um compartilhado.
// O `node --test` descobre sozinho: não há lista para manter.

import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'storybook-static', 'assets')

export const SIZES = ['large', 'medium', 'small']
export const COLORS = ['brand', 'code']
export const VARIANTS = ['contained', 'outlined', 'text']
export const STATUSES = ['default', 'error', 'success']
export const RADII = ['0', '1', '2', '3', '4', '5', 'full']
export const TONES = ['default', 'danger']

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

/** O CSS publicado, concatenado. Lido uma vez por arquivo de teste. */
export const css = readCss()

/** Tailwind escapa, no seletor, tudo que não é letra, dígito, hífen ou sublinhado. */
export function toSelector(className) {
  return `.${className.replace(/[^a-zA-Z0-9_-]/g, (char) => `\\${char}`)}`
}

/**
 * Desfaz o escape de atributo do renderToStaticMarkup.
 *
 * Variante arbitrária (`[&_svg]:size-4`, `[&>img]:w-full`) sai do HTML com o `&` e o `>`
 * escapados: `[&amp;_svg]:size-4`, `[&amp;&gt;img]:w-full`. A busca pelo seletor falharia com
 * a classe presente no CSS -- o teste acusaria um problema que não existe.
 *
 * Desfazer só o `&amp;` à mão, como já se fez em dois lugares, cobre `[&_svg]` mas não
 * `[&>img]`: o furo só aparece quando alguém usa a primeira variante com `>` ou `<`, e aí
 * parece erro de CSS. Por isso todo lugar que extrai classe de HTML passa por aqui.
 *
 * Só as cinco entidades que o React escapa em atributo.
 */
export function decodeEntities(text) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
}

/**
 * Toda classe de um HTML renderizado.
 *
 * Sai do HTML, e não só do `cva`, quando o componente põe classe fora dele -- o símbolo do
 * Alert, a mídia do Card, as células do Spinner. São justamente as que sumiriam sem ninguém
 * notar, porque não há variante para percorrer.
 */
export function classesFromHtml(...htmls) {
  const all = new Set()
  for (const html of htmls) {
    for (const [, classes] of html.matchAll(/class="([^"]*)"/g)) {
      for (const utility of decodeEntities(classes).split(/\s+/)) {
        if (utility) all.add(utility)
      }
    }
  }
  return [...all]
}

/** Toda classe da lista, mais as versões sem prefixo que as stories Matriz forçam. */
export function withForcedStates(classLists) {
  const all = new Set()
  for (const utility of classLists.join(' ').split(/\s+/)) {
    if (!utility) continue
    all.add(utility)
    const prefix = STATE_PREFIXES.find((candidate) => utility.startsWith(candidate))
    if (prefix) all.add(utility.slice(prefix.length))
  }
  return [...all]
}

/** As classes da lista que não têm regra no CSS publicado. */
export function missingFromCss(classNames) {
  return classNames.filter((className) => !css.includes(toSelector(className)))
}
