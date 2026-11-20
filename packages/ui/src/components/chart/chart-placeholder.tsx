import type { ReactNode } from 'react'
import { Skeleton } from '../skeleton/skeleton.js'

export type ChartShape = 'line' | 'bar' | 'pie' | 'donut'

const LEVELS = [45, 70, 55, 85, 65, 92, 60, 78]

export const chartPlaceholderClasses = {
  root: 'flex w-full flex-col gap-3',
  plot: 'relative w-full',
  grid: 'absolute inset-x-0 top-4 bottom-0 flex flex-col justify-between',
  gridLine: 'border-t border-line-default',
  baseline: 'border-t border-line-enabled',
  bars: 'absolute inset-x-5 top-4 bottom-0 flex items-end gap-3',
  bar: 'flex-1 rounded-t-1',
  line: 'absolute inset-x-5 top-4 bottom-0 text-text-primary/20 animate-pulse motion-reduce:animate-none',
  lineSvg: 'size-full overflow-visible',
  center: 'absolute inset-0 flex items-center justify-center',
  disc: 'relative aspect-square h-[86%] rounded-full',
  hole: 'absolute inset-[22%] rounded-full bg-background',
  ring: 'aspect-square h-[86%] rounded-full border-2 border-dashed border-line-enabled',
  legend: 'flex flex-wrap items-center gap-x-4 gap-y-2',
  legendItem: 'flex items-center gap-2',
  legendDot: 'size-3 rounded-full',
  legendText: 'h-3 w-7 rounded-1',
  message: [
    'flex flex-col items-center gap-2 rounded-2 bg-background px-4 py-3',
    'text-2xs leading-3xs text-text-secondary',
    '[&_svg]:size-6 [&_svg]:text-text-disabled',
  ].join(' '),
} as const

const c = chartPlaceholderClasses

export function ChartSkeleton({
  shape,
  height,
  legendItems,
}: {
  shape: ChartShape
  height: number
  legendItems: number
}) {
  return (
    <div aria-hidden="true" className={c.root}>
      <div className={c.plot} style={{ height }}>
        {shape === 'pie' || shape === 'donut' ? (
          <div className={c.center}>
            <Skeleton className={c.disc}>
              {shape === 'donut' && <div className={c.hole} />}
            </Skeleton>
          </div>
        ) : (
          <>
            <Grid />
            {shape === 'bar' ? (
              <div className={c.bars}>
                {LEVELS.map((level) => (
                  <Skeleton key={level} className={c.bar} style={{ height: `${level}%` }} />
                ))}
              </div>
            ) : (
              <div className={c.line}>
                <svg
                  className={c.lineSvg}
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <polyline
                    points={LEVELS.map(
                      (level, index) => `${(index / (LEVELS.length - 1)) * 100},${100 - level}`
                    ).join(' ')}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
            )}
          </>
        )}
      </div>
      <LegendSkeleton items={legendItems} />
    </div>
  )
}

export function ChartEmpty({
  shape,
  height,
  children,
}: {
  shape: ChartShape
  height: number
  children: ReactNode
}) {
  return (
    <div className={c.plot} style={{ height }}>
      {shape === 'pie' || shape === 'donut' ? (
        <div className={c.center} aria-hidden="true">
          <div className={c.ring} />
        </div>
      ) : (
        <Grid />
      )}
      <div className={c.center}>
        <div className={c.message}>
          <EmptyIcon />
          <p>{children}</p>
        </div>
      </div>
    </div>
  )
}

function Grid() {
  return (
    <div aria-hidden="true" className={c.grid}>
      <div className={c.gridLine} />
      <div className={c.gridLine} />
      <div className={c.gridLine} />
      <div className={c.gridLine} />
      <div className={c.baseline} />
    </div>
  )
}

function LegendSkeleton({ items }: { items: number }) {
  if (items === 0) return null
  return (
    <div className={c.legend}>
      {Array.from({ length: Math.min(items, 6) }, (_, index) => index).map((item) => (
        <div key={item} className={c.legendItem}>
          <Skeleton className={c.legendDot} />
          <Skeleton className={c.legendText} />
        </div>
      ))}
    </div>
  )
}

function EmptyIcon() {
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
      <path d="M3 3v18h18" />
      <path d="m7 15 4-4 3 3 5-6" strokeDasharray="2 3" />
    </svg>
  )
}
