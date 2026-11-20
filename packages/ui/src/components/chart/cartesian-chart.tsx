'use client'

import type { EChartsCoreOption } from 'echarts/core'
import { type ReactNode, useMemo, useRef, useState } from 'react'
import { ChartFrame, defaultValueFormatter, type LegendItem } from './chart-frame.js'
import { type ChartColor, type ChartTheme, useChartTheme } from './theme.js'

export type ChartDatum = Record<string, string | number | null | undefined>

export type ChartSeries = {
  key: string
  label: string
  color?: ChartColor | undefined
}

type CartesianProps = {
  title: string
  description?: ReactNode | undefined
  data: ChartDatum[]
  categoryKey: string
  series: ChartSeries[]
  height?: number | undefined
  loading?: boolean | undefined
  emptyMessage?: ReactNode | undefined
  legend?: boolean | undefined
  valueFormatter?: ((value: number) => string) | undefined
  className?: string | undefined
}

export type LineChartProps = CartesianProps & {
  smooth?: boolean | undefined
}

export type AreaChartProps = CartesianProps & {
  smooth?: boolean | undefined
  stacked?: boolean | undefined
}

export type BarChartProps = CartesianProps & {
  stacked?: boolean | undefined
  orientation?: 'vertical' | 'horizontal' | undefined
}

type Kind = 'line' | 'area' | 'bar'

type Options = {
  smooth?: boolean | undefined
  stacked?: boolean | undefined
  orientation?: 'vertical' | 'horizontal' | undefined
}

export function LineChart(props: LineChartProps) {
  return <CartesianChart kind="line" {...props} />
}

export function AreaChart(props: AreaChartProps) {
  return <CartesianChart kind="area" {...props} />
}

export function BarChart(props: BarChartProps) {
  return <CartesianChart kind="bar" {...props} />
}

function CartesianChart({
  kind,
  smooth,
  stacked,
  orientation,
  title,
  description,
  data,
  categoryKey,
  series,
  height = 280,
  loading = false,
  emptyMessage = 'Nenhum dado para exibir.',
  legend,
  valueFormatter = defaultValueFormatter,
  className,
}: CartesianProps & Options & { kind: Kind }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const theme = useChartTheme(rootRef)
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set())

  const colored = useMemo(
    () =>
      series.map((item, index) => ({
        ...item,
        color: item.color ?? (((index % 6) + 1) as ChartColor),
      })),
    [series]
  )
  const visible = useMemo(() => colored.filter((item) => !hidden.has(item.key)), [colored, hidden])
  const categories = useMemo(
    () => data.map((row) => String(row[categoryKey] ?? '')),
    [data, categoryKey]
  )
  const empty =
    data.length === 0 || data.every((row) => series.every((item) => !isNumber(row[item.key])))

  const option = useMemo(
    () =>
      theme
        ? buildOption({
            kind,
            options: { smooth, stacked, orientation },
            theme,
            data,
            categories,
            visible,
            valueFormatter,
          })
        : null,
    [theme, kind, smooth, stacked, orientation, data, categories, visible, valueFormatter]
  )

  const format = (value: unknown) => (isNumber(value) ? valueFormatter(value) : 'sem valor')

  return (
    <ChartFrame
      rootRef={rootRef}
      title={title}
      description={description}
      height={height}
      shape={kind === 'bar' ? 'bar' : 'line'}
      legendItems={(legend ?? series.length > 1) ? series.length : 0}
      loading={loading}
      empty={empty}
      emptyMessage={emptyMessage}
      option={option}
      legend={
        (legend ?? series.length > 1)
          ? colored.map(
              (item): LegendItem => ({
                key: item.key,
                label: item.label,
                color: item.color,
                hidden: hidden.has(item.key),
              })
            )
          : null
      }
      onToggleLegend={(key) =>
        setHidden((current) => {
          const next = new Set(current)
          if (!next.delete(key)) next.add(key)
          return next
        })
      }
      points={categories.length}
      describePoint={(index) =>
        `${categories[index]}: ${visible
          .map((item) => `${item.label} ${format(data[index]?.[item.key])}`)
          .join('; ')}`
      }
      tipTarget={(index) => ({ seriesIndex: 0, dataIndex: index })}
      table={{
        columns: ['Categoria', ...colored.map((item) => item.label)],
        rows: data.map((row, index) => [
          categories[index] ?? '',
          ...colored.map((item) => format(row[item.key])),
        ]),
      }}
      className={className}
    />
  )
}

