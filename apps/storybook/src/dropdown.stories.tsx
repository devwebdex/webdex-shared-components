import {
  Button,
  type ListRadius,
  Menu,
  type MenuItem,
  Select,
  type SelectOption,
} from '@devwebdex/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  NetworkArbitrumOne,
  NetworkBase,
  NetworkEthereum,
  NetworkOptimism,
  NetworkPolygon,
  NetworkPolygonAmoy,
} from '@web3icons/react'
import type { ReactNode } from 'react'

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
  {
    value: 'optimism',
    label: 'Optimism',
    icon: <NetworkOptimism variant="branded" />,
    disabled: true,
  },
]

const periods: SelectOption[] = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
]

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

const actions: MenuItem[] = [
  {
    label: 'Copiar endereço',
    icon: (
      <Icon>
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </Icon>
    ),
  },
  {
    label: 'Ver no explorador',
    icon: (
      <Icon>
        <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      </Icon>
    ),
  },
  { label: 'Trocar de carteira', disabled: true },
  'separator',
  {
    label: 'Desconectar',
    tone: 'danger',
    icon: (
      <Icon>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
      </Icon>
    ),
  },
]

const RADII: ListRadius[] = ['0', '1', '2', '3', '4', '5', 'full']
const SIZES = ['large', 'medium', 'small'] as const

const meta = {
  title: 'Componentes/Dropdown/Visão geral',
  id: 'componentes-dropdown-visao-geral',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Todas as variações do Select e do Menu numa página, para revisão. Cada uma tem a story própria em Dropdown/Select e Dropdown/Menu, com os controles.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function Section({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
        <p className="text-sm text-text-secondary">{hint}</p>
      </div>
      {children}
    </section>
  )
}

/** Abra cada campo e cada menu: a lista cresce a partir do gatilho e a seta gira. */
export const Variacoes: Story = {
  name: 'Variações',
  render: () => (
    <div className="flex flex-col gap-8 p-6">
      <div className="grid gap-8 md:grid-cols-2">
        <Section title="Rede" hint="Símbolo de cada rede na lista e no campo.">
          <div className="w-72">
            <Select options={networks} placeholder="Escolha a rede" aria-label="Rede" />
          </div>
        </Section>
        <Section title="Rede escolhida" hint="O símbolo vai junto para o campo.">
          <div className="w-72">
            <Select options={networks} defaultValue="polygon" aria-label="Rede escolhida" />
          </div>
        </Section>
        <Section title="Chamar a atenção" hint="O halo pulsa até o campo ser aberto.">
          <div className="w-72">
            <Select
              options={networks}
              placeholder="Escolha a rede para continuar"
              aria-label="Rede (atenção)"
              attention
            />
          </div>
        </Section>
        <Section title="Sem imagem" hint="Só texto, para listas comuns.">
          <div className="w-72">
            <Select options={periods} placeholder="Escolha o período" aria-label="Período" />
          </div>
        </Section>
        <Section title="Desabilitado" hint="Campo inteiro desabilitado.">
          <div className="w-72">
            <Select
              options={networks}
              defaultValue="ethereum"
              aria-label="Rede (desabilitado)"
              disabled
            />
          </div>
        </Section>
        <Section title="Tamanhos" hint="Large, medium e small, nas alturas do Button.">
          <div className="flex w-72 flex-col gap-3">
            {SIZES.map((size) => (
              <Select
                key={size}
                options={networks}
                defaultValue="polygon"
                size={size}
                aria-label={`Rede (${size})`}
              />
            ))}
          </div>
        </Section>
      </div>

      <Section title="Arredondamento" hint="Um campo por token de raio, de 0 a full.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RADII.map((radius) => (
            <Select
              key={radius}
              options={networks}
              radius={radius}
              placeholder={`radius = ${radius}`}
              aria-label={`Rede (radius ${radius})`}
            />
          ))}
        </div>
      </Section>

      <Section
        title="Menu de ações"
        hint="Gatilho com seta; ações com ícone; Desconectar é destrutiva."
      >
        <div className="flex flex-wrap items-center gap-4">
          <Menu label="Carteira" items={actions} />
          <Menu label="Carteira (atenção)" items={actions} attention />
          <Menu label="Large" items={actions} size="large" />
          <Menu label="Small" items={actions} size="small" />
          <Menu trigger={<Button>Nova transação</Button>} items={actions} />
          <Menu label="Lista com raio full" items={actions} radius="full" />
        </div>
      </Section>
    </div>
  ),
}
