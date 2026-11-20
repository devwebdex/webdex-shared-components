'use client'

import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { type EChartsCoreOption, type EChartsType, init, use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import {
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useId,
  useState,
} from 'react'
import { cn } from '../../lib/cn.js'
import { ChartEmpty, type ChartShape, ChartSkeleton } from './chart-placeholder.js'
import { type ChartColor, chartSwatchClasses } from './theme.js'

use([LineChart, BarChart, PieChart, GridComponent, TooltipComponent, SVGRenderer])

export type LegendItem = {
  key: string
  label: string
  color: ChartColor
  hidden: boolean
}

export const chartFrameClasses = {
  root: 'relative flex w-full flex-col gap-3 font-sans',
  canvas: [
    'relative w-full rounded-2 outline-none',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
  ].join(' '),
  legend: 'flex flex-wrap items-center gap-x-4 gap-y-2',
  legendButton: [
    'inline-flex cursor-pointer items-center gap-2 rounded-1 px-1 text-3xs leading-4xs text-text-secondary',
    'outline-none transition-colors hover:text-text-primary motion-reduce:transition-none',
    'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand',
    'aria-[pressed=false]:text-text-disabled',
  ].join(' '),
  swatch: 'size-3 shrink-0 rounded-full in-aria-[pressed=false]:opacity-chart-area',
  srOnly: 'sr-only',
} as const

export type ChartFrameProps = {
  rootRef: RefObject<HTMLDivElement | null>
  title: string
  description?: ReactNode | undefined
  height: number
  shape: ChartShape
  legendItems: number
  loading: boolean
  empty: boolean
  emptyMessage: ReactNode
  option: EChartsCoreOption | null
  legend: LegendItem[] | null
  onToggleLegend: (key: string) => void
  points: number
  describePoint: (index: number) => string
  tipTarget: (index: number) => { seriesIndex: number; dataIndex: number }
  highlight?: boolean
  table: { columns: string[]; rows: string[][] }
  overlay?: ReactNode
  className?: string | undefined
}

export function ChartFrame({
  rootRef,
  title,
  description,
  height,
  shape,
  legendItems,
  loading,
  empty,
  emptyMessage,
  option,
  legend,
  onToggleLegend,
  points,
  describePoint,
  tipTarget,
  highlight = false,
  table,
  overlay,
  className,
}: ChartFrameProps) {
  const id = useId()
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const [chart, setChart] = useState<EChartsType | null>(null)
  const [active, setActive] = useState<number | null>(null)

  useEffect(() => {
    if (!container) return
    const instance = init(container, undefined, { renderer: 'svg' })
    setChart(instance)
    const observer = new ResizeObserver(() => instance.resize())
    observer.observe(container)
    return () => {
      observer.disconnect()
      instance.dispose()
      setChart(null)
    }
  }, [container])

  useEffect(() => {
    if (chart && option) chart.setOption(option, { notMerge: true })
  }, [chart, option])

  useEffect(() => {
    setActive((current) => (current !== null && current >= points ? null : current))
  }, [points])

  function focusPoint(next: number | null) {
    if (chart && highlight && active !== null) {
      chart.dispatchAction({ type: 'downplay', ...tipTarget(active) })
    }
    setActive(next)
    if (!chart) return
    if (next === null) {
      chart.dispatchAction({ type: 'hideTip' })
      return
    }
    chart.dispatchAction({ type: 'showTip', ...tipTarget(next) })
    if (highlight) chart.dispatchAction({ type: 'highlight', ...tipTarget(next) })
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (points === 0) return
    const last = points - 1
    const current = active ?? -1
    const keys: Record<string, number | null> = {
      ArrowRight: current >= last ? 0 : current + 1,
      ArrowDown: current >= last ? 0 : current + 1,
      ArrowLeft: current <= 0 ? last : current - 1,
      ArrowUp: current <= 0 ? last : current - 1,
      Home: 0,
      End: last,
      Escape: null,
    }
    if (!(event.key in keys)) return
    event.preventDefault()
    focusPoint(keys[event.key] ?? null)
  }

  const hintId = `${id}-hint`
  const liveId = `${id}-live`

  return (
    <div
      ref={rootRef}
      className={cn(chartFrameClasses.root, className)}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <>
          <ChartSkeleton shape={shape} height={height} legendItems={legendItems} />
          <p className={chartFrameClasses.srOnly}>Carregando {title}…</p>
        </>
      ) : empty ? (
        <>
          <ChartEmpty shape={shape} height={height}>
            {emptyMessage}
          </ChartEmpty>
          <p className={chartFrameClasses.srOnly}>{title}</p>
        </>
      ) : (
        <>
          {/* biome-ignore lint/a11y/useSemanticElements: <fieldset> é de formulário; aqui é um grupo de dados. */}
          <div
            // biome-ignore lint/a11y/noNoninteractiveTabindex: é o ponto de entrada do teclado no gráfico.
            tabIndex={0}
            role="group"
            aria-roledescription="gráfico"
            aria-label={title}
            aria-describedby={hintId}
            className={chartFrameClasses.canvas}
            style={{ height }}
            onKeyDown={handleKeyDown}
            onBlur={() => focusPoint(null)}
          >
            <div ref={setContainer} className="size-full" aria-hidden="true" />
            {overlay}
          </div>
          <p id={hintId} className={chartFrameClasses.srOnly}>
            {description ? <>{description} </> : null}
            Use as setas para percorrer os valores.
          </p>
          <p id={liveId} className={chartFrameClasses.srOnly} aria-live="polite">
            {active === null ? '' : describePoint(active)}
          </p>

          {legend && legend.length > 0 && (
            <ul className={chartFrameClasses.legend} aria-label={`Séries de ${title}`}>
              {legend.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    aria-pressed={!item.hidden}
                    className={chartFrameClasses.legendButton}
                    onClick={() => onToggleLegend(item.key)}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(chartFrameClasses.swatch, chartSwatchClasses[item.color])}
                    />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <table className={chartFrameClasses.srOnly}>
            <caption>{title}</caption>
            <thead>
              <tr>
                {table.columns.map((column) => (
                  <th key={column} scope="col">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, index) =>
                    index === 0 ? (
                      <th key={table.columns[index]} scope="row">
                        {cell}
                      </th>
                    ) : (
                      <td key={table.columns[index]}>{cell}</td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}

export const defaultValueFormatter = new Intl.NumberFormat('pt-BR').format
