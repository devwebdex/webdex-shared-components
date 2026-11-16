import { AreaChart } from '@devwebdex/ui'
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { monthly, monthlySeries, thousands } from '../lib/chart-data.js'

const frame: Decorator[] = [
  (Story) => (
    <div className="w-[720px] max-w-full">
      <Story />
    </div>
  ),
]

const meta = {
  title: 'Componentes/Dados/AreaChart',
  component: AreaChart,
  decorators: frame,
  args: {
    title: 'Volume mensal, em milhares de USDT',
    data: monthly,
    categoryKey: 'month',
    series: monthlySeries,
    valueFormatter: thousands,
    height: 280,
    loading: false,
  },
  argTypes: {
    title: {
      control: { type: 'text' },
      description: 'Nome acessível e legenda da tabela de dados. Não aparece na tela.',
      table: { type: { summary: 'string' } },
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
      description: 'Legenda em botões, que mostram e escondem cada série pelo teclado.',
      table: { type: { summary: 'boolean' } },
    },
    emptyMessage: {
      control: { type: 'text' },
      description: 'Mensagem do estado vazio.',
      table: { type: { summary: 'ReactNode' } },
    },
    data: { control: false, table: { type: { summary: 'ChartDatum[]' } } },
    series: { control: false, table: { type: { summary: 'ChartSeries[]' } } },
    categoryKey: { control: false, table: { type: { summary: 'string' } } },
    valueFormatter: { control: false, table: { type: { summary: '(value: number) => string' } } },
    smooth: {
      control: { type: 'boolean' },
      description: 'Curva suave entre os pontos.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    stacked: {
      control: { type: 'boolean' },
      description: 'Empilha as séries.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
  },
  parameters: {
    docs: {
      description: {
        component: [
          'Gráfico de área: a linha com o volume preenchido abaixo (`opacity.chart-area`). Empilhado, mostra a composição do total.',
          '',
          'Cores, fonte, espaçamentos e raio vêm dos tokens (`color.chart-1` a `chart-6` para as',
          'séries) e acompanham o tema: troque para **Claro** na barra de ferramentas.',
          '',
          '**Teclado:** Tab chega ao gráfico e as setas percorrem os valores, com o tooltip',
          'acompanhando e o leitor de tela anunciando. Home e End vão às pontas; Esc fecha o',
          'tooltip. A legenda é de botões: Tab até ela e Espaço esconde ou mostra a série.',
        ].join('\n'),
      },
    },
  },
} satisfies Meta<typeof AreaChart>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  parameters: { docs: { description: { story: 'Use os controles para trocar as opções.' } } },
}

export const Variantes: Story = {
  parameters: {
    docs: { description: { story: 'Áreas sobrepostas e empilhadas, que somam o total.' } },
  },
  render: (args) => (
    <div className="flex flex-col gap-6">
      <AreaChart {...args} />
      <AreaChart {...args} title="Volume mensal empilhado" stacked smooth />
    </div>
  ),
}

export const Estados: Story = {
  parameters: {
    docs: { description: { story: 'Skeleton enquanto carrega e o estado vazio, sem dados.' } },
  },
  render: (args) => (
    <div className="flex flex-col gap-6">
      <AreaChart {...args} loading />
      <AreaChart {...args} data={[]} emptyMessage="Nenhuma movimentação no período." />
    </div>
  ),
}
