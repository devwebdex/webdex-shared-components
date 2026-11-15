'use client'

import { useRef } from 'react'
import type { DataTableResizerProps } from './types.js'

/**
 * Alça de redimensionar a coluna, na borda direita do cabeçalho (o `th` é `relative`).
 *
 * É um separador focável (padrão ARIA "window splitter"): `aria-valuenow` é a largura em px, e as
 * setas ←/→ mudam 16px (com Shift, 64px), para quem não usa mouse. O arraste usa Pointer Events
 * com captura: o ponteiro continua sendo da alça mesmo saindo dela, e a largura é a inicial mais
 * a distância percorrida desde o início, o que não acumula erro de arredondamento.
 *
 * A área de toque tem 8px (`w-2`), a linha visível tem 2px e só aparece no hover, no foco e
 * durante o arraste (brand), para não poluir o cabeçalho. O clique não sobe até o `th`: sem
 * isso, soltar a alça ordenaria a coluna.
 *
 * VALOR SEM TOKEN: a linha de 2px (`w-0.5`), menor que o menor espaçamento, como a barra do hover
 * da linha.
 */

const step = 16
const largeStep = 64

export function DataTableResizer({
  columnLabel,
  width,
  minWidth,
  onResize,
}: DataTableResizerProps) {
  const drag = useRef<{ startX: number; startWidth: number } | null>(null)

  return (
    // biome-ignore lint/a11y/useSemanticElements: o <hr> não tem filhos nem recebe arraste; o separador focável do ARIA precisa do role.
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={`Largura da coluna ${columnLabel}`}
      aria-valuenow={width}
      aria-valuemin={minWidth}
      tabIndex={0}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
        event.preventDefault()
        const delta = event.shiftKey ? largeStep : step
        onResize(Math.max(minWidth, width + (event.key === 'ArrowRight' ? delta : -delta)))
      }}
      onPointerDown={(event) => {
        if (event.button !== 0) return
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        drag.current = { startX: event.clientX, startWidth: width }
      }}
      onPointerMove={(event) => {
        if (drag.current === null) return
        const { startX, startWidth } = drag.current
        onResize(Math.max(minWidth, startWidth + event.clientX - startX))
      }}
      onPointerUp={(event) => {
        drag.current = null
        event.currentTarget.releasePointerCapture(event.pointerId)
      }}
      onPointerCancel={() => {
        drag.current = null
      }}
      className={[
        'group absolute inset-y-0 right-0 z-10 flex w-2 cursor-col-resize touch-none justify-end',
        'outline-none',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={[
          'h-full w-0.5 bg-transparent transition-colors duration-100 motion-reduce:transition-none',
          'group-hover:bg-brand group-focus-visible:bg-brand group-active:bg-brand',
        ].join(' ')}
      />
    </div>
  )
}
