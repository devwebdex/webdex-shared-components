import type { ChartDatum, ChartSeries, PieDatum } from '@devwebdex/ui'

export const monthly: ChartDatum[] = [
  { month: 'Jan', deposits: 120, withdrawals: 80, fees: 12 },
  { month: 'Fev', deposits: 132, withdrawals: 95, fees: 14 },
  { month: 'Mar', deposits: 101, withdrawals: 70, fees: 11 },
  { month: 'Abr', deposits: 154, withdrawals: 110, fees: 17 },
  { month: 'Mai', deposits: 190, withdrawals: 120, fees: 21 },
  { month: 'Jun', deposits: 230, withdrawals: 140, fees: 26 },
  { month: 'Jul', deposits: 210, withdrawals: 160, fees: 24 },
  { month: 'Ago', deposits: 250, withdrawals: 170, fees: 29 },
]

export const monthlySeries: ChartSeries[] = [
  { key: 'deposits', label: 'Depósitos' },
  { key: 'withdrawals', label: 'Saques' },
  { key: 'fees', label: 'Taxas' },
]

export const byNetwork: ChartDatum[] = [
  { network: 'Polygon', volume: 412 },
  { network: 'Ethereum', volume: 318 },
  { network: 'BNB Smart Chain', volume: 205 },
  { network: 'Arbitrum One', volume: 164 },
  { network: 'Base', volume: 97 },
]

export const allocation: PieDatum[] = [
  { label: 'USDT', value: 4200 },
  { label: 'ETH', value: 2600 },
  { label: 'POL', value: 1500 },
  { label: 'BNB', value: 900 },
  { label: 'ARB', value: 450 },
  { label: 'Outros', value: 350 },
]

export const usd = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
}).format

export const thousands = (value: number) => `${value} mil`
