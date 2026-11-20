import { Pagination } from '../pagination/pagination.js'
import { Select } from '../select/select.js'
import type { DataTableFooterProps } from './types.js'

/**
 * Rodapé da DataTable: quantas linhas estão à vista ("1–10 de 45") e as linhas por página à
 * esquerda; a Pagination à direita. Quebra em duas linhas em tela estreita (`flex-wrap`).
 *
 * O resumo é `aria-live`: trocar de página ou de tamanho muda a tabela inteira sem mover o foco,
 * e é ele que conta isso ao leitor de tela. Números em `pt-BR` (1.000, não 1,000).
 *
 * O gatilho do Select ocupa a largura toda por padrão (`w-full`); aqui ele fica do tamanho do
 * texto, ao lado do resumo. O Select trabalha com texto; a conversão para número fica aqui, para
 * quem usa receber número.
 * A Pagination só aparece com mais de uma página: com uma, os botões estariam todos parados.
 *
 * Sem 'use client' próprio: não há estado aqui, e Select e Pagination já são Client Components.
 */
export function DataTableFooter({
  page,
  pageCount,
  pageSize,
  totalRows,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions,
}: DataTableFooterProps) {
  const format = (value: number) => value.toLocaleString('pt-BR')
  const first = (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, totalRows)
  const summary =
    totalRows === 0 ? '0 de 0' : `${format(first)}–${format(last)} de ${format(totalRows)}`
  // Um tamanho fora das opções (ex.: pageSize={25}) entra na lista: sem ele, o Select ficaria vazio.
  const sizes = pageSizeOptions.includes(pageSize)
    ? pageSizeOptions
    : [...pageSizeOptions, pageSize].sort((a, b) => a - b)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 font-sans text-2xs text-text-secondary">
      <div className="flex flex-wrap items-center gap-3">
        <p aria-live="polite" className="tabular-nums">
          {summary}
        </p>
        {pageSizeOptions.length > 0 && (
          <Select
            size="small"
            aria-label="Linhas por página"
            className="w-auto"
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
            options={sizes.map((option) => ({
              value: String(option),
              label: `${format(option)} por página`,
            }))}
          />
        )}
      </div>
      {pageCount > 1 && <Pagination page={page} count={pageCount} onPageChange={onPageChange} />}
    </div>
  )
}
