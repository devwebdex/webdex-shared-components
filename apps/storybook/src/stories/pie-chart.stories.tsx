import { PieChart } from '@devwebdex/ui'
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { allocation, usd } from '../lib/chart-data.js'

const frame: Decorator[] = [
  (Story) => (
    <div className="w-[480px] max-w-full">
      <Story />
    </div>
  ),
]

const meta = {
  title: 'Componentes/Dados/PieChart',
  component: PieChart,
  decorators: frame,
  args: {
    title: 'Carteira por ativo, em USD',
    data: allocation,
    valueFormatter: usd,
    donut: false,
    height: 280,
    loading: false,
  },
  argTypes: {
    title: {
      control: { type: 'text' },
      description: 'Nome acessível e legenda da tabela de dados. Não aparece na tela.',
      table: { type: { summary: 'string' } },
    },
    donut: {
      control: { type: 'boolean' },
      description: 'Abre o meio e mostra o total.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    centerLabel: {
      control: { type: 'text' },
      description: 'Texto abaixo do total, no meio do donut.',
      table: { type: { summary: 'ReactNode' }, defaultValue: { summary: 'Total' } },
    },
    height: {
      control: { type: 'number', min: 160, max: 480, step: 20 },
      description: 'Altura em px.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '280' } },
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Mostra o skeleton no lugar do gráfico, com aria-busy.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    legend: {
      control: { type: 'boolean' },
      description: 'Legenda em botões, que mostram e escondem cada fatia pelo teclado.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    emptyMessage: {
      control: { type: 'text' },
      description: 'Mensagem do estado vazio.',
      table: { type: { summary: 'ReactNode' } },
    },
    data: { control: false, table: { type: { summary: 'PieDatum[]' } } },
    valueFormatter: { control: false, table: { type: { summary: '(value: number) => string' } } },
  },
  parameters: {
    docs: {
      description: {
        component: [
          'Pizza e donut sobre o ECharts, para a composição de um total. Acima de seis fatias a',
          'paleta recomeça: junte as menores em "Outros", que usa a cor neutra (`chart-6`).',
          '',
          'Cores, fonte, espaçamentos e raio vêm dos tokens e acompanham o tema: troque para',
          '**Claro** na barra de ferramentas.',
          '',
          '**Teclado:** Tab chega ao gráfico e as setas percorrem as fatias, que crescem em foco,',
          'com o tooltip acompanhando e o leitor de tela anunciando valor e porcentagem. A legenda',
          'é de botões: Espaço esconde ou mostra a fatia, e o total do donut acompanha.',
        ].join('\n'),
      },
    },
  },
} satisfies Meta<typeof PieChart>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  parameters: { docs: { description: { story: 'Use os controles para trocar as opções.' } } },
}

export const Variantes: Story = {
  parameters: { docs: { description: { story: 'Pizza e donut, lado a lado.' } } },
  decorators: [
    (Story) => (
      <div className="w-[960px] max-w-full">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <div className="grid grid-cols-2 gap-6">
      <PieChart {...args} />
      <PieChart {...args} donut centerLabel="em USD" />
    </div>
  ),
}

export const Estados: Story = {
  parameters: {
    docs: { description: { story: 'Skeleton enquanto carrega e o estado vazio, sem dados.' } },
  },
  render: (args) => (
    <div className="flex flex-col gap-6">
      <PieChart {...args} loading />
      <PieChart {...args} data={[]} emptyMessage="Carteira vazia." />
    </div>
  ),
}
