import { act, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const chart = vi.hoisted(() => ({
  setOption: vi.fn(),
  dispatchAction: vi.fn(),
  resize: vi.fn(),
  dispose: vi.fn(),
}))
vi.mock('echarts/core', () => ({ init: vi.fn(() => chart), use: vi.fn() }))
vi.mock('echarts/charts', () => ({ BarChart: {}, LineChart: {}, PieChart: {} }))
vi.mock('echarts/components', () => ({ GridComponent: {}, TooltipComponent: {} }))
vi.mock('echarts/renderers', () => ({ SVGRenderer: {} }))

const { AreaChart, BarChart, LineChart, PieChart } = await import('../src/index.js')

type Option = { series: { name: string; data: unknown[]; stack?: string }[] }
const lastOption = () => chart.setOption.mock.calls.at(-1)?.[0] as Option

const data = [
  { month: 'Jan', deposits: 120, withdrawals: 80 },
  { month: 'Fev', deposits: 132, withdrawals: 95 },
  { month: 'Mar', deposits: 101, withdrawals: null },
]
const series = [
  { key: 'deposits', label: 'Depósitos' },
  { key: 'withdrawals', label: 'Saques' },
]

beforeEach(() => {
  vi.clearAllMocks()
  document.documentElement.removeAttribute('data-theme')
})

describe('LineChart, AreaChart e BarChart', () => {
  it('desenha uma série por item, com o nome acessível e a tabela de dados', () => {
    render(<LineChart title="Volume mensal" data={data} categoryKey="month" series={series} />)

    expect(screen.getByRole('group', { name: 'Volume mensal' })).toBeTruthy()
    expect(lastOption().series.map((item) => item.name)).toEqual(['Depósitos', 'Saques'])
    expect(lastOption().series[1]?.data).toEqual([80, 95, null])

    const table = screen.getByRole('table', { name: 'Volume mensal' })
    expect(table.textContent).toContain('Saques')
    expect(table.textContent).toContain('sem valor')
  })

  it('a legenda esconde e mostra a série pelo teclado', async () => {
    render(<BarChart title="Volume" data={data} categoryKey="month" series={series} />)
    const user = userEvent.setup()
    const saques = screen.getByRole('button', { name: 'Saques' })
    expect(saques.getAttribute('aria-pressed')).toBe('true')

    saques.focus()
    await user.keyboard(' ')
    expect(saques.getAttribute('aria-pressed')).toBe('false')
    expect(lastOption().series.map((item) => item.name)).toEqual(['Depósitos'])

    await user.keyboard(' ')
    expect(lastOption().series).toHaveLength(2)
  })

  it('as setas percorrem as categorias, mostram o tooltip e anunciam os valores', async () => {
    render(
      <LineChart
        title="Volume"
        data={data}
        categoryKey="month"
        series={series}
        valueFormatter={(value) => `${value} mil`}
      />
    )
    const user = userEvent.setup()
    const live = () => document.querySelector('[aria-live="polite"]')?.textContent

    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('group', { name: 'Volume' }))

    await user.keyboard('{ArrowRight}')
    expect(live()).toBe('Jan: Depósitos 120 mil; Saques 80 mil')
    expect(chart.dispatchAction).toHaveBeenCalledWith({
      type: 'showTip',
      seriesIndex: 0,
      dataIndex: 0,
    })

    await user.keyboard('{End}')
    expect(live()).toBe('Mar: Depósitos 101 mil; Saques sem valor')

    await user.keyboard('{ArrowRight}')
    expect(live()).toMatch(/^Jan:/)

    await user.keyboard('{Escape}')
    expect(live()).toBe('')
    expect(chart.dispatchAction).toHaveBeenLastCalledWith({ type: 'hideTip' })
  })

  it('empilha o AreaChart com stacked', () => {
    render(<AreaChart title="Volume" data={data} categoryKey="month" series={series} stacked />)
    expect(lastOption().series.every((item) => item.stack === 'total')).toBe(true)
  })

  it('mostra o skeleton com aria-busy enquanto carrega, sem montar o gráfico', () => {
    const { container } = render(
      <LineChart title="Volume" data={data} categoryKey="month" series={series} loading />
    )
    expect(container.firstElementChild?.getAttribute('aria-busy')).toBe('true')
    expect(screen.queryByRole('group')).toBeNull()
    expect(screen.getByText('Carregando Volume…')).toBeTruthy()
    expect(chart.setOption).not.toHaveBeenCalled()
  })

  it('mostra o estado vazio sem dados ou só com valores ausentes', () => {
    const { rerender } = render(
      <LineChart title="Volume" data={[]} categoryKey="month" series={series} />
    )
    expect(screen.getByText('Nenhum dado para exibir.')).toBeTruthy()
    expect(screen.queryByRole('group')).toBeNull()

    rerender(
      <LineChart
        title="Volume"
        data={[{ month: 'Jan', deposits: null }]}
        categoryKey="month"
        series={series}
        emptyMessage="Sem movimentação."
      />
    )
    expect(screen.getByText('Sem movimentação.')).toBeTruthy()
  })

  it('relê os tokens e redesenha quando o tema muda', async () => {
    render(<LineChart title="Volume" data={data} categoryKey="month" series={series} />)
    const calls = chart.setOption.mock.calls.length

    await act(async () => {
      document.documentElement.dataset.theme = 'light'
      await Promise.resolve()
    })
    expect(chart.setOption.mock.calls.length).toBeGreaterThan(calls)
  })
})

describe('PieChart', () => {
  const slices = [
    { label: 'USDT', value: 60 },
    { label: 'ETH', value: 30 },
    { label: 'POL', value: 10 },
  ]

  it('anuncia valor e porcentagem e destaca a fatia em foco', async () => {
    render(<PieChart title="Carteira" data={slices} />)
    const user = userEvent.setup()
    await user.tab()
    await user.keyboard('{ArrowRight}')

    expect(document.querySelector('[aria-live="polite"]')?.textContent).toBe('USDT: 60 (60%)')
    expect(chart.dispatchAction).toHaveBeenCalledWith({
      type: 'highlight',
      seriesIndex: 0,
      dataIndex: 0,
    })

    await user.keyboard('{ArrowRight}')
    expect(chart.dispatchAction).toHaveBeenCalledWith({
      type: 'downplay',
      seriesIndex: 0,
      dataIndex: 0,
    })
  })

  it('no donut, o total do meio acompanha a legenda', async () => {
    render(<PieChart title="Carteira" data={slices} donut centerLabel="ativos" />)
    expect(screen.getByText('100')).toBeTruthy()
    expect(screen.getByText('ativos')).toBeTruthy()

    await userEvent.setup().click(screen.getByRole('button', { name: 'ETH' }))
    expect(screen.getByText('70')).toBeTruthy()
    expect(screen.getByRole('table', { name: 'Carteira' }).textContent).not.toContain('ETH')
  })
})
