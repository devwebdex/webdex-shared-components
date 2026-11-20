'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/cn.js'
import { paginationItemClass } from '../pagination/pagination-item.js'
import { Copy, CopyCheck } from './data-table-icons.js'
import type { DataTableCopyButtonProps } from './types.js'

/**
 * Botão de copiar ao lado de um valor longo na célula (hash, endereço). O ícone troca para o de
 * copiado, na cor success, por 1,5s; a troca de ícone não chega ao leitor de tela, então o
 * resultado vai também numa região `aria-live` só para leitor de tela, sempre no DOM (leitor de
 * tela só anuncia mudança numa região que já existia).
 *
 * A API de área de transferência falta fora de contexto seguro (http) e pode recusar por
 * permissão: nos dois casos, o anúncio diz que não deu certo, em vez de silêncio.
 *
 * O botão é o item da Pagination em 24px (`size-5`), o mesmo do filtro do cabeçalho, com o
 * ícone em 16px. O timeout é limpo ao desmontar, para não mudar estado de componente que saiu.
 */

const feedbackMs = 1500

type CopyStatus = 'idle' | 'copied' | 'failed'

export function DataTableCopyButton({ value, label, className }: DataTableCopyButtonProps) {
  const [status, setStatus] = useState<CopyStatus>('idle')
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timeout.current), [])

  const show = (next: CopyStatus) => {
    setStatus(next)
    clearTimeout(timeout.current)
    timeout.current = setTimeout(() => setStatus('idle'), feedbackMs)
  }

  const copy = async () => {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard API indisponível')
      await navigator.clipboard.writeText(value)
      show('copied')
    } catch {
      show('failed')
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={(event) => {
          // Na célula de uma linha clicável, copiar não deve também abrir a linha.
          event.stopPropagation()
          void copy()
        }}
        className={cn(
          paginationItemClass,
          'size-5 min-w-0 px-0 align-middle',
          status === 'copied' && 'text-success hover:text-success',
          className
        )}
      >
        {status === 'copied' ? <CopyCheck /> : <Copy />}
      </button>
      <span aria-live="polite" className="sr-only">
        {status === 'copied' ? 'Copiado' : status === 'failed' ? 'Não foi possível copiar' : ''}
      </span>
    </>
  )
}
