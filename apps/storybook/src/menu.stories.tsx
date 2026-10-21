import {
  Button,
  type ListRadius,
  listItemVariants,
  listPopupVariants,
  listSeparatorClass,
  Menu,
  type MenuItem,
  type MenuProps,
} from '@devwebdex/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'

const actions: MenuItem[] = [
  { label: 'Editar' },
  { label: 'Duplicar' },
  { label: 'Arquivar', disabled: true },
  'separator',
  { label: 'Excluir', tone: 'danger' },
]

const meta = {
  title: 'Componentes/Menu',
  component: Menu,
  args: {
    trigger: <Button color="code">Ações</Button>,
    items: actions,
  },
  // O docgen não extrai tipo de VariantProps, que é um mapped type: sem declarar
  // `table.type` à mão, a coluna de tipo do painel de controles fica vazia.
  argTypes: {
    size: {
      control: { type: 'inline-radio' },
      options: ['large', 'medium', 'small'],
      description: 'Tamanho dos itens, nas alturas do Button.',
      table: {
        type: { summary: "'large' | 'medium' | 'small'" },
        defaultValue: { summary: 'medium' },
      },
    },
    radius: {
      control: { type: 'inline-radio' },
      options: ['0', '1', '2', '3', '4', '5', 'full'],
      description: 'Token de raio da lista. Os itens usam o raio da lista menos o respiro interno.',
      table: {
        type: { summary: "'0' | '1' | '2' | '3' | '4' | '5' | 'full'" },
        defaultValue: { summary: '2' },
      },
    },
    align: {
      control: { type: 'inline-radio' },
      options: ['start', 'center', 'end'],
      description: 'Alinhamento da lista em relação ao gatilho.',
      table: {
        type: { summary: "'start' | 'center' | 'end'" },
        defaultValue: { summary: 'start' },
      },
    },
    trigger: {
      control: false,
      description: 'Elemento que abre o menu, normalmente um Button.',
      table: { type: { summary: 'ReactElement' } },
    },
    items: {
      control: false,
      description: "Ações `{ label, onSelect?, icon?, disabled?, tone? }` e `'separator'`.",
      table: { type: { summary: 'MenuItem[]' } },
    },
  },
  parameters: {
    docs: {
      description: {
        component: [
          'Lista de ações aberta por um gatilho (padrão ARIA menu), sobre o DropdownMenu do Radix:',
          'teclado (setas, Enter, Esc), foco e leitor de tela vêm prontos. Nada fica selecionado.',
          '',
          'Ação destrutiva usa `tone: "danger"`. A referência visual ainda não tem menu: este',
          'visual é proposta para revisão do design.',
        ].join('\n'),
      },
    },
  },
} satisfies Meta<typeof Menu>

export default meta
type Story = StoryObj<typeof meta>

const RADII: ListRadius[] = ['0', '1', '2', '3', '4', '5', 'full']

/** Clique em "Ações" para abrir. Use os controles ao lado para trocar tamanho e arredondamento. */
export const Playground: Story = {}

/** Um menu por token de raio. */
export const Arredondamento: Story = {
  render: (args: MenuProps) => (
    <div className="flex flex-wrap gap-4">
      {RADII.map((radius) => (
        <Menu
          key={radius}
          {...args}
          radius={radius}
          trigger={<Button color="code">radius = {radius}</Button>}
        />
      ))}
    </div>
  ),
}

/**
 * A lista aberta, com os estados lado a lado. Os estados são forçados pelos mesmos
 * atributos que o Radix põe no DOM (`data-highlighted`, `data-disabled`), e as classes
 * saem do próprio componente: nada aqui é redigitado.
 */
export const Lista: Story = {
  render: ({ size, radius }: MenuProps) => (
    <div className={`${listPopupVariants({ radius })} min-w-56`}>
      <div className={listItemVariants({ size, radius })}>Editar</div>
      <div className={listItemVariants({ size, radius })} data-highlighted="">
        Duplicar (em foco)
      </div>
      <div className={listItemVariants({ size, radius })} data-disabled="">
        Arquivar (desabilitada)
      </div>
      <div className={listSeparatorClass} />
      <div className={listItemVariants({ size, radius, tone: 'danger' })}>Excluir</div>
      <div className={listItemVariants({ size, radius, tone: 'danger' })} data-highlighted="">
        Excluir (em foco)
      </div>
    </div>
  ),
}
