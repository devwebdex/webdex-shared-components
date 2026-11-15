import { Check } from '../../lib/icons.js'
import { Menu, type MenuItem } from '../menu/menu.js'
import { paginationItemClass } from '../pagination/pagination-item.js'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Columns,
  RowsComfortable,
  RowsDense,
} from './data-table-icons.js'
import type { DataTableAlign, DataTableToolbarProps } from './types.js'

/**
 * Barra acima da DataTable: o conteúdo de quem usa à esquerda (ex.: busca) e, à direita, a
 * contagem da seleção e os controles de aparência.
 *
 * O alinhamento é UM botão que avança start → center → end (pedido do produto: um clique muda a
 * orientação do texto das linhas). Ele mostra o ícone do estado atual e diz o estado no nome
 * acessível e no `title`, porque o ícone sozinho não explica que o clique troca. A densidade é
 * um liga/desliga: nome fixo ("Densidade compacta") e o estado em `aria-pressed`.
 *
 * O menu de colunas usa o Menu, que não tem item marcável: a marca é o Check (ou um ícone vazio do
 * mesmo tamanho, para os rótulos ficarem alinhados) e o estado vai em texto só para leitor de
 * tela, já que o ícone é `aria-hidden`.
 *
 * Os botões de ícone usam o item da Pagination: mesmo quadrado de 32px, raio, hover e foco.
 *
 * A região `aria-live` da seleção fica sempre no DOM, mesmo vazia: leitor de tela só anuncia
 * mudança numa região que já existia antes dela.
 *
 * Sem 'use client' próprio: não há estado aqui, e o Menu já é Client Component.
 */

const iconButtonClass = `${paginationItemClass} size-6 px-0`

const alignLabel: Record<DataTableAlign, string> = {
  start: 'Alinhamento do texto: à esquerda',
  center: 'Alinhamento do texto: ao centro',
  end: 'Alinhamento do texto: à direita',
}

const AlignIcon = { start: AlignLeft, center: AlignCenter, end: AlignRight }

export function DataTableToolbar({
  start,
  align,
  onCycleAlign,
  density,
  onToggleDensity,
  columns,
  onToggleColumn,
  selectedCount,
}: DataTableToolbarProps) {
  const CurrentAlignIcon = AlignIcon[align]
  const compact = density === 'compact'

  const columnItems: MenuItem[] = columns.map((column) => ({
    label: (
      <span>
        {column.header} <span className="sr-only">{column.hidden ? '(oculta)' : '(visível)'}</span>
      </span>
    ),
    icon: column.hidden ? <svg aria-hidden="true" viewBox="0 0 24 24" /> : <Check />,
    onSelect: () => onToggleColumn(column.id),
  }))

  return (
    <div className="flex flex-wrap items-center gap-3 font-sans">
      {start !== undefined && <div className="flex min-w-0 flex-1 items-center gap-2">{start}</div>}
      <div className="ms-auto flex items-center gap-1">
        <span aria-live="polite" className="me-2 text-2xs tabular-nums text-text-secondary">
          {selectedCount > 0 &&
            `${selectedCount.toLocaleString('pt-BR')} ${selectedCount === 1 ? 'selecionada' : 'selecionadas'}`}
        </span>
        <button
          type="button"
          aria-label={alignLabel[align]}
          title={alignLabel[align]}
          onClick={onCycleAlign}
          className={iconButtonClass}
        >
          <CurrentAlignIcon />
        </button>
        <button
          type="button"
          // Nome fixo: o estado já vai no aria-pressed, e um nome que muda o anunciaria duas vezes.
          aria-label="Densidade compacta"
          title="Densidade compacta"
          aria-pressed={compact}
          onClick={onToggleDensity}
          className={`${iconButtonClass} aria-pressed:bg-surface-code aria-pressed:text-text-primary`}
        >
          {compact ? <RowsDense /> : <RowsComfortable />}
        </button>
        {columns.length > 0 && (
          <Menu
            items={columnItems}
            align="end"
            trigger={
              <button
                type="button"
                aria-label="Colunas visíveis"
                title="Colunas visíveis"
                className={`${iconButtonClass} data-[state=open]:bg-surface-code data-[state=open]:text-text-primary`}
              >
                <Columns />
              </button>
            }
          />
        )}
      </div>
    </div>
  )
}
