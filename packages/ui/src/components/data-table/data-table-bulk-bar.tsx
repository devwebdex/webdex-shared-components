import { cn } from '../../lib/cn.js'
import { Button } from '../button/button.js'
import { X } from './data-table-icons.js'
import type { DataTableBulkBarProps } from './types.js'

/**
 * Faixa das ações em lote, acima da tabela quando há linhas selecionadas. O fundo é brand-focus
 * (brand a 12%), o mesmo da linha selecionada: a faixa e as linhas que ela afeta ficam do mesmo tom.
 *
 * As ações são Buttons `text` pequenos. A ação `danger` troca só a cor do texto para danger: o
 * Button não tem cor de perigo, e o hover dele (brand-soft a 10%) continua servindo. "Limpar
 * seleção" fica à direita, longe das ações, para não ser clicado no lugar delas.
 *
 * É uma `<section>` com nome ("Ações em lote"), que vira `role="region"`, para quem navega por
 * marcos achar as ações; a contagem é `aria-live`, porque marcar uma linha muda o número sem
 * mover o foco.
 *
 * Sem estado e sem 'use client'.
 */
export function DataTableBulkBar({ count, actions, onClear }: DataTableBulkBarProps) {
  return (
    <section
      aria-label="Ações em lote"
      className="flex flex-wrap items-center gap-2 bg-brand-focus px-3 py-2 font-sans"
    >
      <p aria-live="polite" className="me-2 text-2xs font-medium tabular-nums text-text-primary">
        {`${count.toLocaleString('pt-BR')} ${count === 1 ? 'selecionada' : 'selecionadas'}`}
      </p>
      {actions.map((action, index) => (
        <Button
          // biome-ignore lint/suspicious/noArrayIndexKey: o rótulo pode não ser texto, e a lista vem pronta de quem usa.
          key={index}
          size="small"
          variant="text"
          iconLeft={action.icon}
          disabled={action.disabled}
          onClick={action.onSelect}
          className={cn(action.tone === 'danger' && 'text-danger')}
        >
          {action.label}
        </Button>
      ))}
      <Button
        size="small"
        variant="text"
        color="code"
        iconLeft={<X />}
        onClick={onClear}
        className="ms-auto"
      >
        Limpar seleção
      </Button>
    </section>
  )
}
