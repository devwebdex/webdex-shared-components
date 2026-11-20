import { afterEach, describe, expect, it, vi } from 'vitest'
import { downloadCsv, toCsv } from '../src/components/data-table/data-table-csv.js'
import type { DataTableColumn } from '../src/components/data-table/types.js'

type Row = { id: string; note: string | null; amount: number; at: Date; big: bigint }

const row: Row = {
  id: 'a',
  note: 'simples',
  amount: 10.5,
  at: new Date('2025-03-01T12:00:00.000Z'),
  big: 12345678901234567890n,
}

const lines = (csv: string) => csv.slice(1).split('\r\n')

describe('toCsv', () => {
  it('começa com BOM, usa ; e \\r\\n, e cabeçalho pelo header ou pelo id', () => {
    const columns: DataTableColumn<Row>[] = [
      { id: 'id', header: 'Código', accessor: (r) => r.id },
      { id: 'amount', header: 2025, accessor: (r) => r.amount },
      { id: 'note', header: <span>Nota</span>, accessor: (r) => r.note },
    ]
    const csv = toCsv([row, { ...row, id: 'b', note: null }], columns)
    expect(csv.startsWith('﻿')).toBe(true)
    expect(lines(csv)).toEqual(['"Código";"2025";"note"', '"a";10.5;"simples"', '"b";10.5;'])
  })

  it('põe todo texto entre aspas e escapa aspas, ; e quebras de linha (RFC 4180)', () => {
    const columns: DataTableColumn<Row>[] = [
      { id: 'note', header: 'Nota', accessor: (r) => r.note },
    ]
    const csv = toCsv(
      [
        { ...row, note: 'diz "oi"' },
        { ...row, note: 'a;b' },
        { ...row, note: 'linha 1\nlinha 2' },
      ],
      columns
    )
    expect(csv).toBe('﻿"Nota"\r\n"diz ""oi"""\r\n"a;b"\r\n"linha 1\nlinha 2"')
  })

  // Numa planilha que separa por vírgula, texto sem aspas seria cortado na vírgula e o pedaço
  // "=..." viraria fórmula, driblando a proteção.
  it('não deixa uma vírgula soltar uma fórmula numa planilha que separa por vírgula', () => {
    const columns: DataTableColumn<Row>[] = [
      { id: 'note', header: 'Nota', accessor: (r) => r.note },
    ]
    const [, line] = lines(toCsv([{ ...row, note: 'ok,=HYPERLINK("x")' }], columns))
    expect(line).toBe('"ok,=HYPERLINK(""x"")"')
  })

  it('usa exportValue, ignora coluna com exportValue false e converte Date e bigint', () => {
    const columns: DataTableColumn<Row>[] = [
      { id: 'id', header: 'Código', accessor: (r) => r.id, exportValue: false },
      {
        id: 'amount',
        header: 'Valor',
        accessor: (r) => r.amount,
        exportValue: (r) => `R$ ${r.amount}`,
      },
      { id: 'at', header: 'Data', accessor: (r) => r.at },
      { id: 'big', header: 'Big', accessor: (r) => r.big },
      { id: 'empty', header: 'Vazio' },
    ]
    expect(lines(toCsv([row], columns))).toEqual([
      '"Valor";"Data";"Big";"Vazio"',
      '"R$ 10.5";2025-03-01T12:00:00.000Z;12345678901234567890;',
    ])
  })

  it('protege texto contra injeção de fórmula, mas mantém número negativo', () => {
    const columns: DataTableColumn<Row>[] = [
      { id: 'note', header: '=Nota', accessor: (r) => r.note },
      { id: 'amount', header: 'Valor', accessor: (r) => r.amount },
    ]
    const data = ['=SUM(A1)', '+1', '-1', '@cmd', '\tx', '\rx', '  =1+1'].map((note) => ({
      ...row,
      note,
      amount: -5,
    }))
    expect(lines(toCsv(data, columns))).toEqual([
      `"'=Nota";"Valor"`,
      `"'=SUM(A1)";-5`,
      `"'+1";-5`,
      `"'-1";-5`,
      `"'@cmd";-5`,
      `"'\tx";-5`,
      `"'\rx";-5`,
      `"'  =1+1";-5`,
    ])
  })

  it('sem linhas, só o cabeçalho', () => {
    expect(toCsv([], [{ id: 'id', header: 'Código', accessor: (r: Row) => r.id }])).toBe('﻿"Código"')
  })
})

describe('downloadCsv', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('baixa por um link temporário e libera a URL depois do clique', () => {
    vi.useFakeTimers()
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:csv')
    const revokeObjectURL = vi.fn()
    Object.assign(URL, { createObjectURL, revokeObjectURL })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    downloadCsv('a;b', 'tabela.csv')

    expect(createObjectURL.mock.calls[0]?.[0].type).toBe('text/csv;charset=utf-8')
    expect(click).toHaveBeenCalledTimes(1)
    const link = click.mock.contexts[0] as HTMLAnchorElement
    expect(link.download).toBe('tabela.csv')
    expect(link.isConnected).toBe(false)
    // Liberada no tick seguinte, não no mesmo: alguns navegadores cancelariam o download.
    expect(revokeObjectURL).not.toHaveBeenCalled()
    vi.runAllTimers()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:csv')
  })
})
