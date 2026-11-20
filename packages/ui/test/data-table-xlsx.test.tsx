import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import { toXlsx } from '../src/components/data-table/data-table-xlsx.js'
import type { DataTableColumn } from '../src/components/data-table/types.js'

type Row = { hash: string; amount: number; at: Date; note: string }

const rows: Row[] = [
  { hash: '0xabc', amount: 1234.5, at: new Date('2026-11-14T17:19:00Z'), note: 'ok' },
  { hash: '0xdef', amount: -20, at: new Date('2026-11-13T10:00:00Z'), note: '=HYPERLINK("x")' },
]

const columns: DataTableColumn<Row>[] = [
  { id: 'hash', header: 'Hash', accessor: (row) => row.hash },
  { id: 'amount', header: 'Valor (USDC)', accessor: (row) => row.amount, align: 'end' },
  { id: 'at', header: 'Data', accessor: (row) => row.at },
  { id: 'note', header: 'Nota', accessor: (row) => row.note },
  { id: 'secret', header: 'Interno', accessor: (row) => row.hash, exportValue: false },
]

async function read(blob: Blob) {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(await blob.arrayBuffer())
  const sheet = workbook.worksheets[0]
  if (!sheet) throw new Error('planilha sem aba')
  return sheet
}

describe('toXlsx', () => {
  it('gera um .xlsx com título, data da exportação e a aba com o nome do título', async () => {
    const blob = await toXlsx(rows, columns, {
      title: 'Transações recentes',
      exportedAt: new Date('2026-11-15T14:32:00Z'),
    })
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    const sheet = await read(blob)
    expect(sheet.name).toBe('Transações recentes')
    expect(sheet.getCell('A2').value).toBe('Transações recentes')
    expect(String(sheet.getCell('A3').value)).toMatch(/^Exportado em .* · 2 linhas$/)
  })

  it('pinta a faixa do topo com o fundo da marca e o cabeçalho de magenta', async () => {
    const sheet = await read(await toXlsx(rows, columns, { title: 'T' }))
    expect(sheet.getCell('A1').fill).toMatchObject({ fgColor: { argb: 'FF0C0611' } })
    const header = sheet.getRow(5)
    expect(header.getCell(1).value).toBe('Hash')
    expect(header.getCell(1).fill).toMatchObject({ fgColor: { argb: 'FFF5127C' } })
    expect(header.getCell(1).font).toMatchObject({ bold: true, color: { argb: 'FFFBF5F9' } })
  })

  it('congela o cabeçalho, liga o filtro e deixa de fora a coluna sem exportação', async () => {
    const sheet = await read(await toXlsx(rows, columns, { title: 'T' }))
    expect(sheet.views[0]).toMatchObject({ state: 'frozen', ySplit: 5 })
    expect(sheet.autoFilter).toBeTruthy()
    expect(sheet.getRow(5).cellCount).toBe(4)
  })

  it('grava número como número, data como data e alterna o fundo das linhas', async () => {
    const sheet = await read(await toXlsx(rows, columns, { title: 'T' }))
    const first = sheet.getRow(6)
    expect(first.getCell(2).value).toBe(1234.5)
    expect(first.getCell(2).numFmt).toBe('#,##0.00')
    expect(first.getCell(2).alignment).toMatchObject({ horizontal: 'right' })
    expect(first.getCell(3).value).toBeInstanceOf(Date)
    expect(first.getCell(3).numFmt).toBe('dd/mm/yyyy hh:mm')
    expect(sheet.getRow(6).getCell(1).fill).not.toMatchObject({ pattern: 'solid' })
    expect(sheet.getRow(7).getCell(1).fill).toMatchObject({ fgColor: { argb: 'FFFFE7F2' } })
  })

  // No .xlsx, texto é texto: a célula não vira fórmula, e não precisa do apóstrofo do CSV.
  it('grava texto que parece fórmula como texto', async () => {
    const sheet = await read(await toXlsx(rows, columns, { title: 'T' }))
    const cell = sheet.getRow(7).getCell(4)
    expect(cell.value).toBe('=HYPERLINK("x")')
    expect(cell.type).toBe(ExcelJS.ValueType.String)
  })

  it('limpa o nome da aba e sai sem logo quando não há canvas', async () => {
    const sheet = await read(await toXlsx([], columns, { title: 'Vendas: [2026]/nov?' }))
    expect(sheet.name).toBe('Vendas   2026  nov')
    expect(sheet.getImages()).toHaveLength(0)
    expect(String(sheet.getCell('A3').value)).toMatch(/0 linhas$/)
  })
})
