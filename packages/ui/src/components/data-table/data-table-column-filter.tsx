import { cn } from '../../lib/cn.js'
import { Check } from '../../lib/icons.js'
import { Menu, type MenuItem } from '../menu/menu.js'
import { paginationItemClass } from '../pagination/pagination-item.js'
import { Filter } from './data-table-icons.js'
import type { DataTableColumnFilterProps } from './types.js'

/**
 * Filtro de uma coluna, no cabeçalho ao lado do título: um Menu com as opções, que alternam a cada
 * clique. O Menu não tem item marcável, então a marca segue o menu de colunas da barra: Check
 * (ou um ícone vazio do mesmo tamanho, para alinhar) e o estado em texto só para leitor de tela.
 *
 * O gatilho é o item da Pagination em 24px (`size-5`), menor que os da barra para caber na linha
 * do cabeçalho. Com valores marcados, ele fica na cor brand com um ponto no canto, e o `title`
 * diz quantos. O nome acessível fica fixo ("Filtrar Status"); quem usa leitor de tela vê o que
 * está marcado ao abrir o menu.
 *
 * VALORES SEM TOKEN: o ponto de 6px (`size-1.5`) a 2px do canto (`end-0.5 top-0.5`), menores que
 * o menor espaçamento da escala.
 *
 * Sem 'use client' próprio: os valores são de quem controla os filtros, e o Menu já é Client
 * Component.
 */
export function DataTableColumnFilter({
  columnLabel,
  options,
  selected,
  onChange,
}: DataTableColumnFilterProps) {
  const active = selected.length > 0

  const toggle = (value: string) =>
    onChange(
      selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]
    )

  const items: MenuItem[] = options.map((option) => {
    const checked = selected.includes(option.value)
    return {
      label: (
        <span>
          {option.label} <span className="sr-only">{checked ? '(marcado)' : '(desmarcado)'}</span>
        </span>
      ),
      icon: checked ? <Check /> : <svg aria-hidden="true" viewBox="0 0 24 24" />,
      onSelect: () => toggle(option.value),
    }
  })
  if (active) items.push('separator', { label: 'Limpar filtro', onSelect: () => onChange([]) })

  const label = `Filtrar ${columnLabel}`
  const title = active
    ? `Filtrar ${columnLabel} (${selected.length.toLocaleString('pt-BR')} ${selected.length === 1 ? 'marcado' : 'marcados'})`
    : `Filtrar ${columnLabel}`

  return (
    <Menu
      items={items}
      trigger={
        <button
          type="button"
          aria-label={label}
          title={title}
          className={cn(
            paginationItemClass,
            'relative size-5 min-w-0 px-0',
            'data-[state=open]:bg-surface-code data-[state=open]:text-text-primary',
            active && 'text-brand data-[state=open]:text-brand hover:text-brand'
          )}
        >
          <Filter />
          {active && (
            <span
              aria-hidden="true"
              className="absolute end-0.5 top-0.5 size-1.5 rounded-full bg-brand"
            />
          )}
        </button>
      }
    />
  )
}
