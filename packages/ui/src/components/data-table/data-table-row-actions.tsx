import { cn } from '../../lib/cn.js'
import { Menu } from '../menu/menu.js'
import { paginationItemClass } from '../pagination/pagination-item.js'
import { MoreHorizontal } from './data-table-icons.js'
import type { DataTableRowActionsProps } from './types.js'

/**
 * Botão "…" da última coluna, que abre as ações da linha no Menu do design system.
 *
 * O gatilho é um botão só de ícone, com o item da Pagination como base: o mesmo quadrado de 32px,
 * raio, hover e anel de foco dos outros botões pequenos da tabela (a barra de ferramentas usa a
 * mesma classe). Aberto, ele fica no estado de hover (`data-[state=open]`, posto pelo Radix), para
 * mostrar de que linha é o menu. O nome acessível vem de `label`, porque o ícone é `aria-hidden`.
 *
 * `align="end"`: o botão fica na borda direita da tabela, e a lista abre para dentro dela.
 * Sem 'use client' próprio: quem tem estado é o Menu, que já é Client Component.
 */
export function DataTableRowActions({ items, label }: DataTableRowActionsProps) {
  return (
    <Menu
      items={items}
      align="end"
      trigger={
        <button
          type="button"
          aria-label={label}
          className={cn(
            paginationItemClass,
            'size-6 px-0',
            'data-[state=open]:bg-surface-code data-[state=open]:text-text-primary'
          )}
        >
          <MoreHorizontal />
        </button>
      }
    />
  )
}
