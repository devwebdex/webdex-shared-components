'use client'

import { type ComponentProps, useState } from 'react'
import { cn } from '../../lib/cn.js'
import { ChevronLeft, ChevronRight } from '../../lib/icons.js'
import { paginationItemClass } from './pagination-item.js'

/**
 * Pagination do design system WEbdEX: anterior, próximo e os números de página. Os estados e as
 * medidas do item estão em pagination-item.ts.
 */

/** As reticências usam o terciário do HTML (--t3), que é o mesmo valor do text-disabled. */
const ellipsisClass =
  'inline-flex h-6 min-w-6 items-center justify-center text-base text-text-disabled select-none'

type PageItem = number | 'start-ellipsis' | 'end-ellipsis'

function range(start: number, end: number) {
  return Array.from({ length: Math.max(end - start + 1, 0) }, (_, index) => start + index)
}

/**
 * As páginas que aparecem: as das pontas (`boundaryCount`), a atual com as vizinhas
 * (`siblingCount`) e reticências no lugar do resto. Quando a reticência esconderia uma página só,
 * aparece a página. Assim o total de itens não muda enquanto a página muda, e os botões não pulam
 * de lugar debaixo do mouse.
 */
function pageItems(page: number, count: number, siblingCount: number, boundaryCount: number) {
  const startPages = range(1, Math.min(boundaryCount, count))
  const endPages = range(Math.max(count - boundaryCount + 1, boundaryCount + 1), count)

  // As vizinhas andam com a página, mas sem encostar nas pontas.
  const siblingsStart = Math.max(
    Math.min(page - siblingCount, count - boundaryCount - siblingCount * 2 - 1),
    boundaryCount + 2
  )
  const siblingsEnd = Math.min(
    Math.max(page + siblingCount, boundaryCount + siblingCount * 2 + 2),
    count - boundaryCount - 1
  )

  const startGap: PageItem[] =
    siblingsStart > boundaryCount + 2
      ? ['start-ellipsis']
      : boundaryCount + 1 < count - boundaryCount
        ? [boundaryCount + 1]
        : []
  const endGap: PageItem[] =
    siblingsEnd < count - boundaryCount - 1
      ? ['end-ellipsis']
      : count - boundaryCount > boundaryCount
        ? [count - boundaryCount]
        : []

  return [...startPages, ...startGap, ...range(siblingsStart, siblingsEnd), ...endGap, ...endPages]
}

export type PaginationProps = Omit<ComponentProps<'nav'>, 'children'> & {
  /** Total de páginas. Com menos de 1, não renderiza nada. */
  count: number
  /** Página atual, começando em 1. Com ela, quem controla é quem usa o componente. */
  page?: number
  /** Página inicial quando ninguém passa `page`. */
  defaultPage?: number
  /** Recebe a página escolhida. Clicar na página atual não chama. */
  onPageChange?: (page: number) => void
  /** Quantas páginas aparecem de cada lado da atual. */
  siblingCount?: number
  /** Quantas páginas aparecem em cada ponta. */
  boundaryCount?: number
}

export function Pagination({
  count,
  page,
  defaultPage = 1,
  onPageChange,
  siblingCount = 1,
  boundaryCount = 1,
  className,
  'aria-label': ariaLabel = 'Paginação',
  ...props
}: PaginationProps) {
  const [internal, setInternal] = useState(defaultPage)
  if (count < 1) return null

  const current = Math.min(Math.max(page ?? internal, 1), count)

  function goTo(target: number) {
    if (target === current || target < 1 || target > count) return
    if (page === undefined) setInternal(target)
    onPageChange?.(target)
  }

  return (
    <nav aria-label={ariaLabel} className={cn('font-sans', className)} {...props}>
      <ul className="flex flex-wrap items-center gap-1">
        <li>
          <button
            type="button"
            aria-label="Página anterior"
            disabled={current === 1}
            onClick={() => goTo(current - 1)}
            className={paginationItemClass}
          >
            <ChevronLeft />
          </button>
        </li>
        {pageItems(current, count, siblingCount, boundaryCount).map((item) =>
          typeof item === 'number' ? (
            <li key={item}>
              <button
                type="button"
                aria-label={`Página ${item}`}
                aria-current={item === current ? 'page' : undefined}
                onClick={() => goTo(item)}
                className={paginationItemClass}
              >
                {item}
              </button>
            </li>
          ) : (
            <li key={item} aria-hidden="true" className={ellipsisClass}>
              …
            </li>
          )
        )}
        <li>
          <button
            type="button"
            aria-label="Próxima página"
            disabled={current === count}
            onClick={() => goTo(current + 1)}
            className={paginationItemClass}
          >
            <ChevronRight />
          </button>
        </li>
      </ul>
    </nav>
  )
}
