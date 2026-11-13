import type { Meta, StoryObj } from '@storybook/react-vite'
import { type Token, tokensOf } from '../lib/tokens.js'

/**
 * Todas as cores do tema, lidas de `packages/tokens/src` -- um token novo aparece aqui sozinho.
 *
 * O fundo da página é o `background` da marca, de propósito: metade das cores tem alpha
 * embutido e só se lê sobre ele. O design system é só escuro.
 */
const meta = {
  title: 'Fundação/Cores',
  parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const ESTADO = /-(hover|focus|disabled|pressed|selected|active)$/

/**
 * Em que grupo cada cor aparece. Vai pelo nome, e o que não casar com nenhum cai em "Outras"
 * -- uma cor nova nunca some da página, no máximo aparece no grupo errado.
 */
const GRUPOS: [titulo: string, pertence: (nome: string) => boolean][] = [
  ['Marca', (nome) => /^brand(-deep|-soft)?$/.test(nome)],
  ['Magenta', (nome) => nome.startsWith('magenta-')],
  ['Coral', (nome) => nome.startsWith('coral-')],
  ['Semânticas', (nome) => /^(success|warning|danger|info)(-bg)?$/.test(nome)],
  ['Superfícies', (nome) => nome === 'background' || nome.startsWith('surface-')],
  // Texto e Linha antes de Estados: `text-disabled` e `line-pressed` terminam com nome de
  // estado, e cairiam lá.
  ['Texto', (nome) => nome.startsWith('text-')],
  ['Linha', (nome) => nome.startsWith('line-')],
  ['Estados', (nome) => ESTADO.test(nome) || /^(white|black)$/.test(nome)],
]

function agrupar(cores: Token[]): [string, Token[]][] {
  const sobra = new Set(cores)
  const grupos: [string, Token[]][] = []
  for (const [titulo, pertence] of GRUPOS) {
    const membros = cores.filter((token) => sobra.has(token) && pertence(token.name))
    for (const token of membros) sobra.delete(token)
    if (membros.length) grupos.push([titulo, membros])
  }
  if (sobra.size) grupos.push(['Outras', [...sobra]])
  return grupos
}

function Amostra({ token }: { token: Token }) {
  return (
    <div className="flex w-56 flex-col gap-2">
      <div
        className="h-14 rounded-2 inset-ring-1 inset-ring-line-default"
        style={{ background: token.value }}
      />
      <code className="font-mono text-3xs text-text-primary">{token.name}</code>
      <span className="font-mono text-3xs text-text-secondary">{token.value}</span>
      {token.description && (
        <p className="text-3xs text-text-disabled leading-4xs">{token.description}</p>
      )}
    </div>
  )
}

/**
 * Cada cor com o nome do token -- a classe é `bg-<nome>`, `text-<nome>`, `border-<nome>`... --
 * o valor e, quando houver, a descrição que veio do JSON.
 */
export const Paleta: Story = {
  render: () => (
    <div className="flex flex-col gap-10 p-8">
      {agrupar(tokensOf('color')).map(([titulo, membros]) => (
        <section key={titulo} className="flex flex-col gap-4">
          <h2 className="font-semibold text-text-primary text-xs">
            {titulo} <span className="font-normal text-text-secondary">· {membros.length}</span>
          </h2>
          <div className="flex flex-wrap gap-6">
            {membros.map((token) => (
              <Amostra key={token.name} token={token} />
            ))}
          </div>
        </section>
      ))}
    </div>
  ),
}
