#!/usr/bin/env node
// Puxa um component set do Figma pela REST API e resume cada variante, marcando
// quais valores já existem como token e quais não existem.
//
// Uma execução = 1 chamada Tier 1 (GET file nodes), que é a cota mais escassa
// (20/mês em assento View/Collab). Por isso o JSON cru é sempre salvo: reanálise
// posterior usa --from e não gasta chamada nenhuma.
//
//   FIGMA_TOKEN=figd_... node scripts/figma-nodes.mjs <file-key> <node-id> [--out <arquivo>]
//   node scripts/figma-nodes.mjs --from <arquivo> [--filter <texto>]
//
// file-key e node-id saem da URL do Figma:
//   figma.com/design/<file-key>/Nome?node-id=123-456   →   node-id vira 123:456

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

const usage = `Uso:
  FIGMA_TOKEN=figd_... node scripts/figma-nodes.mjs <file-key> <node-id>[,<node-id>...] [--out <arquivo>]
  node scripts/figma-nodes.mjs --from <arquivo> [--filter <texto>]

Vários node-id separados por vírgula entram na MESMA chamada: a cota conta
requisições, não nós. Em arquivo de plano Starter são ~20 chamadas por mês.

Opções:
  --out <arquivo>    onde gravar o JSON cru (padrão: .figma-cache/<node-id>.json)
  --from <arquivo>   reanalisa um JSON já baixado, sem chamar a API
  --filter <texto>   só mostra variantes cujo nome contém o texto
  --force            baixa de novo mesmo se já houver cache (gasta cota)
  --help             mostra esta ajuda

O token sai de figma.com → Settings → Security → Personal access tokens, com
escopo de leitura de arquivos. Passe por variável de ambiente, nunca por argumento.`

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: 'string' },
    from: { type: 'string' },
    filter: { type: 'string' },
    force: { type: 'boolean', default: false },
    help: { type: 'boolean', default: false },
  },
})

if (values.help) {
  console.log(usage)
  process.exit(0)
}

const payload = values.from ? readCached(values.from) : await download()
report(payload)

async function download() {
  const [fileKey, rawNodeIds] = positionals
  if (!fileKey || !rawNodeIds) fail(`faltou file-key ou node-id.\n\n${usage}`)

  // biome-ignore lint/suspicious/noUndeclaredEnvVars: script roda com node direto, fora do grafo de tasks do turbo
  const token = process.env.FIGMA_TOKEN
  if (!token) fail('defina FIGMA_TOKEN com um personal access token da Figma')

  // A URL do Figma usa hífen no node-id; a API exige dois-pontos. Vários ids cabem
  // na mesma chamada, e a cota conta requisições, não nós: num arquivo em plano
  // Starter são ~20 por mês, então vale sempre pedir tudo de uma vez.
  const ids = rawNodeIds.split(',').map((id) => id.trim().replace('-', ':'))
  const target = values.out ?? join(repoRoot, '.figma-cache', `${ids[0].replace(':', '-')}.json`)

  if (existsSync(target) && !values.force) {
    fail(`${target} já existe, e baixar de novo gastaria uma chamada da cota.
  Reanalisar sem gastar:  node scripts/figma-nodes.mjs --from ${target}
  Baixar mesmo assim:     --force`)
  }

  const query = encodeURIComponent(ids.join(','))
  const url = `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${query}`

  console.log(`GET ${url}`)
  console.log(`${ids.length} nó(s) nesta chamada — a cota conta a chamada, não os nós.`)
  const response = await fetch(url, { headers: { 'X-Figma-Token': token } })

  if (response.status === 403) fail('403: token inválido ou sem acesso a este arquivo')
  if (response.status === 404) fail('404: file-key ou node-id não encontrado')
  if (response.status === 429) fail('429: rate limit estourado; ver docs/ui/figma-mcp-limites.md')
  if (!response.ok) fail(`${response.status}: ${await response.text()}`)

  const json = await response.json()
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, `${JSON.stringify(json, null, 2)}\n`)
  console.log(`JSON cru salvo em ${target} (reanalise com --from, sem gastar chamada)\n`)
  return json
}

