import { Combobox, type ComboboxOption, type ComboboxProps } from '@devwebdex/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  NetworkArbitrumNova,
  NetworkArbitrumOne,
  NetworkAvalanche,
  NetworkBase,
  NetworkBaseSepolia,
  NetworkBinanceSmartChain,
  NetworkBlast,
  NetworkCelo,
  NetworkEthereum,
  NetworkFantom,
  NetworkGnosis,
  NetworkLinea,
  NetworkMantle,
  NetworkMoonbeam,
  NetworkOptimism,
  NetworkPolygon,
  NetworkPolygonAmoy,
  NetworkPolygonZkevm,
  NetworkScroll,
  NetworkSepolia,
} from '@web3icons/react'
import { ComboboxMeasurements } from './dropdown-measurements.js'

// Lista longa de propósito: é o caso em que a busca vale mais que rolar.
const networks: ComboboxOption[] = [
  {
    value: 'polygon',
    label: 'Polygon',
    icon: <NetworkPolygon variant="branded" />,
    keywords: ['matic', 'pol'],
  },
  {
    value: 'amoy',
    label: 'Polygon Amoy (testnet)',
    icon: <NetworkPolygonAmoy variant="branded" />,
    keywords: ['matic', 'pol', 'teste'],
  },
  {
    value: 'polygon-zkevm',
    label: 'Polygon zkEVM',
    icon: <NetworkPolygonZkevm variant="branded" />,
  },
  {
    value: 'ethereum',
    label: 'Ethereum',
    icon: <NetworkEthereum variant="branded" />,
    keywords: ['eth', 'mainnet'],
  },
  {
    value: 'sepolia',
    label: 'Sepolia (testnet)',
    icon: <NetworkSepolia variant="branded" />,
    keywords: ['eth', 'teste'],
  },
  { value: 'base', label: 'Base', icon: <NetworkBase variant="branded" /> },
  {
    value: 'base-sepolia',
    label: 'Base Sepolia (testnet)',
    icon: <NetworkBaseSepolia variant="branded" />,
    keywords: ['teste'],
  },
  {
    value: 'arbitrum',
    label: 'Arbitrum One',
    icon: <NetworkArbitrumOne variant="branded" />,
    keywords: ['arb'],
  },
  {
    value: 'arbitrum-nova',
    label: 'Arbitrum Nova',
    icon: <NetworkArbitrumNova variant="branded" />,
    keywords: ['arb'],
  },
  {
    value: 'optimism',
    label: 'Optimism',
    icon: <NetworkOptimism variant="branded" />,
    keywords: ['op'],
  },
  {
    value: 'bnb',
    label: 'BNB Chain',
    icon: <NetworkBinanceSmartChain variant="branded" />,
    keywords: ['bsc', 'binance'],
  },
  {
    value: 'avalanche',
    label: 'Avalanche',
    icon: <NetworkAvalanche variant="branded" />,
    keywords: ['avax'],
  },
  { value: 'linea', label: 'Linea', icon: <NetworkLinea variant="branded" /> },
  { value: 'scroll', label: 'Scroll', icon: <NetworkScroll variant="branded" /> },
  { value: 'blast', label: 'Blast', icon: <NetworkBlast variant="branded" /> },
  { value: 'mantle', label: 'Mantle', icon: <NetworkMantle variant="branded" /> },
  { value: 'gnosis', label: 'Gnosis', icon: <NetworkGnosis variant="branded" /> },
  { value: 'celo', label: 'Celo', icon: <NetworkCelo variant="branded" /> },
  {
    value: 'fantom',
    label: 'Fantom',
    icon: <NetworkFantom variant="branded" />,
    disabled: true,
  },
  { value: 'moonbeam', label: 'Moonbeam', icon: <NetworkMoonbeam variant="branded" /> },
]

const meta = {
  title: 'Componentes/Dropdown/Combobox',
  component: Combobox,
  args: {
    options: networks,
    placeholder: 'Escolha a rede',
    searchPlaceholder: 'Buscar rede',
    emptyMessage: 'Nenhuma rede encontrada.',
    'aria-label': 'Rede',
  },
  // O docgen não extrai tipo de VariantProps, que é um mapped type: sem declarar
  // `table.type` à mão, a coluna de tipo do painel de controles fica vazia.
  argTypes: {
    size: {
      control: { type: 'inline-radio' },
      options: ['large', 'medium', 'small'],
      description: 'Mesmas alturas do Select e do Button.',
      table: {
        type: { summary: "'large' | 'medium' | 'small'" },
        defaultValue: { summary: 'medium' },
      },
    },
    radius: {
      control: { type: 'inline-radio' },
      options: ['0', '1', '2', '3', '4', '5', 'full'],
      description: 'Token de raio do campo e da lista.',
      table: {
        type: { summary: "'0' | '1' | '2' | '3' | '4' | '5' | 'full'" },
        defaultValue: { summary: '2' },
      },
    },
    attention: {
      control: { type: 'boolean' },
      description: 'Halo que pulsa até a pessoa escolher um valor.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: { type: 'boolean' },
      table: { type: { summary: 'boolean' } },
    },
    placeholder: { control: { type: 'text' }, table: { type: { summary: 'ReactNode' } } },
    searchPlaceholder: { control: { type: 'text' }, table: { type: { summary: 'string' } } },
    emptyMessage: { control: { type: 'text' }, table: { type: { summary: 'ReactNode' } } },
    options: {
      control: false,
      description:
        'Lista de `{ value, label, icon?, keywords?, disabled? }`. A busca usa o rótulo em texto e as `keywords`.',
      table: { type: { summary: 'ComboboxOption[]' } },
    },
  },
  // Campo com a largura de um formulário; a story Medidas pede a largura toda para a tabela.
  decorators: [
    (Story, context) =>
      context.parameters.fullWidth ? (
        <Story />
      ) : (
        <div className="w-72">
          <Story />
        </div>
      ),
  ],
  parameters: {
    docs: {
      description: {
        component: [
          'O Select com busca, para listas longas. Digite para filtrar (pelo nome ou por termos como',
          '`matic`, `eth`, `arb`), use as setas e Enter para escolher, Esc para fechar.',
          '',
          'Busca e teclado vêm do `cmdk`, a mesma base do painel da WEbdEX; a caixa que abre é o',
          'Popover do Radix. Gatilho e lista têm o visual do Select.',
        ].join('\n'),
      },
    },
  },
} satisfies Meta<typeof Combobox>

export default meta
type Story = StoryObj<typeof meta>

/** Vinte redes: digite "arb", "eth" ou "teste" para ver a busca filtrar. */
export const Playground: Story = {}

/** O halo pulsa até a pessoa escolher uma rede. */
export const Atencao: Story = { name: 'Atenção', args: { attention: true } }

/** Com uma rede já escolhida. */
export const ComValor: Story = { name: 'Com valor', args: { defaultValue: 'polygon' } }

/** Desabilitado. */
export const Desabilitado: Story = { args: { disabled: true, defaultValue: 'ethereum' } }

/** Os três tamanhos. */
export const Tamanhos: Story = {
  render: (args: ComboboxProps) => (
    <div className="flex flex-col gap-4">
      {(['large', 'medium', 'small'] as const).map((size) => (
        <Combobox
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

/** Mede o componente já renderizado e diz de qual token veio cada valor, como no Select. */
export const Medidas: Story = {
  render: () => (
    <ComboboxMeasurements options={networks} icon={<NetworkPolygon variant="branded" />} />
  ),
  parameters: { layout: 'padded', fullWidth: true },
}