function buildOption({
  kind,
  options,
  theme,
  data,
  categories,
  visible,
  valueFormatter,
}: {
  kind: Kind
  options: Options
  theme: ChartTheme
  data: ChartDatum[]
  categories: string[]
  visible: (ChartSeries & { color: ChartColor })[]
  valueFormatter: (value: number) => string
}): EChartsCoreOption {
  const [space1, space2, space3, space4] = theme.space
  const horizontal = kind === 'bar' && options.orientation === 'horizontal'
  const label = { color: theme.textSecondary, fontFamily: theme.font, fontSize: theme.fontSmall }

  const categoryAxis = {
    type: 'category',
    data: categories,
    boundaryGap: kind === 'bar',
    axisLine: { lineStyle: { color: theme.lineStrong } },
    axisTick: { show: false },
    axisLabel: { ...label, margin: space3 },
  }
  const valueAxis = {
    type: 'value',
    splitLine: { lineStyle: { color: theme.line } },
    axisLabel: { ...label, margin: space3, formatter: valueFormatter },
  }

  return {
    animation: theme.animate,
    textStyle: { fontFamily: theme.font },
    grid: { left: space2, right: space4, top: space4, bottom: space2, containLabel: true },
    xAxis: horizontal ? valueAxis : categoryAxis,
    yAxis: horizontal ? { ...categoryAxis, inverse: true } : valueAxis,
    tooltip: tooltip(theme, kind === 'bar' ? 'shadow' : 'line', valueFormatter),
    series: visible.map((item) => {
      const color = theme.series[item.color - 1]
      const values = data.map((row) => (isNumber(row[item.key]) ? row[item.key] : null))
      if (kind === 'bar') {
        return {
          type: 'bar',
          name: item.label,
          data: values,
          color,
          stack: options.stacked ? 'total' : undefined,
          barMaxWidth: space5(theme),
          barGap: `${(space1 / space5(theme)) * 100}%`,
          itemStyle: {
            borderRadius: horizontal ? [0, space1, space1, 0] : [space1, space1, 0, 0],
          },
          emphasis: { focus: 'series' },
        }
      }
      return {
        type: 'line',
        name: item.label,
        data: values,
        color,
        smooth: Boolean(options.smooth),
        stack: kind === 'area' && options.stacked ? 'total' : undefined,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: data.length <= 12,
        connectNulls: false,
        lineStyle: { width: 2 },
        areaStyle: kind === 'area' ? { color, opacity: theme.areaOpacity } : undefined,
        emphasis: { focus: 'series' },
      }
    }),
  }
}

function space5(theme: ChartTheme) {
  return theme.space[4]
}

export function tooltip(
  theme: ChartTheme,
  pointer: 'line' | 'shadow' | 'none',
  valueFormatter: (value: number) => string
) {
  const [, space2, space3] = theme.space
  return {
    trigger: pointer === 'none' ? 'item' : 'axis',
    confine: true,
    axisPointer: {
      type: pointer,
      lineStyle: { color: theme.lineStrong },
      shadowStyle: { color: theme.line },
    },
    backgroundColor: theme.surface,
    borderColor: theme.lineStrong,
    borderWidth: 1,
    padding: [space2, space3],
    textStyle: { color: theme.text, fontFamily: theme.font, fontSize: theme.fontBase },
    extraCssText: `border-radius:${theme.radius}px;box-shadow:none;backdrop-filter:blur(${space2}px);`,
    valueFormatter: (value: unknown) => (isNumber(value) ? valueFormatter(value) : '—'),
  }
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}
