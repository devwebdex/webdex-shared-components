import { Spinner, type SpinnerProps } from '@devwebdex/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'

const SIZES = ['small', 'medium', 'large'] as const

const meta = {
  title: 'Componentes/Loading/Spinner',
  component: Spinner,
  args: { size: 'medium', label: 'Carregando' },
  // O docgen não extrai tipo de VariantProps, que é um mapped type: sem declarar
  // `table.type` à mão, a coluna de tipo do painel de controles fica vazia.
  argTypes: {
    size: {
      control: { type: 'inline-radio' },
      options: SIZES,
      description:
        'small (24px) para uso em linha; medium (72px) e large (106px) são os dois do design system.',
      table: {
        type: { summary: "'small' | 'medium' | 'large'" },
        defaultValue: { summary: 'medium' },
      },
    },
    label: {
      control: { type: 'text' },
      description: 'Texto para leitor de tela. Diga o que está carregando quando der.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'Carregando' } },
    },
  },
  parameters: {
    docs: {
      description: {
        component: [
          'O losango pixelado do design system: se monta do centro para fora, um anel por vez,',
          'nas cores brand-deep, brand e coral. É a assinatura de loading da marca; a formação do',
          'símbolo completo fica para splash e telas de abertura.',
          '',
          'Tem `role="status"` e o rótulo em texto escondido. Com movimento reduzido, fica parado.',
        ].join('\n'),
      },
    },
  },
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

/** Use os controles ao lado para trocar o tamanho e o rótulo. */
export const Playground: Story = {}

/** Os três tamanhos, lado a lado. */
export const Tamanhos: Story = {
  render: (args: SpinnerProps) => (
    <div className="flex items-end gap-8">
      {SIZES.map((size) => (
        <div key={size} className="flex flex-col items-center gap-3">
          <Spinner {...args} size={size} />
          <span className="font-mono text-sm text-text-secondary">{size}</span>
        </div>
      ))}
    </div>
  ),
}

/** Como no design system: o losango ao lado do que está acontecendo. */
export const ComTexto: Story = {
  name: 'Com texto',
  args: { size: 'small', label: 'Compilando WebdexVault.sol' },
  render: (args: SpinnerProps) => (
    <div className="flex items-center gap-3">
      <Spinner {...args} />
      {/* O texto visível repete o rótulo: o leitor de tela já o ouve pelo status. */}
      <span aria-hidden="true" className="font-mono text-sm text-text-secondary">
        Compilando WebdexVault.sol…
      </span>
    </div>
  ),
}
