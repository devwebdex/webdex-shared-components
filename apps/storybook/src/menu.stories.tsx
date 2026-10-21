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
import type { ReactNode } from 'react'
import { MenuMeasurements } from './dropdown-measurements.js'

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

const Pencil = () => (
  <Icon>
    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </Icon>
)
const Copy = () => (
  <Icon>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </Icon>
)
const Archive = () => (
  <Icon>
    <rect x="2" y="3" width="20" height="5" rx="1" />
    <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4" />
  </Icon>
)
const Trash = () => (
  <Icon>
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
  </Icon>
)

const actions: MenuItem[] = [
  { label: 'Editar', icon: <Pencil /> },
  { label: 'Duplicar', icon: <Copy /> },
  { label: 'Arquivar', icon: <Archive />, disabled: true },
  'separator',
  { label: 'Excluir', icon: <Trash />, tone: 'danger' },
]

const meta = {
  title: 'Componentes/Dropdown/Menu',
  component: Menu,
  args: {
    label: 'Ações',
    items: actions,
  },
  // O docgen não extrai tipo de VariantProps, que é um mapped type: sem declarar
  // `table.type` à mão, a coluna de tipo do painel de controles fica vazia.
  argTypes: {
    label: {
      control: { type: 'text' },
      description: 'Rótulo do gatilho padrão: um Button `code` com a seta que gira ao abrir.',
      table: { type: { summary: 'ReactNode' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['large', 'medium', 'small'],
      description: 'Tamanho do gatilho e dos itens, nas alturas do Button.',
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
    attention: {
      control: { type: 'boolean' },
      description:
        'Halo que pulsa em volta do gatilho padrão para chamar a atenção. Some quando o menu abre e com movimento reduzido.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
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
      description: 'Gatilho próprio no lugar do padrão; `label` e `attention` deixam de valer.',
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
          'A seta do gatilho gira ao abrir, a lista cresce a partir dele e o item em destaque ganha',
          'uma barra na borda esquerda. Ação destrutiva usa `tone: "danger"`. A referência visual',
          'ainda não tem menu: este visual é proposta para revisão do design.',
        ].join('\n'),
      },
    },
  },
} satisfies Meta<typeof Menu>

export default meta
type Story = StoryObj<typeof meta>

const RADII: ListRadius[] = ['0', '1', '2', '3', '4', '5', 'full']

/** Clique em "Ações" para abrir. Use os controles ao lado para trocar tamanho e raio. */
export const Playground: Story = {}

/** O halo pulsa até a pessoa abrir o menu. */
export const Atencao: Story = { name: 'Atenção', args: { attention: true } }

/** Ações só com texto. */
export const SemIcones: Story = {
  name: 'Sem ícones',
  args: {
    items: [
      { label: 'Editar' },
      { label: 'Duplicar' },
      'separator',
      { label: 'Excluir', tone: 'danger' },
    ],
  },
}

/** Qualquer elemento serve de gatilho, por exemplo um Button da marca. */
export const GatilhoProprio: Story = {
  name: 'Gatilho próprio',
  args: { trigger: <Button>Nova transação</Button> },
}

/** Um menu por token de raio. */
export const Arredondamento: Story = {
  render: (args: MenuProps) => (
    <div className="flex flex-wrap gap-4">
      {RADII.map((radius) => (
        <Menu key={radius} {...args} radius={radius} label={`radius = ${radius}`} />
      ))}
    </div>
  ),
}

/**
 * A lista aberta, com os estados lado a lado. Os estados são forçados pelos mesmos
 * atributos que o Radix põe no DOM (`data-highlighted`, `aria-disabled`), e as classes
 * saem do próprio componente: nada aqui é redigitado.
 */
export const Lista: Story = {
  render: ({ size, radius }: MenuProps) => {
    const item = listItemVariants({ size, radius })
    const danger = listItemVariants({ size, radius, tone: 'danger' })
    return (
      <div className={`${listPopupVariants({ radius })} min-w-56`}>
        <div className={item}>
          <Pencil />
          Editar
        </div>
        <div className={item} data-highlighted="">
          <Copy />
          Duplicar (em destaque)
        </div>
        <div className={item} aria-disabled="true">
          <Archive />
          Arquivar (desabilitada)
        </div>
        <div className={listSeparatorClass} />
        <div className={danger}>
          <Trash />
          Excluir
        </div>
        <div className={danger} data-highlighted="">
          <Trash />
          Excluir (em destaque)
        </div>
      </div>
    )
  },
}

/**
 * Mede o componente já renderizado e diz de qual token veio cada valor.
 *
 * Os números saem de getComputedStyle, não da leitura das classes: é o que o navegador
 * aplicou. O que aparece como "sem token" existe no componente mas não corresponde a
 * Variable nenhuma, e é a lista do que falta criar no Figma.
 */
export const Medidas: Story = {
  render: () => <MenuMeasurements items={actions} icon={<Pencil />} />,
  parameters: { layout: 'padded' },
}
