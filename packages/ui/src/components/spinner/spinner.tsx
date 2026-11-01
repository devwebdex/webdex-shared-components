import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '../../lib/cn.js'

/**
 * Spinner do design system WEbdEX: o losango pixelado que se monta do centro para fora, do bloco
 * "Spinner de compilação e loading" (`docs/ui/webdex-design-system.html`). É a assinatura de
 * loading da marca; a formação do símbolo completo fica para splash e telas de abertura.
 *
 * A grade é 5x5, com células de 12px e espaço de 3px (viewBox 72). Três anéis, cada um com a
 * sua cor e o seu atraso: o centro em brand-deep, o anel do meio em brand e o externo em coral.
 * A animação é o `animate-pixel-cell` dos tokens; com movimento reduzido, o losango fica parado.
 *
 * VALORES SEM TOKEN: os tamanhos medium (72px) e large (106px), os dois do design system, e o
 * raio de 2px da célula, em unidades do viewBox.
 */

type Ring = 0 | 1 | 2

// [coluna, linha, anel] de cada célula acesa; as outras 12 da grade ficam vazias.
const CELLS: ReadonlyArray<readonly [number, number, Ring]> = [
  [2, 0, 2],
  [1, 1, 2],
  [2, 1, 1],
  [3, 1, 2],
  [0, 2, 2],
  [1, 2, 1],
  [2, 2, 0],
  [3, 2, 1],
  [4, 2, 2],
  [1, 3, 2],
  [2, 3, 1],
  [3, 3, 2],
  [2, 4, 2],
]

const RING_DELAY: Record<Ring, string> = {
  0: '',
  1: '[animation-delay:0.14s]',
  2: '[animation-delay:0.28s]',
}

const RING_FILL: Record<Ring, string> = {
  0: 'fill-brand-deep',
  1: 'fill-brand',
  2: 'fill-coral-50',
}

// Sem os tokens, a célula fica parada em 90%, como no movimento reduzido: o losango aparece
// em vez de sumir.
const cellClass = 'opacity-90 animate-pixel-cell motion-reduce:animate-none'

export type SpinnerGlyphProps = {
  /** `brand`: as três cores da marca. `current`: a cor do texto, para ficar sobre o gradiente do Button. */
  tone?: 'brand' | 'current'
  className?: string
}

/** O losango sozinho, sem papel para leitor de tela. Usado pelo Spinner e pelo Button `loading`. */
export function SpinnerGlyph({ tone = 'brand', className }: SpinnerGlyphProps) {
  return (
    <svg viewBox="0 0 72 72" aria-hidden="true" focusable="false" className={className}>
      {CELLS.map(([column, row, ring]) => (
        <rect
          key={`${column}-${row}`}
          x={column * 15}
          y={row * 15}
          width={12}
          height={12}
          rx={2}
          className={cn(
            cellClass,
            RING_DELAY[ring],
            tone === 'brand' ? RING_FILL[ring] : 'fill-current'
          )}
        />
      ))}
    </svg>
  )
}

const spinnerVariants = cva('inline-flex shrink-0', {
  variants: {
    size: {
      small: 'size-5',
      medium: 'size-[72px]',
      large: 'size-[106px]',
    },
  },
  defaultVariants: { size: 'medium' },
})

export type SpinnerProps = ComponentProps<'span'> &
  VariantProps<typeof spinnerVariants> & {
    /** Texto para leitor de tela; diga o que está carregando quando der (ex.: "Compilando contrato"). */
    label?: string
  }

export function Spinner({ size, label = 'Carregando', className, ...props }: SpinnerProps) {
  return (
    <span role="status" className={cn(spinnerVariants({ size }), className)} {...props}>
      <SpinnerGlyph className="size-full" />
      <span className="sr-only">{label}</span>
    </span>
  )
}

export { spinnerVariants }
