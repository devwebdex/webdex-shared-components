import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '../../lib/cn.js'

/**
 * Skeleton do design system WEbdEX: a forma do conteúdo enquanto ele carrega. São três formas
 * prontas (texto, avatar e card) e o `Skeleton` base, para montar outras.
 *
 * É decorativo (`aria-hidden`): várias formas na tela virariam vários anúncios. Quem avisa o
 * leitor de tela é a região que carrega, com `aria-busy="true"` enquanto o conteúdo não chega.
 *
 * O design system ainda não tem bloco de skeleton: o visual é proposta para revisão do design.
 */

const skeletonClass = 'bg-surface-code animate-pulse motion-reduce:animate-none'

/** Forma livre: defina tamanho e raio com `className` (ex.: `h-32 w-full rounded-2`). */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return <div aria-hidden="true" className={cn(skeletonClass, className)} {...props} />
}

export type SkeletonTextProps = ComponentProps<'div'> & {
  /** Quantidade de linhas; a última fica mais curta, como o fim de um parágrafo. */
  lines?: number
}

export function SkeletonText({ lines = 3, className, ...props }: SkeletonTextProps) {
  return (
    <div aria-hidden="true" className={cn('flex w-full flex-col gap-2', className)} {...props}>
      {Array.from({ length: lines }, (_, line) => (
        <div
          // A lista é fixa: só cresce ou encolhe pelo fim.
          // biome-ignore lint/suspicious/noArrayIndexKey: ver acima.
          key={line}
          className={cn(skeletonClass, 'h-4 rounded-1', lines > 1 && line === lines - 1 && 'w-3/5')}
        />
      ))}
    </div>
  )
}

const skeletonAvatarVariants = cva([skeletonClass, 'shrink-0 rounded-full'], {
  variants: {
    size: {
      small: 'size-6',
      medium: 'size-7',
      large: 'size-8',
    },
  },
  defaultVariants: { size: 'medium' },
})

export type SkeletonAvatarProps = ComponentProps<'div'> &
  VariantProps<typeof skeletonAvatarVariants>

/** Avatar redondo: small 32px, medium 48px e large 64px (spacing 6, 7 e 8). */
export function SkeletonAvatar({ size, className, ...props }: SkeletonAvatarProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(skeletonAvatarVariants({ size }), className)}
      {...props}
    />
  )
}

/** Card com imagem, autor e duas linhas de texto. */
export function SkeletonCard({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex w-full flex-col gap-4 rounded-3 p-4 bg-surface-card inset-ring-1 inset-ring-line-default',
        className
      )}
      {...props}
    >
      <div className={cn(skeletonClass, 'aspect-video w-full rounded-2')} />
      <div className="flex items-center gap-3">
        <div className={skeletonAvatarVariants({ size: 'small' })} />
        <SkeletonText lines={2} />
      </div>
    </div>
  )
}

export { skeletonAvatarVariants }
