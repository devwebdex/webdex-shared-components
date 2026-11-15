import type { DataTableColumn } from './types.js'

const SEPARATOR = ';'
const LINE_BREAK = '\r\n'
const BOM = '\uFEFF'
const FORMULA_START = /^[=+\-@\t\r]/

/**
 * CSV no formato que o Excel em pt-BR abre direto: `;` como separador (a vírgula é decimal),
 * BOM para os acentos e escape RFC 4180.
 */
export function toCsv<Row>(rows: Row[], columns: DataTableColumn<Row>[]): string {
  const exported = columns.filter((column) => column.exportValue !== false)
  const header = exported.map((column) =>
    typeof column.header === 'string' || typeof column.header === 'number'
      ? String(column.header)
      : column.id
  )
  const lines = [
    header.map((text) => escapeField(protectText(text))),
    ...rows.map((row) => exported.map((column) => escapeField(cellValue(column, row)))),
  ]
  return BOM + lines.map((fields) => fields.join(SEPARATOR)).join(LINE_BREAK)
}

export function downloadCsv(csv: string, fileName: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.style.display = 'none'
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function cellValue<Row>(column: DataTableColumn<Row>, row: Row): string {
  const value =
    typeof column.exportValue === 'function' ? column.exportValue(row) : column.accessor?.(row)
  if (value == null) return ''
  if (typeof value === 'number' || typeof value === 'bigint') return String(value)
  if (value instanceof Date) return value.toISOString()
  return protectText(value)
}

/**
 * Texto que começa com `=`, `+`, `-`, `@`, tab ou CR vira fórmula ao abrir na planilha (injeção
 * de fórmula). O apóstrofo faz a planilha ler como texto. Números não passam aqui: `-5` continua
 * número.
 */
function protectText(text: string) {
  return FORMULA_START.test(text) ? `'${text}` : text
}

function escapeField(field: string) {
  return /[";\r\n]/.test(field) ? `"${field.replaceAll('"', '""')}"` : field
}
