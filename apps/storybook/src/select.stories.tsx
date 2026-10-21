import {
  type ListRadius,
  listItemVariants,
  listPopupVariants,
  Select,
  type SelectProps,
} from '@devwebdex/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'

const networks = [
  { value: 'polygon', label: 'Polygon' },
  { value: 'amoy', label: 'Polygon Amoy (testnet)' },
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'base', label: 'Base', disabled: true },
]

const meta = {
  title: 'Componentes/Select',
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
      description: 'Lista de `{ value, label, disabled? }`.',
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
          'O gatilho segue o Button `code`. Aberto, sem valor e opção marcada são atributos do',
          'Radix (`data-state`, `data-placeholder`), não props. A referência visual ainda não tem',
          'campo de seleção: este visual é proposta para revisão do design.',
        ].join('\n'),
      },
    },
  },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

const SIZES = ['large', 'medium', 'small'] as const
const RADII: ListRadius[] = ['0', '1', '2', '3', '4', '5', 'full']

/** Use os controles ao lado para trocar tamanho e arredondamento. */
export const Playground: Story = {}

/** Com um valor já escolhido. */
export const ComValor: Story = { args: { defaultValue: 'polygon' } }

/** Desabilitado. */
export const Desabilitado: Story = { args: { disabled: true, defaultValue: 'polygon' } }

/** Os três tamanhos, um embaixo do outro. */
export const Tamanhos: Story = {
  render: (args: SelectProps) => (
    <div className="flex flex-col gap-4">
      {SIZES.map((size) => (
        <Select key={size} {...args} size={size} aria-label={`Rede (${size})`} />
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
  render: ({ size, radius }: SelectProps) => (
    <div className={listPopupVariants({ radius })}>
      <div className={listItemVariants({ size, radius })}>Opção normal</div>
      <div className={listItemVariants({ size, radius })} data-highlighted="">
        Em foco (teclado ou mouse)
      </div>
      <div className={listItemVariants({ size, radius })} data-state="checked">
        Selecionada
      </div>
      <div className={listItemVariants({ size, radius })} data-disabled="">
        Desabilitada
      </div>
    </div>
  ),
}
