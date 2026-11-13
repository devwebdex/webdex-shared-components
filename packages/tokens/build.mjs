import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import StyleDictionary from 'style-dictionary'

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
