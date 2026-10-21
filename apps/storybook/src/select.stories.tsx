import {
  type ListRadius,
  listItemVariants,
  listPopupVariants,
  Select,
  type SelectOption,
  type SelectProps,
} from '@devwebdex/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  NetworkArbitrumOne,
  NetworkAvalanche,
  NetworkBase,
  NetworkBinanceSmartChain,
  NetworkEthereum,
  NetworkOptimism,
  NetworkPolygon,
  NetworkPolygonAmoy,
} from '@web3icons/react'

// Símbolos oficiais das redes (@web3icons, variante com as cores de cada marca). O Select não
// conhece ícone de rede: `icon` aceita qualquer imagem, e o tamanho vem do tamanho do campo.
const networks: SelectOption[] = [
  { value: 'polygon', label: 'Polygon', icon: <NetworkPolygon variant="branded" /> },
  {
    value: 'amoy',
    label: 'Polygon Amoy (testnet)',
    icon: <NetworkPolygonAmoy variant="branded" />,
  },
  { value: 'ethereum', label: 'Ethereum', icon: <NetworkEthereum variant="branded" /> },
  { value: 'base', label: 'Base', icon: <NetworkBase variant="branded" /> },
  { value: 'arbitrum', label: 'Arbitrum One', icon: <NetworkArbitrumOne variant="branded" /> },
  { value: 'optimism', label: 'Optimism', icon: <NetworkOptimism variant="branded" /> },
  { value: 'bnb', label: 'BNB Chain', icon: <NetworkBinanceSmartChain variant="branded" /> },
  {
    value: 'avalanche',
    label: 'Avalanche',
    icon: <NetworkAvalanche variant="branded" />,
    disabled: true,
  },
]

const meta = {
  title: 'Componentes/Dropdown/Select',
  component: Select,
  args: {
    options: networks,
    placeholder: 'Escolha a rede',
    'aria-label': 'Rede',
  },
  // O docgen não extrai tipo de VariantProps, que é um mapped type: sem declarar
  // `table.type` à mão, a coluna de tipo do painel de controles fica vazia.
  argTypes: {
    size: {
      control: { type: 'inline-radio' },
      options: ['large', 'medium', 'small'],
      description: 'Mesmas alturas do Button (42, 36 e 30px), para alinhar campo e botão.',
      table: {
        type: { summary: "'large' | 'medium' | 'small'" },
        defaultValue: { summary: 'medium' },
      },
    },
    radius: {
      control: { type: 'inline-radio' },
      options: ['0', '1', '2', '3', '4', '5', 'full'],
      description:
        'Token de raio do gatilho e da lista. Os itens usam o raio da lista menos o respiro interno.',
      table: {
        type: { summary: "'0' | '1' | '2' | '3' | '4' | '5' | 'full'" },
        defaultValue: { summary: '2' },
      },
    },
    attention: {
      control: { type: 'boolean' },
      description:
        'Halo que pulsa em volta do campo para chamar a atenção. Some quando a lista abre e com movimento reduzido.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Desabilita o campo inteiro. Para uma opção só, use `disabled` nela.',
      table: { type: { summary: 'boolean' } },
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Texto mostrado enquanto nenhum valor foi escolhido.',
      table: { type: { summary: 'ReactNode' } },
    },
    options: {
      control: false,
      description:
        'Lista de `{ value, label, icon?, disabled? }`. O ícone aparece também no campo.',
      table: { type: { summary: 'SelectOption[]' } },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: [
          'Escolha de um valor numa lista (padrão ARIA listbox), sobre o Select do Radix:',
          'teclado (setas, Enter, Esc, digitar para buscar), foco e leitor de tela vêm prontos.',
          '',
          'No hover a borda esquenta para `brand-soft`; aberto, ela fica `brand` e a seta gira.',
          'A lista cresce a partir do campo, e o item em destaque ganha uma barra na borda esquerda.',
          'A referência visual ainda não tem campo de seleção: este visual é proposta para revisão do design.',
        ].join('\n'),
      },
    },
  },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

const SIZES = ['large', 'medium', 'small'] as const
const RADII: ListRadius[] = ['0', '1', '2', '3', '4', '5', 'full']

/** Redes com o símbolo de cada uma. Use os controles ao lado para trocar tamanho e raio. */
export const Playground: Story = {}

/** O halo pulsa até a pessoa abrir o campo: use quando escolher a rede é o próximo passo. */
export const Atencao: Story = { name: 'Atenção', args: { attention: true } }

/** Com uma rede já escolhida: o símbolo vai para o campo junto com o nome. */
export const ComValor: Story = { name: 'Com valor', args: { defaultValue: 'polygon' } }

/** Só texto, sem imagem. */
export const SemImagens: Story = {
  name: 'Sem imagens',
  args: {
    placeholder: 'Escolha o período',
    'aria-label': 'Período',
    options: [
      { value: '7d', label: 'Últimos 7 dias' },
      { value: '30d', label: 'Últimos 30 dias' },
      { value: '90d', label: 'Últimos 90 dias' },
    ],
  },
}

/** Desabilitado. */
export const Desabilitado: Story = { args: { disabled: true, defaultValue: 'polygon' } }

/** Os três tamanhos, um embaixo do outro. */
export const Tamanhos: Story = {
  render: (args: SelectProps) => (
    <div className="flex flex-col gap-4">
      {SIZES.map((size) => (
        <Select
          key={size}
          {...args}
          size={size}
          defaultValue="polygon"
          aria-label={`Rede (${size})`}
        />
      ))}
    </div>
  ),
}

/** Um campo por token de raio. */
export const Arredondamento: Story = {
  render: (args: SelectProps) => (
    <div className="flex flex-col gap-4">
      {RADII.map((radius) => (
        <Select
          key={radius}
          {...args}
          radius={radius}
          placeholder={`radius = ${radius}`}
          aria-label={`Rede (radius ${radius})`}
        />
      ))}
    </div>
  ),
}

/**
 * A lista aberta, com os estados lado a lado. Os estados são forçados pelos mesmos
 * atributos que o Radix põe no DOM (`data-highlighted`, `data-state`, `data-disabled`),
 * e as classes saem do próprio componente: nada aqui é redigitado.
 */
export const Lista: Story = {
  render: ({ size, radius }: SelectProps) => {
    const item = listItemVariants({ size, radius })
    return (
      <div className={listPopupVariants({ radius })}>
        <div className={item}>
          <NetworkEthereum variant="branded" />
          Opção normal
        </div>
        <div className={item} data-highlighted="">
          <NetworkBase variant="branded" />
          Em destaque (teclado ou mouse)
        </div>
        <div className={item} data-state="checked">
          <NetworkPolygon variant="branded" />
          Selecionada
        </div>
        <div className={item} data-disabled="">
          <NetworkAvalanche variant="branded" />
          Desabilitada
        </div>
      </div>
    )
  },
}
