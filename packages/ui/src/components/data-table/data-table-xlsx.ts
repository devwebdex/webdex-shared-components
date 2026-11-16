import type { Cell, Worksheet } from 'exceljs'
import type { DataTableColumn } from './types.js'
import { WORDMARK_VIEWBOX, wordmarkSvg } from './webdex-wordmark.js'

/**
 * Excel (.xlsx) com a marca da WEbdEX: faixa escura com o wordmark, título, data da exportação,
 * cabeçalho magenta congelado com o filtro do Excel, linhas claras alternando com o rosa mais
 * claro da paleta, números com milhar e datas em dd/mm/aaaa.
 *
 * Por que o corpo é claro e não o fundo escuro da interface: planilha se imprime e se edita, e
 * fundo escuro em planilha atrapalha as duas coisas. A marca fica no topo e no cabeçalho.
 *
 * O ExcelJS é grande e só serve para exportar: entra por `import()` no clique, e quem nunca
 * exporta não o baixa. Texto vai como texto: no .xlsx ele não é avaliado como fórmula (o CSV
 * precisa do apóstrofo; aqui não).
 *
 * Cores dos tokens (`packages/tokens/src/color.json`), em ARGB como o Excel pede:
 *   background #0c0611   faixa do topo
 *   brand      #f5127c   cabeçalho e o "bd" do wordmark
 *   brand-deep #c4085f   título
 *   text       #fbf5f9   wordmark e texto do cabeçalho
 *   magenta.10 #ffe7f2   linhas alternadas
 */

const ARGB = {
  background: 'FF0C0611',
  brand: 'FFF5127C',
  brandDeep: 'FFC4085F',
  text: 'FFFBF5F9',
  stripe: 'FFFFE7F2',
  muted: 'FF6E6470',
  line: 'FFF2DEEC',
}

const FONT = 'IBM Plex Sans'
/** Linha do cabeçalho: faixa (1), título (2), data (3), respiro (4). */
const HEADER_ROW = 5
const LOGO_HEIGHT = 20

export type DataTableXlsxOptions = {
  /** Título da planilha (ex.: o `caption` da tabela). */
  title: string
  /** Data da exportação mostrada no topo. Padrão: agora. */
  exportedAt?: Date
}

