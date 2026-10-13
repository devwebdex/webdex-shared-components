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
