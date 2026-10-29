import { appendFileSync, readFileSync } from 'node:fs'
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

// O DTCG não descreve @keyframes: o movimento vem de um CSS escrito à mão, anexado ao mesmo arquivo
// para quem consome continuar importando só o theme.css.
appendFileSync('dist/theme.css', `\n${readFileSync('src/motion.css', 'utf8')}`)
