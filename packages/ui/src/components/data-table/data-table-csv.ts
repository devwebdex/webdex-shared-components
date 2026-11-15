import type { DataTableColumn } from './types.js'

const SEPARATOR = ';'
const LINE_BREAK = '\r\n'
const BOM = '\uFEFF'
// Também depois de espaços: algumas planilhas ignoram o espaço inicial e avaliam a fórmula.
const FORMULA_START = /^(\s*[=+\-@]|[\t\r])/

/**
 * CSV no formato que o Excel em pt-BR abre direto: `;` como separador (a vírgula é decimal),
 * BOM para os acentos e escape RFC 4180.
 *
 * Todo texto vai entre aspas, mesmo sem `;`: numa planilha que separa por vírgula, um texto sem
 * aspas como `ok,=HYPERLINK(...)` seria cortado na vírgula, e o pedaço `=...` viraria fórmula,
 * driblando a proteção abaixo. Números e datas ISO não têm vírgula e ficam sem aspas, para a
 * planilha os ler como número.
 */
export function toCsv<Row>(rows: Row[], columns: DataTableColumn<Row>[]): string {
  const exported = columns.filter((column) => column.exportValue !== false)
  const header = exported.map((column) =>
    typeof column.header === 'string' || typeof column.header === 'number'
      ? String(column.header)
      : column.id
  )
  const lines = [
    header.map((text) => quote(protectText(text))),
    ...rows.map((row) => exported.map((column) => cellField(column, row))),
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
  // Liberar no mesmo tick pode cancelar o download em alguns navegadores (Safari, Firefox antigo).
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

function cellField<Row>(column: DataTableColumn<Row>, row: Row): string {
  const value =
    typeof column.exportValue === 'function' ? column.exportValue(row) : column.accessor?.(row)
  if (value == null) return ''
  if (typeof value === 'number' || typeof value === 'bigint') return String(value)
  if (value instanceof Date) return value.toISOString()
  return quote(protectText(value))
}

/**
 * Texto que começa com `=`, `+`, `-`, `@`, tab ou CR vira fórmula ao abrir na planilha (injeção
 * de fórmula). O apóstrofo faz a planilha ler como texto. Números não passam aqui: `-5` continua
 * número.
 */
function protectText(text: string) {
  return FORMULA_START.test(text) ? `'${text}` : text
}

function quote(text: string) {
  return `"${text.replaceAll('"', '""')}"`
}