function readCached(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function report(payload) {
  const roots = Object.values(payload.nodes ?? {}).map((entry) => entry.document)
  if (roots.length === 0) fail('resposta sem nós; confira o node-id')

  const variants = roots.flatMap((root) => collect(root))
  const needle = values.filter?.toLowerCase()
  const shown = needle
    ? variants.filter((node) => node.name.toLowerCase().includes(needle))
    : variants

  console.log(`${variants.length} variante(s) encontradas, ${shown.length} exibida(s).\n`)

  const tokens = loadTokens()
  const gaps = { spacing: new Set(), radius: new Set(), text: new Set(), color: new Set() }

  for (const node of shown) {
    const info = describe(node)
    console.log(`── ${info.name}`)
    console.log(`   caixa      ${info.size}  layout ${info.layout}`)
    dimension('   padding   ', info.padding, tokens.spacing, gaps.spacing)
    dimension('   gap       ', info.gap, tokens.spacing, gaps.spacing)
    dimension('   radius    ', info.radius, tokens.radius, gaps.radius)
    dimension('   fonte     ', info.fontSize, tokens.text, gaps.text)
    dimension('   altura-lin', info.lineHeight, new Map(), gaps.text)
    swatch('   fundo     ', info.fill, tokens.color, gaps.color)
    swatch('   borda     ', info.stroke, tokens.color, gaps.color)
    swatch('   texto     ', info.textColor, tokens.color, gaps.color)
    if (info.strokeWeight) console.log(`   espessura  ${info.strokeWeight}px`)
    if (info.weight) console.log(`   peso       ${info.weight}`)
    if (info.bound.length > 0) console.log(`   variables  ${info.bound.join(', ')}`)
    console.log('')
  }

  summarize(gaps)
}

function dimension(label, value, scale, gap) {
  if (value == null) return
  const marks = String(value)
    .split(' ')
    .map(Number)
    .map((px) => {
      const name = scale.get(px)
      if (name) return `${px}px ✓ ${name}`
      gap.add(px)
      return `${px}px ✗`
    })
  console.log(`${label} ${marks.join('  ')}`)
}

function swatch(label, value, scale, gap) {
  if (!value) return
  const name = scale.get(value)
  if (!name) gap.add(value)
  console.log(`${label} ${value} ${name ? `✓ ${name}` : '✗'}`)
}

function summarize(gaps) {
  const blocks = [
    ['espaçamentos', gaps.spacing, 'spacing'],
    ['raios', gaps.radius, 'radius'],
    ['tipografia', gaps.text, 'text'],
    ['cores', gaps.color, 'color'],
  ].filter(([, set]) => set.size > 0)

  if (blocks.length === 0) {
    console.log('Nenhuma lacuna: todo valor visual tem token correspondente.')
    return
  }

  console.log('Valores sem token (o guia manda parar e pedir a Variable ao designer):')
  for (const [label, set, namespace] of blocks) {
    const sorted = [...set].sort((a, b) =>
      typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b))
    )
    console.log(`  ${label.padEnd(14)} ${sorted.join(', ')}   → faltam em ${namespace}`)
  }
}

/** Cada filho de um COMPONENT_SET é uma combinação de properties; sem nenhum, descreve a raiz. */
function collect(root) {
  const found = []
  const walk = (node) => {
    if (node.type === 'COMPONENT') found.push(node)
    for (const child of node.children ?? []) walk(child)
  }
  walk(root)
  return found.length > 0 ? found : [root]
}

function describe(node) {
  const text = findText(node)
  return {
    name: node.name,
    size: node.absoluteBoundingBox
      ? `${round(node.absoluteBoundingBox.width)}×${round(node.absoluteBoundingBox.height)}`
      : '—',
    layout: node.layoutMode ?? '—',
    padding: paddingOf(node),
    gap: node.itemSpacing || null,
    radius: radiusOf(node),
    fill: solidOf(node.fills),
    stroke: solidOf(node.strokes),
    strokeWeight: node.strokeWeight,
    fontSize: text?.style?.fontSize ?? null,
    lineHeight: text?.style?.lineHeightPx ? round(text.style.lineHeightPx) : null,
    weight: text?.style?.fontWeight ?? null,
    textColor: solidOf(text?.fills),
    bound: Object.keys(node.boundVariables ?? {}),
  }
}

function findText(node) {
  if (node.type === 'TEXT') return node
  for (const child of node.children ?? []) {
    const found = findText(child)
    if (found) return found
  }
  return null
}

function paddingOf(node) {
  const top = node.paddingTop ?? 0
  const right = node.paddingRight ?? 0
  const bottom = node.paddingBottom ?? 0
  const left = node.paddingLeft ?? 0
  if (!(top || right || bottom || left)) return null
  if (top === bottom && right === left) return `${top} ${right}`
  return `${top} ${right} ${bottom} ${left}`
}

function radiusOf(node) {
  const radii = node.rectangleCornerRadii
  if (Array.isArray(radii)) {
    return radii.every((value) => value === radii[0]) ? radii[0] : radii.join(' ')
  }
  return node.cornerRadius ?? null
}

function solidOf(paints) {
  const paint = (paints ?? []).find((item) => item.visible !== false && item.type === 'SOLID')
  return paint ? toHex(paint.color, paint.opacity ?? 1) : null
}

function toHex({ r, g, b }, alpha) {
  const channel = (value) =>
    Math.round(value * 255)
      .toString(16)
      .padStart(2, '0')
  const base = `#${channel(r)}${channel(g)}${channel(b)}`
  return alpha >= 1 ? base : `${base}${channel(alpha)}`
}

function round(value) {
  return Math.round(value * 100) / 100
}

/** Lê os tokens atuais para dizer, valor a valor, se já existe um correspondente. */
function loadTokens() {
  const dir = join(repoRoot, 'packages/tokens/src')
  const read = (file) => JSON.parse(readFileSync(join(dir, file), 'utf8'))
  const toPx = (value) =>
    value.endsWith('rem') ? Number.parseFloat(value) * 16 : Number.parseFloat(value)

  const dimensions = (file, group) => {
    const entries = new Map()
    for (const [name, token] of Object.entries(read(file)[group])) {
      if (name.startsWith('$')) continue
      entries.set(toPx(token.$value), `${group}.${name}`)
    }
    return entries
  }

  const colors = new Map()
  const walk = (node, path) => {
    for (const [name, token] of Object.entries(node)) {
      if (name.startsWith('$')) continue
      const next = [...path, name]
      if (token.$value === undefined) {
        walk(token, next)
        continue
      }
      // Alias ({color.brand}) não é valor literal: o hex vem do token de destino.
      const value = String(token.$value)
      if (!value.startsWith('{')) colors.set(value.toLowerCase(), next.join('.'))
    }
  }
  walk(read('color.json').color, ['color'])

  return {
    spacing: dimensions('spacing.json', 'spacing'),
    radius: dimensions('radius.json', 'radius'),
    text: dimensions('text.json', 'text'),
    color: colors,
  }
}

function fail(message) {
  console.error(`Erro: ${message}`)
  process.exit(1)
}
