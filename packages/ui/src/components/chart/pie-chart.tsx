'use client'

import type { EChartsCoreOption } from 'echarts/core'
import { type ReactNode, useMemo, useRef, useState } from 'react'
import { isNumber, tooltip } from './cartesian-chart.js'
import { ChartFrame, defaultValueFormatter } from './chart-frame.js'
import { type ChartColor, type ChartTheme, useChartTheme } from './theme.js'

export type PieDatum = {
  label: string
  value: number
  color?: ChartColor | undefined
}

export type PieChartProps = {
  title: string
  description?: ReactNode | undefined
  data: PieDatum[]
  donut?: boolean | undefined
  centerLabel?: ReactNode | undefined
  height?: number | undefined
  loading?: boolean | undefined
  emptyMessage?: ReactNode | undefined
  legend?: boolean | undefined
  valueFormatter?: ((value: number) => string) | undefined
  className?: string | undefined
}

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  maximumFractionDigits: 1,
})

export function PieChart({
  title,
  description,
  data,
  donut = false,
  centerLabel = 'Total',
  height = 280,
  loading = false,
  emptyMessage = 'Nenhum dado para exibir.',
  legend = true,
  valueFormatter = defaultValueFormatter,
  className,
}: PieChartProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const theme = useChartTheme(rootRef)
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set())

  const colored = useMemo(
    () =>
      data.map((item, index) => ({
        ...item,
        color: item.color ?? (((index % 6) + 1) as ChartColor),
      })),
    [data]
  )
  const visible = useMemo(
    () => colored.filter((item) => !hidden.has(item.label) && isNumber(item.value)),
    [colored, hidden]
  )
  const total = visible.reduce((sum, item) => sum + item.value, 0)
  const empty = data.every((item) => !isNumber(item.value) || item.value <= 0)
  const share = (value: number) => percentFormatter.format(total > 0 ? value / total : 0)

  const option = useMemo(
    () => (theme ? buildOption({ theme, visible, donut, valueFormatter }) : null),
    [theme, visible, donut, valueFormatter]
  )

  return (
    <ChartFrame
      rootRef={rootRef}
      title={title}
      description={description}
      height={height}
      shape={donut ? 'donut' : 'pie'}
      legendItems={legend ? data.length : 0}
      loading={loading}
      empty={empty}
      emptyMessage={emptyMessage}
      option={option}
      legend={
        legend
          ? colored.map((item) => ({
              key: item.label,
              label: item.label,
              color: item.color,
              hidden: hidden.has(item.label),
            }))
          : null
      }
      onToggleLegend={(key) =>
        setHidden((current) => {
          const next = new Set(current)
          if (!next.delete(key)) next.add(key)
          return next
        })
      }
      points={visible.length}
      describePoint={(index) => {
        const item = visible[index]
        return item ? `${item.label}: ${valueFormatter(item.value)} (${share(item.value)})` : ''
      }}
      tipTarget={(index) => ({ seriesIndex: 0, dataIndex: index })}
      highlight
      table={{
        columns: ['Categoria', 'Valor', 'Participação'],
        rows: visible.map((item) => [item.label, valueFormatter(item.value), share(item.value)]),
      }}
      overlay={
        donut && (
          <div className={pieCenterClasses.root} aria-hidden="true">
            <span className={pieCenterClasses.total}>{valueFormatter(total)}</span>
            <span className={pieCenterClasses.label}>{centerLabel}</span>
          </div>
        )
      }
      className={className}
    />
  )
}

export const pieCenterClasses = {
  root: 'pointer-events-none absolute inset-0 flex flex-col items-center justify-center',
  total: 'text-md leading-sm font-semibold text-text-primary',
  label: 'text-3xs leading-4xs text-text-secondary',
} as const

function buildOption({
  theme,
  visible,
  donut,
  valueFormatter,
}: {
  theme: ChartTheme
  visible: (PieDatum & { color: ChartColor })[]
  donut: boolean
  valueFormatter: (value: number) => string
}): EChartsCoreOption {
  const [space1, space2] = theme.space
  return {
    animation: theme.animate,
    textStyle: { fontFamily: theme.font },
    tooltip: {
      ...tooltip(theme, 'none', valueFormatter),
      formatter: (params: { marker: string; name: string; value: number; percent: number }) =>
        `${params.marker}${params.name}: <b>${valueFormatter(params.value)}</b> (${percentFormatter.format(params.percent / 100)})`,
    },
    series: [
      {
        type: 'pie',
        radius: donut ? ['58%', '86%'] : ['0%', '86%'],
        center: ['50%', '50%'],
        padAngle: donut ? 1 : 0,
        avoidLabelOverlap: true,
        label: { show: false },
        labelLine: { show: false },
        itemStyle: {
          borderColor: theme.background,
          borderWidth: donut ? 0 : space1 / 2,
          borderRadius: donut ? space1 : 0,
        },
        emphasis: { scale: true, scaleSize: space2 },
        data: visible.map((item) => ({
          name: item.label,
          value: item.value,
          itemStyle: { color: theme.series[item.color - 1] },
        })),
      },
    ],
  }
}
