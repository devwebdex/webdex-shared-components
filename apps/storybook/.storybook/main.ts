import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { StorybookConfig } from '@storybook/react-vite'

const STATE_PREFIXES = ['hover:', 'active:', 'focus-visible:']

/**
 * A story Matriz mostra Hovered, Pressed e Focused lado a lado. Como são
 * pseudo-classes, ela força o estado removendo o prefixo da classe em tempo de
 * execução: `hover:shadow-4` vira `shadow-4`.
 *
 * O Tailwind só gera o que encontra no código-fonte, e essas versões sem prefixo
 * não aparecem em arquivo nenhum -- `shadow-6` e `outline-brand`, por exemplo,
 * saíam faltando e os estados não apareciam.
 *
 * A lista é derivada do próprio cva do componente, então ela não desatualiza
 * quando alguém adiciona um estado novo.
 */
async function generateForcedStateSource() {
  const { buttonVariants } = await import('@devwebdex/ui')
  const bare = new Set<string>()

  for (const size of ['large', 'medium', 'small'] as const) {
    for (const color of ['brand', 'code'] as const) {
      for (const variant of ['contained', 'outlined', 'text'] as const) {
        for (const utility of buttonVariants({ size, color, variant }).split(/\s+/)) {
          const prefix = STATE_PREFIXES.find((candidate) => utility.startsWith(candidate))
          if (prefix) bare.add(utility.slice(prefix.length))
        }
      }
    }
  }

  const target = fileURLToPath(new URL('../src/forced-states.generated.css', import.meta.url))
  writeFileSync(
    target,
    [
      '/* Gerado por .storybook/main.ts a partir do cva dos componentes. Não edite. */',
      `@source inline("${[...bare].sort().join(' ')}");`,
      '',
    ].join('\n')
  )
}

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: { name: '@storybook/react-vite', options: {} },
  // O @devwebdex/ui envia nomes de classe, não CSS: o Tailwind precisa rodar aqui
  // para transformar as classes em estilo, lendo os tokens de @devwebdex/tokens.
  async viteFinal(config) {
    await generateForcedStateSource()
    const { default: tailwindcss } = await import('@tailwindcss/vite')
    config.plugins = [...(config.plugins ?? []), tailwindcss()]
    return config
  },
}

export default config
