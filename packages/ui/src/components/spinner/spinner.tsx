import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '../../lib/cn.js'

/**
 * Spinner do design system WEbdEX, em três desenhos:
 *
 * - `pixel` (padrão): o losango pixelado que se monta do centro para fora, do bloco "Spinner de
 *   compilação e loading" (`docs/ui/webdex-design-system.html`). É a assinatura de loading da
 *   marca. Grade 5x5, células de 12px e espaço de 3px (viewBox 72); três anéis, cada um com a sua
 *   cor e o seu atraso: o centro em brand-deep, o anel do meio em brand e o externo em coral.
 * - `ring`: o círculo clássico, com trilho e arco girando, para quando o losango chamaria atenção
 *   demais (ex.: dentro de uma tabela).
 * - `dots`: três pontos acendendo em sequência, para indicar espera ao lado de um texto.
 *
 * `pixel` e `dots` usam o `animate-pixel-cell` dos tokens; `ring`, o `animate-spin` do Tailwind.
 * Com movimento reduzido, tudo fica parado.
 *
 * VALORES SEM TOKEN: os tamanhos medium (72px) e large (106px), os dois do design system; as
 * medidas internas de cada desenho, em unidades do viewBox.
 */

export type SpinnerVariant = 'pixel' | 'ring' | 'dots'
export type SpinnerTone = 'brand' | 'current'

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

// Fora da animação (tokens antigos ou movimento reduzido), a célula fica em 90%: o desenho
// aparece parado em vez de sumir.
const cellClass = 'opacity-90 animate-pixel-cell motion-reduce:animate-none'

export type SpinnerGlyphProps = {
  variant?: SpinnerVariant
  /** `brand`: as cores da marca. `current`: a cor do texto, para ficar sobre o gradiente do Button. */
  tone?: SpinnerTone
  className?: string
}

/** O desenho sozinho, sem papel para leitor de tela. Usado pelo Spinner e pelo Button `loading`. */
export function SpinnerGlyph({ variant = 'pixel', tone = 'brand', className }: SpinnerGlyphProps) {
  const current = tone === 'current'
  if (variant === 'ring') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth={2.5}
        aria-hidden="true"
        focusable="false"
        className={cn('animate-spin motion-reduce:animate-none', className)}
      >
        <circle
          cx={12}
          cy={12}
          r={10}
          className={current ? 'stroke-current opacity-25' : 'stroke-line-default'}
        />
        {/* Um quarto da volta (2πr ≈ 62,8): o arco que gira. */}
        <circle
          cx={12}
          cy={12}
          r={10}
          strokeLinecap="round"
          strokeDasharray="16 47"
          className={current ? 'stroke-current' : 'stroke-brand'}
        />
      </svg>
    )
  }
  if (variant === 'dots') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className}>
        {([0, 1, 2] as const).map((dot) => (
          <circle
            key={dot}
            cx={4 + dot * 8}
            cy={12}
            r={3}
            className={cn(cellClass, RING_DELAY[dot], current ? 'fill-current' : 'fill-brand')}
          />
        ))}
      </svg>
    )
  }
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
          className={cn(cellClass, RING_DELAY[ring], current ? 'fill-current' : RING_FILL[ring])}
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
    /** `pixel`: o losango da marca. `ring`: círculo girando. `dots`: três pontos. */
    variant?: SpinnerVariant
    tone?: SpinnerTone
    /** Texto para leitor de tela; diga o que está carregando quando der (ex.: "Compilando contrato"). */
    label?: string
  }

export function Spinner({
  size,
  variant,
  tone,
  label = 'Carregando',
  className,
  ...props
}: SpinnerProps) {
  return (
    <span role="status" className={cn(spinnerVariants({ size }), className)} {...props}>
      <SpinnerGlyph className="size-full" {...(variant && { variant })} {...(tone && { tone })} />
      <span className="sr-only">{label}</span>
    </span>
  )
}

export { spinnerVariants }