export async function toXlsx<Row>(
  rows: Row[],
  columns: DataTableColumn<Row>[],
  { title, exportedAt = new Date() }: DataTableXlsxOptions
): Promise<Blob> {
  const ExcelJS = await loadExcelJs()
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'WEbdEX'
  workbook.created = exportedAt

  const sheet = workbook.addWorksheet(sheetName(title), {
    views: [{ state: 'frozen', ySplit: HEADER_ROW, showGridLines: false }],
    // Impressão: paisagem e todas as colunas na largura de uma folha.
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  })
  const exported = columns.filter((column) => column.exportValue !== false)
  const lastColumn = Math.max(exported.length, 1)

  // 1. Faixa escura com o wordmark.
  sheet.getRow(1).height = 34
  for (let column = 1; column <= lastColumn; column++) {
    sheet.getCell(1, column).fill = solid(ARGB.background)
  }
  const logo = await wordmarkPng()
  if (logo) {
    const imageId = workbook.addImage({ base64: logo, extension: 'png' })
    const width = Math.round((LOGO_HEIGHT * WORDMARK_VIEWBOX.width) / WORDMARK_VIEWBOX.height)
    sheet.addImage(imageId, {
      tl: { col: 0.15, row: 0.3 },
      ext: { width, height: LOGO_HEIGHT },
      editAs: 'absolute',
    })
  }

  // 2 e 3. Título e data da exportação.
  sheet.mergeCells(2, 1, 2, lastColumn)
  sheet.getCell(2, 1).value = title
  sheet.getCell(2, 1).font = { name: FONT, size: 14, bold: true, color: { argb: ARGB.brandDeep } }
  sheet.getRow(2).height = 24
  sheet.mergeCells(3, 1, 3, lastColumn)
  sheet.getCell(3, 1).value =
    `Exportado em ${exportedAt.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}` +
    ` · ${rows.length.toLocaleString('pt-BR')} ${rows.length === 1 ? 'linha' : 'linhas'}`
  sheet.getCell(3, 1).font = { name: FONT, size: 10, color: { argb: ARGB.muted } }

  // 5. Cabeçalho.
  const header = sheet.getRow(HEADER_ROW)
  header.height = 22
  exported.forEach((column, index) => {
    const cell = header.getCell(index + 1)
    cell.value = headerText(column)
    cell.font = { name: FONT, size: 11, bold: true, color: { argb: ARGB.text } }
    cell.fill = solid(ARGB.brand)
    cell.alignment = { vertical: 'middle', horizontal: alignment(column) }
  })

  // 6 em diante: as linhas.
  rows.forEach((row, rowIndex) => {
    const sheetRow = sheet.getRow(HEADER_ROW + 1 + rowIndex)
    exported.forEach((column, index) => {
      const cell = sheetRow.getCell(index + 1)
      writeValue(cell, cellValue(column, row))
      cell.font = { name: FONT, size: 11 }
      cell.alignment = { vertical: 'middle', horizontal: alignment(column) }
      cell.border = { bottom: { style: 'thin', color: { argb: ARGB.line } } }
      if (rowIndex % 2 === 1) cell.fill = solid(ARGB.stripe)
    })
  })

  if (exported.length > 0) {
    sheet.autoFilter = {
      from: { row: HEADER_ROW, column: 1 },
      to: { row: HEADER_ROW, column: exported.length },
    }
  }
  fitColumns(sheet, exported.length)

  const buffer = await workbook.xlsx.writeBuffer()
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

type ExcelJsModule = typeof import('exceljs')

async function loadExcelJs(): Promise<ExcelJsModule> {
  const module = await import('exceljs')
  // CommonJS: conforme o bundler, a API vem no `default` ou no próprio módulo.
  return (module as ExcelJsModule & { default?: ExcelJsModule }).default ?? module
}

function cellValue<Row>(column: DataTableColumn<Row>, row: Row) {
  return typeof column.exportValue === 'function' ? column.exportValue(row) : column.accessor?.(row)
}

function writeValue(cell: Cell, value: ReturnType<typeof cellValue>) {
  if (value == null) return
  if (value instanceof Date) {
    cell.value = value
    cell.numFmt = 'dd/mm/yyyy hh:mm'
    return
  }
  if (typeof value === 'number') {
    cell.value = value
    cell.numFmt = Number.isInteger(value) ? '#,##0' : '#,##0.00'
    return
  }
  // bigint não cabe no número do Excel sem perder precisão: vai como texto.
  cell.value = String(value)
}

function headerText<Row>(column: DataTableColumn<Row>) {
  return typeof column.header === 'string' || typeof column.header === 'number'
    ? String(column.header)
    : column.id
}

function alignment<Row>(column: DataTableColumn<Row>) {
  return column.align === 'end' ? 'right' : column.align === 'center' ? 'center' : 'left'
}

function solid(argb: string) {
  return { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb } }
}

/** Largura de cada coluna pelo texto mais longo dela, de 10 a 70 caracteres (cabe um hash). */
function fitColumns(sheet: Worksheet, count: number) {
  for (let index = 1; index <= count; index++) {
    let longest = 0
    sheet.getColumn(index).eachCell({ includeEmpty: false }, (cell, rowNumber) => {
      if (rowNumber < HEADER_ROW) return
      longest = Math.max(longest, displayLength(cell))
    })
    sheet.getColumn(index).width = Math.min(Math.max(longest + 3, 10), 70)
  }
}

function displayLength(cell: Cell) {
  if (cell.value instanceof Date) return 16
  if (typeof cell.value === 'number') return cell.value.toLocaleString('pt-BR').length + 1
  return String(cell.value ?? '').length
}

/** Nome de aba válido no Excel: até 31 caracteres, sem `[]:*?/\`. */
function sheetName(title: string) {
  return (
    title
      .replace(/[[\]:*?/\\]/g, ' ')
      .trim()
      .slice(0, 31) || 'Planilha'
  )
}

/**
 * O Excel só aceita PNG, JPEG ou GIF, não SVG: o wordmark é desenhado num canvas e vira PNG, em
 * dobro para ficar nítido. Sem canvas (servidor, testes), a planilha sai sem o logo.
 */
async function wordmarkPng(): Promise<string | null> {
  if (typeof document === 'undefined' || typeof Image === 'undefined') return null
  try {
    const scale = 2
    const canvas = document.createElement('canvas')
    canvas.width = WORDMARK_VIEWBOX.width * scale
    canvas.height = WORDMARK_VIEWBOX.height * scale
    const context = canvas.getContext('2d')
    if (!context) return null
    const image = new Image()
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(wordmarkSvg('#fbf5f9', '#f5127c'))}`
    await image.decode()
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/png').split(',')[1] ?? null
  } catch {
    return null
  }
}
