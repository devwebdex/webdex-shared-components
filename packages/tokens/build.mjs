import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import StyleDictionary from 'style-dictionary'

// A escada de estado (color-estado.json) é a cor base com um alpha fixo por estado. Os hex são
// literais -- o DTCG não sabe derivar "esta cor a 8%" de outra --, então nada os amarra à base:
// se `danger` mudar em color.json, `danger-hover` ficaria para trás sem ninguém notar. O build
// confere cada um e para, dizendo o valor certo.
const ALPHA_DO_ESTADO = { hover: 8, focus: 12, disabled: 18, pressed: 28, selected: 42, active: 56 }
const cores = {
  ...JSON.parse(readFileSync('src/color.json', 'utf8')).color,
  ...JSON.parse(readFileSync('src/color-estado.json', 'utf8')).color,
}
const divergentes = Object.entries(cores).flatMap(([nome, token]) => {
  const [, base, estado] = nome.match(/^(.+)-(hover|focus|disabled|pressed|selected|active)$/) ?? []
  if (!base || !estado || !cores[base]) return []
  const alpha = Math.round((ALPHA_DO_ESTADO[estado] * 255) / 100)
    .toString(16)
    .padStart(2, '0')
  const esperado = `${cores[base].$value.slice(0, 7)}${alpha}`.toLowerCase()
  return token.$value.toLowerCase() === esperado
    ? []
    : [`  ${nome}: ${token.$value}, deveria ser ${esperado}`]
})
if (divergentes.length) {
  throw new Error(`color-estado.json não acompanha a cor base:\n${divergentes.join('\n')}`)
}

// O seletor `@theme` faz cada token virar um tema do Tailwind 4: o caminho do token
// precisa começar por um namespace do Tailwind (color, radius, spacing, font, text...).
const sd = new StyleDictionary({
  source: ['src/**/*.json'],
  usesDtcg: true,
  platforms: {
    tailwind: {
      transforms: ['name/kebab', 'color/css'],
      buildPath: 'dist/',
      files: [
        {
          destination: 'theme.css',
          format: 'css/variables',
          options: { selector: '@theme', outputReferences: true },
        },
      ],
    },
  },
})

await sd.buildAllPlatforms()

// Zera o tema padrão do Tailwind nos namespaces cuja escala inteira vem do Figma. Sem isto, os
// valores dele convivem com os nossos em silêncio, de dois jeitos:
//
// - Casados com o tamanho. O Tailwind define, para cada tamanho dele, uma entrelinha:
//   --text-xs--line-height vale 1,333, calculada para os 12px do text-xs DELE. Sobrescrever só
//   --text-xs (16px na escala do Figma) deixava essa proporção valendo em todo text-xs sem
//   leading-* -- o título do Card saía com 21,33px de entrelinha.
// - Nomes que só ele tem. text-base, rounded-lg e leading-relaxed continuavam funcionando com o
//   valor do Tailwind. Foi assim que três arquivos esquecidos no remapeamento para a escala do
//   Figma seguiram com text-base, que virou 16px, sem nenhum teste reclamar: a classe existia.
//   Zerado, um nome fora da escala não gera CSS, e o teste de CSS do Storybook acusa.
//
// Cor, espaçamento e sombra ficam de fora: o padrão do Tailwind ainda é usado ali (bg-white, o
// multiplicador --spacing de size-20 e h-28, shadow-none).
const ZERADOS = ['text', 'leading', 'tracking', 'radius', 'font-weight']
const theme = readFileSync('dist/theme.css', 'utf8')
const reset = ZERADOS.map((namespace) => `  --${namespace}-*: initial;`).join('\n')
writeFileSync('dist/theme.css', theme.replace('@theme {', `@theme {\n${reset}\n`))

// O DTCG não descreve @keyframes: o movimento vem de um CSS escrito à mão, anexado ao mesmo arquivo
// para quem consome continuar importando só o theme.css.
appendFileSync('dist/theme.css', `\n${readFileSync('src/motion.css', 'utf8')}`)

appendFileSync('dist/theme.css', `\n${modoClaro()}`)

function modoClaro() {
  const escuro = coresAchatadas()
  const claro = Object.fromEntries(
    Object.entries(JSON.parse(readFileSync('modes/light.json', 'utf8')).color).map(
      ([nome, token]) => [nome, token.$value]
    )
  )
  const desconhecidos = Object.keys(claro).filter((nome) => !(nome in escuro))
  if (desconhecidos.length) {
    throw new Error(
      `modes/light.json tem cores que o modo escuro não tem: ${desconhecidos.join(', ')}`
    )
  }

  for (const [nome, valor] of Object.entries(escuro)) {
    const [, base, estado] =
      nome.match(/^(.+)-(hover|focus|disabled|pressed|selected|active)$/) ?? []
    const [, baseBg] = nome.match(/^(.+)-bg$/) ?? []
    if (base && claro[base] && !(nome in claro)) {
      const alpha = Math.round((ALPHA_DO_ESTADO[estado] * 255) / 100)
      claro[nome] = `${claro[base].slice(0, 7)}${alpha.toString(16).padStart(2, '0')}`
    } else if (baseBg && claro[baseBg] && !(nome in claro)) {
      claro[nome] = `${claro[baseBg].slice(0, 7)}${valor.slice(7, 9)}`
    }
  }

  let mudou = true
  while (mudou) {
    mudou = false
    for (const [nome, valor] of Object.entries(escuro)) {
      const [, ref] = valor.match(/^\{color\.(.+)\}$/) ?? []
      const alvo = ref?.replaceAll('.', '-')
      if (alvo && alvo in claro && !(nome in claro)) {
        claro[nome] = `var(--color-${alvo})`
        mudou = true
      }
    }
  }

  const linhas = Object.entries(claro).map(([nome, valor]) => `  --color-${nome}: ${valor};`)
  return ['[data-theme="light"] {', '  color-scheme: light;', ...linhas, '}', ''].join('\n')
}

function coresAchatadas() {
  const todas = {}
  const visitar = (grupo, prefixo) => {
    for (const [chave, valor] of Object.entries(grupo)) {
      if (chave.startsWith('$')) continue
      const nome = prefixo ? `${prefixo}-${chave}` : chave
      if (valor && typeof valor === 'object' && '$value' in valor)
        todas[nome] = String(valor.$value)
      else if (valor && typeof valor === 'object') visitar(valor, nome)
    }
  }
  for (const arquivo of ['color.json', 'color-estado.json', 'color-chart.json']) {
    visitar(JSON.parse(readFileSync(`src/${arquivo}`, 'utf8')).color, '')
  }
  return todas
}
