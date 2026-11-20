'use client'

import { type RefObject, useEffect, useState } from 'react'

export type ChartColor = 1 | 2 | 3 | 4 | 5 | 6

export const chartSwatchClasses: Record<ChartColor, string> = {
  1: 'bg-chart-1',
  2: 'bg-chart-2',
  3: 'bg-chart-3',
  4: 'bg-chart-4',
  5: 'bg-chart-5',
  6: 'bg-chart-6',
}

export const chartTokenClasses = [
  'bg-chart-1 bg-chart-2 bg-chart-3 bg-chart-4 bg-chart-5 bg-chart-6',
  'bg-background bg-surface-card text-text-primary text-text-secondary',
  'border-line-default border-line-enabled opacity-chart-area',
  'font-sans text-3xs text-2xs rounded-2 p-1 p-2 p-3 p-4 p-5',
].join(' ')

export type ChartTheme = {
  series: string[]
  background: string
  surface: string
  text: string
  textSecondary: string
  line: string
  lineStrong: string
  font: string
  fontSmall: number
  fontBase: number
  space: [number, number, number, number, number]
  radius: number
  areaOpacity: number
  animate: boolean
}

function readTheme(element: Element): ChartTheme {
  const style = getComputedStyle(element)
  const read = (name: string) => style.getPropertyValue(name).trim()
  const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  const px = (name: string) => {
    const value = read(name)
    const number = Number.parseFloat(value)
    if (Number.isNaN(number)) return 0
    return value.endsWith('rem') ? number * rootFontSize : number
  }
  const percent = (name: string) => {
    const number = Number.parseFloat(read(name))
    return Number.isNaN(number) ? 0 : number / 100
  }

  return {
    series: [1, 2, 3, 4, 5, 6].map((index) => read(`--color-chart-${index}`)),
    background: read('--color-background'),
    surface: read('--color-surface-card'),
    text: read('--color-text-primary'),
    textSecondary: read('--color-text-secondary'),
    line: read('--color-line-default'),
    lineStrong: read('--color-line-enabled'),
    font: read('--font-sans'),
    fontSmall: px('--text-3xs'),
    fontBase: px('--text-2xs'),
    space: [
      px('--spacing-1'),
      px('--spacing-2'),
      px('--spacing-3'),
      px('--spacing-4'),
      px('--spacing-5'),
    ],
    radius: px('--radius-2'),
    areaOpacity: percent('--opacity-chart-area'),
    animate: !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  }
}

export function useChartTheme(ref: RefObject<HTMLElement | null>) {
  const [theme, setTheme] = useState<ChartTheme | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const update = () => setTheme(readTheme(element))
    update()

    const observer = new MutationObserver(update)
    for (let node = element.parentElement; node; node = node.parentElement) {
      observer.observe(node, { attributes: true, attributeFilter: ['data-theme', 'class'] })
    }
    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    motion?.addEventListener('change', update)
    return () => {
      observer.disconnect()
      motion?.removeEventListener('change', update)
    }
  }, [ref])

  return theme
}
