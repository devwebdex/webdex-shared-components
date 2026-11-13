import { Skeleton, SkeletonAvatar, SkeletonCard, SkeletonText } from '@devwebdex/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Componentes/Loading/Skeleton',
  component: SkeletonText,
  args: { lines: 3 },
  argTypes: {
    lines: {
      control: { type: 'number', min: 1, max: 8 },
      description: 'Quantidade de linhas; a última fica mais curta, como o fim de um parágrafo.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '3' } },
    },
  },
  parameters: {
    docs: {
      description: {
        component: [
          'A forma do conteúdo enquanto ele carrega: `SkeletonText`, `SkeletonAvatar`,',
          '`SkeletonCard` e o `Skeleton` base, para montar outras formas.',
          '',
          'É decorativo (`aria-hidden`). Quem avisa o leitor de tela é a região que carrega,',
          'com `aria-busy="true"` até o conteúdo chegar.',
          '',
          'O design system ainda não tem bloco de skeleton: o visual é proposta para revisão.',
        ].join('\n'),
      },
    },
  },
} satisfies Meta<typeof SkeletonText>

export default meta
type Story = StoryObj<typeof meta>

/** Texto: use o controle ao lado para mudar a quantidade de linhas. */
export const Texto: Story = {
  render: (args) => (
    <div className="w-80">
      <SkeletonText {...args} />
    </div>
  ),
}

/** Avatar nos três tamanhos: 32, 48 e 64px. */
export const Avatar: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      {(['small', 'medium', 'large'] as const).map((size) => (
        <div key={size} className="flex flex-col items-center gap-3">
          <SkeletonAvatar size={size} />
          <span className="font-mono text-3xs text-text-secondary">{size}</span>
        </div>
      ))}
    </div>
  ),
}

/** Card com imagem, autor e duas linhas de texto. */
export const Card: Story = {
  render: () => (
    <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-3">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  ),
}

/** Uma lista carregando, montada com as formas e o `Skeleton` base. */
export const Composicao: Story = {
  name: 'Composição',
  render: () => (
    <section aria-busy="true" aria-label="Transações" className="flex w-96 flex-col gap-4">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-center gap-3">
          <SkeletonAvatar size="small" />
          <SkeletonText lines={2} />
          <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
        </div>
      ))}
    </section>
  ),
}
