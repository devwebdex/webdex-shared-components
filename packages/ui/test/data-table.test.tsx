import { render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DataTable,
  type DataTableColumn,
  DataTableCopyButton,
  type DataTableProps,
} from '../src/components/data-table/index.js'

type Wallet = { id: string; name: string; amount: number; network: string }

const wallets: Wallet[] = Array.from({ length: 45 }, (_, index) => {
  const n = String(index + 1).padStart(2, '0')
  return { id: `w${n}`, name: `Carteira ${n}`, amount: (index + 1) * 10, network: 'Polygon' }
})

const columns: DataTableColumn<Wallet>[] = [
  { id: 'name', header: 'Nome', accessor: (row) => row.name, sortable: true, hideable: false },
  { id: 'amount', header: 'Valor', accessor: (row) => row.amount, sortable: true, align: 'end' },
  { id: 'network', header: 'Rede', accessor: (row) => row.network },
]

const caption = 'Carteiras'

function renderTable(props: Partial<DataTableProps<Wallet>> = {}) {
  const view = render(
    <DataTable
      data={wallets}
      columns={columns}
      getRowId={(row) => row.id}
      caption={caption}
      {...props}
    />
  )
  return { ...view, user: userEvent.setup() }
}

/** Linhas do corpo (sem a do cabeçalho). */
function bodyRows() {
  const table = screen.getByRole('table', { name: caption })
  return within(table).getAllByRole('row').slice(1)
}

/** Texto da primeira célula de cada linha do corpo. */
function firstCells() {
  return bodyRows().map((row) => within(row).getAllByRole('cell')[0]?.textContent)
}

/** Células de uma coluna (pela posição) nas linhas do corpo. */
function columnCells(index: number) {
  return bodyRows().map((row) => within(row).getAllByRole('cell')[index] as HTMLElement)
}

describe('DataTable', () => {
  describe('estrutura', () => {
    it('expõe tabela nomeada pelo caption, cabeçalhos e linhas', () => {
      renderTable()
      const table = screen.getByRole('table', { name: caption })
      expect(
        within(table)
          .getAllByRole('columnheader')
          .map((th) => th.textContent)
      ).toEqual(['Nome', 'Valor', 'Rede'])
      expect(bodyRows()).toHaveLength(10)
      expect(firstCells()[0]).toBe('Carteira 01')
    })

    it('esconde o caption por padrão e mostra com showCaption', () => {
      const { unmount } = renderTable()
      expect(screen.getByText(caption, { selector: 'caption' }).className).toBe('sr-only')
      unmount()

      renderTable({ showCaption: true })
      expect(screen.getByText(caption, { selector: 'caption' }).className).not.toContain('sr-only')
    })
  })

  describe('ordenação', () => {
    it('cicla aria-sort none → ascending → descending → none e reordena as linhas', async () => {
      const data = [wallets[1], wallets[2], wallets[0]] as Wallet[]
      const { user } = renderTable({ pagination: false, data })
      const header = screen.getByRole('columnheader', { name: /Valor/ })
      const button = within(header).getByRole('button', { name: /Valor/ })
      expect(header.getAttribute('aria-sort')).toBe('none')
      expect(firstCells()).toEqual(['Carteira 02', 'Carteira 03', 'Carteira 01'])

      await user.click(button)
      expect(header.getAttribute('aria-sort')).toBe('ascending')
      expect(firstCells()).toEqual(['Carteira 01', 'Carteira 02', 'Carteira 03'])

      await user.click(button)
      expect(header.getAttribute('aria-sort')).toBe('descending')
      expect(firstCells()).toEqual(['Carteira 03', 'Carteira 02', 'Carteira 01'])

      await user.click(button)
      expect(header.getAttribute('aria-sort')).toBe('none')
      expect(firstCells()).toEqual(['Carteira 02', 'Carteira 03', 'Carteira 01'])
    })

    it('coluna não ordenável não tem botão nem aria-sort', () => {
      renderTable()
      const header = screen.getByRole('columnheader', { name: 'Rede' })
      expect(within(header).queryByRole('button')).toBeNull()
      expect(header.hasAttribute('aria-sort')).toBe(false)
    })
  })

  describe('ações da linha', () => {
    it('o botão "…" nomeia a linha, abre o Menu e chama a ação com a linha certa', async () => {
      const onEdit = vi.fn()
      const { user } = renderTable({
        rowActions: (row) => [
          { label: 'Editar', onSelect: () => onEdit(row) },
          { label: 'Arquivar', disabled: true },
        ],
      })
      const trigger = screen.getByRole('button', { name: 'Ações da linha Carteira 02' })

      await user.click(trigger)
      expect(screen.getByRole('menu')).toBeTruthy()
      expect(screen.getByRole('menuitem', { name: 'Arquivar' }).getAttribute('aria-disabled')).toBe(
        'true'
      )

      await user.click(screen.getByRole('menuitem', { name: 'Editar' }))
      expect(onEdit).toHaveBeenCalledExactlyOnceWith(wallets[1])
      expect(screen.queryByRole('menu')).toBeNull()
    })
  })

  describe('alinhamento', () => {
    it('avança esquerda → centro → direita e muda a classe das células sem align fixo', async () => {
      const { user } = renderTable()
      const nameCells = () => columnCells(0)
      const amountCells = () => columnCells(1)
      expect(nameCells()[0]?.className).toContain('text-left')
      expect(amountCells()[0]?.className).toContain('text-right')

      await user.click(screen.getByRole('button', { name: 'Alinhamento do texto: à esquerda' }))
      expect(nameCells().every((td) => td.className.includes('text-center'))).toBe(true)
      expect(amountCells()[0]?.className).toContain('text-right')

      await user.click(screen.getByRole('button', { name: 'Alinhamento do texto: ao centro' }))
      expect(nameCells().every((td) => td.className.includes('text-right'))).toBe(true)
      expect(screen.getByRole('button', { name: 'Alinhamento do texto: à direita' })).toBeTruthy()
      expect(amountCells()[0]?.className).toContain('text-right')
    })
  })

  describe('densidade', () => {
    it('alterna aria-pressed e o padding das células', async () => {
      const { user } = renderTable()
      const button = screen.getByRole('button', { name: 'Densidade compacta' })
      expect(button.getAttribute('aria-pressed')).toBe('false')
      expect(columnCells(0)[0]?.className).toContain('py-2')

      await user.click(button)
      expect(button.getAttribute('aria-pressed')).toBe('true')
      expect(columnCells(0)[0]?.className).toContain('py-1')
      expect(columnCells(0)[0]?.className).not.toContain('py-2')

      await user.click(button)
      expect(button.getAttribute('aria-pressed')).toBe('false')
      expect(columnCells(0)[0]?.className).toContain('py-2')
    })
  })

  describe('paginação', () => {
    it('mostra o resumo e troca de página', async () => {
      const { user } = renderTable()
      expect(screen.getByText('1–10 de 45')).toBeTruthy()

      const nav = screen.getByRole('navigation', { name: 'Paginação' })
      await user.click(within(nav).getByRole('button', { name: 'Página 2' }))
      expect(firstCells()[0]).toBe('Carteira 11')
      expect(firstCells().at(-1)).toBe('Carteira 20')
      expect(screen.getByText('11–20 de 45')).toBeTruthy()
    })

    it('trocar as linhas por página volta para a página 1', async () => {
      const onPageSizeChange = vi.fn()
      const { user } = renderTable({ onPageSizeChange })
      await user.click(screen.getByRole('button', { name: 'Página 3' }))
      expect(screen.getByText('21–30 de 45')).toBeTruthy()

      const select = screen.getByRole('combobox', { name: 'Linhas por página' })
      await user.click(select)
      await user.click(screen.getByRole('option', { name: '20 por página' }))
      expect(onPageSizeChange).toHaveBeenCalledWith(20)
      expect(screen.getByText('1–20 de 45')).toBeTruthy()
      expect(bodyRows()).toHaveLength(20)
      expect(firstCells()[0]).toBe('Carteira 01')
    })

    it('com pagination={false} não há navegação e mostra todas as linhas', () => {
      renderTable({ pagination: false })
      expect(screen.queryByRole('navigation')).toBeNull()
      expect(bodyRows()).toHaveLength(45)
    })

    it('controlado: avisa a página e só muda quando a prop muda', async () => {
      const onPageChange = vi.fn()
      const props = {
        data: wallets,
        columns,
        getRowId: (row: Wallet) => row.id,
        caption,
        onPageChange,
      }
      const { rerender } = render(<DataTable {...props} page={1} />)
      await userEvent.setup().click(screen.getByRole('button', { name: 'Página 2' }))
      expect(onPageChange).toHaveBeenCalledExactlyOnceWith(2)
      expect(firstCells()[0]).toBe('Carteira 01')

      rerender(<DataTable {...props} page={2} />)
      expect(firstCells()[0]).toBe('Carteira 11')
      expect(screen.getByText('11–20 de 45')).toBeTruthy()
    })
  })

  describe('seleção', () => {
    it('marca linhas, a página inteira e avisa os ids', async () => {
      const onSelectionChange = vi.fn()
      const { user } = renderTable({ selectable: true, onSelectionChange })
      const all = screen.getByRole('checkbox', {
        name: 'Selecionar todas as linhas da página',
      }) as HTMLInputElement
      const first = screen.getByRole('checkbox', { name: 'Selecionar linha Carteira 01' })
      const row = first.closest('tr') as HTMLElement
      expect(row.getAttribute('aria-selected')).toBe('false')

      await user.click(first)
      expect(onSelectionChange).toHaveBeenLastCalledWith(['w01'])
      expect(row.getAttribute('aria-selected')).toBe('true')
      expect(all.checked).toBe(false)
      expect(all.indeterminate).toBe(true)
      expect(screen.getByText('1 selecionada')).toBeTruthy()

      await user.click(all)
      expect(onSelectionChange).toHaveBeenLastCalledWith(
        wallets.slice(0, 10).map((wallet) => wallet.id)
      )
      expect(all.checked).toBe(true)
      expect(all.indeterminate).toBe(false)
      expect(bodyRows().every((tr) => tr.getAttribute('aria-selected') === 'true')).toBe(true)
      expect(screen.getByText('10 selecionadas')).toBeTruthy()

      await user.click(all)
      expect(onSelectionChange).toHaveBeenLastCalledWith([])
      expect(all.checked).toBe(false)
      expect(screen.queryByText(/selecionada/)).toBeNull()
    })
  })

  describe('colunas visíveis', () => {
    it('esconder uma coluna pelo menu remove o cabeçalho dela', async () => {
      const { user } = renderTable()
      await user.click(screen.getByRole('button', { name: 'Colunas visíveis' }))
      // A coluna com hideable: false não entra no menu.
      expect(screen.queryByRole('menuitem', { name: /Nome/ })).toBeNull()

      await user.click(screen.getByRole('menuitem', { name: 'Rede (visível)' }))
      expect(screen.queryByRole('columnheader', { name: 'Rede' })).toBeNull()
      expect(screen.getByRole('columnheader', { name: /Valor/ })).toBeTruthy()

      await user.click(screen.getByRole('button', { name: 'Colunas visíveis' }))
      await user.click(screen.getByRole('menuitem', { name: 'Rede (oculta)' }))
      expect(screen.getByRole('columnheader', { name: 'Rede' })).toBeTruthy()
    })
  })

  describe('estados', () => {
    it('loading põe aria-busy e não mostra os dados', () => {
      renderTable({ loading: true })
      const table = screen.getByRole('table', { name: caption })
      expect(table.getAttribute('aria-busy')).toBe('true')
      expect(screen.queryByText('Carteira 01')).toBeNull()
    })

    it('sem dados mostra a mensagem padrão ou o emptyState', () => {
      const { unmount } = renderTable({ data: [] })
      expect(screen.getByText('Nenhum registro encontrado.')).toBeTruthy()
      expect(screen.getByRole('table', { name: caption }).hasAttribute('aria-busy')).toBe(false)
      unmount()

      renderTable({ data: [], emptyState: <span>Nenhuma carteira conectada.</span> })
      expect(screen.getByText('Nenhuma carteira conectada.')).toBeTruthy()
      expect(screen.queryByText('Nenhum registro encontrado.')).toBeNull()
    })
  })
})

// --- Recursos da segunda etapa ------------------------------------------------------------------

type Tx = { id: string; hash: string; owner: string; status: string; date: Date }

// Meio-dia UTC: a data local é a mesma em qualquer fuso de -12 a +8.
const txs: Tx[] = [
  {
    id: 't1',
    hash: '0xaaa1',
    owner: 'João Ávila',
    status: 'Concluída',
    date: new Date('2026-11-14T12:00:00Z'),
  },
  {
    id: 't2',
    hash: '0xbbb2',
    owner: 'Maria Souza',
    status: 'Pendente',
    date: new Date('2026-10-03T12:00:00Z'),
  },
  {
    id: 't3',
    hash: '0xccc3',
    owner: 'Pedro Lima',
    status: 'Cancelada',
    date: new Date('2025-01-20T12:00:00Z'),
  },
]

const txColumns: DataTableColumn<Tx>[] = [
  { id: 'hash', header: 'Hash', accessor: (row) => row.hash },
  { id: 'owner', header: 'Titular', accessor: (row) => row.owner },
  { id: 'status', header: 'Status', accessor: (row) => row.status },
  {
    id: 'date',
    header: 'Data',
    accessor: (row) => row.date,
    cell: (row) => row.date.toLocaleDateString('pt-BR'),
  },
]

const txCaption = 'Transações'

function renderTxTable(props: Partial<DataTableProps<Tx>> = {}) {
  const view = render(
    <DataTable
      data={txs}
      columns={txColumns}
      getRowId={(row) => row.id}
      caption={txCaption}
      {...props}
    />
  )
  return { ...view, user: userEvent.setup() }
}

function txFirstCells() {
  const table = screen.getByRole('table', { name: txCaption })
  return within(table)
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).queryAllByRole('cell')[0]?.textContent)
}

const networks = ['Ethereum', 'Polygon', 'BSC']

/** As 45 carteiras em três redes: Ethereum (01, 04...), Polygon (02, 05...) e BSC (03, 06...). */
const mixedWallets: Wallet[] = wallets.map((wallet, index) => ({
  ...wallet,
  network: networks[index % 3] as string,
}))

const filterColumns: DataTableColumn<Wallet>[] = [
  columns[0] as DataTableColumn<Wallet>,
  columns[1] as DataTableColumn<Wallet>,
  {
    id: 'network',
    header: 'Rede',
    accessor: (row) => row.network,
    filterOptions: networks.map((value) => ({ value, label: value })),
  },
]

/** O "Limpar filtros" da barra de ferramentas (o do estado vazio fica dentro da tabela). */
function toolbarClearFilters() {
  const table = screen.getByRole('table', { name: caption })
  return screen
    .queryAllByRole('button', { name: 'Limpar filtros' })
    .filter((button) => !table.contains(button))
}

const stickyClass = /(^| )sticky( |$)/

describe('DataTable: recursos', () => {
  describe('busca', () => {
    it('searchable mostra o campo nomeado pelo caption e filtra as linhas e o resumo', async () => {
      const { user } = renderTxTable({ searchable: true })
      const search = screen.getByRole('searchbox', { name: `Buscar em ${txCaption}` })
      expect(screen.getByText('1–3 de 3')).toBeTruthy()

      await user.type(search, 'souza')
      expect(txFirstCells()).toEqual(['0xbbb2'])
      expect(screen.getByText('1–1 de 1')).toBeTruthy()
    })

    it('sem searchable não há campo de busca', () => {
      renderTxTable()
      expect(screen.queryByRole('searchbox')).toBeNull()
    })

    it('busca sem acento encontra o texto com acento', async () => {
      const { user } = renderTxTable({ searchable: true })
      await user.type(screen.getByRole('searchbox'), 'avila')
      expect(txFirstCells()).toEqual(['0xaaa1'])
    })

    it('encontra a linha com Date pela data em pt-BR ("14/11") e em ISO ("2026-11")', async () => {
      const { user } = renderTxTable({ searchable: true })
      const search = screen.getByRole('searchbox')

      await user.type(search, '14/11')
      expect(txFirstCells()).toEqual(['0xaaa1'])

      await user.clear(search)
      await user.type(search, '2026-11')
      expect(txFirstCells()).toEqual(['0xaaa1'])

      await user.clear(search)
      await user.type(search, '2026-')
      expect(txFirstCells()).toEqual(['0xaaa1', '0xbbb2'])
    })

    it('Esc limpa a busca e mostra todas as linhas de novo', async () => {
      const { user } = renderTxTable({ searchable: true })
      const search = screen.getByRole('searchbox') as HTMLInputElement
      await user.type(search, 'souza')
      expect(txFirstCells()).toHaveLength(1)

      await user.keyboard('{Escape}')
      expect(search.value).toBe('')
      expect(txFirstCells()).toHaveLength(3)
    })

    it('"Limpar busca" só aparece com texto, limpa e devolve o foco ao campo', async () => {
      const onGlobalFilterChange = vi.fn()
      const { user } = renderTxTable({ searchable: true, onGlobalFilterChange })
      const search = screen.getByRole('searchbox') as HTMLInputElement
      expect(screen.queryByRole('button', { name: 'Limpar busca' })).toBeNull()

      await user.type(search, 'lima')
      expect(onGlobalFilterChange).toHaveBeenLastCalledWith('lima')
      await user.click(screen.getByRole('button', { name: 'Limpar busca' }))
      expect(onGlobalFilterChange).toHaveBeenLastCalledWith('')
      expect(search.value).toBe('')
      expect(document.activeElement).toBe(search)
      expect(screen.queryByRole('button', { name: 'Limpar busca' })).toBeNull()
      expect(txFirstCells()).toHaveLength(3)
    })

    it('sem resultado mostra a mensagem e "Limpar filtros" restaura as linhas', async () => {
      const { user } = renderTxTable({ searchable: true })
      const search = screen.getByRole('searchbox') as HTMLInputElement
      await user.type(search, 'inexistente')

      const table = screen.getByRole('table', { name: txCaption })
      expect(within(table).getByText('Nenhum resultado para a busca.')).toBeTruthy()
      expect(screen.queryByText('Nenhum registro encontrado.')).toBeNull()

      await user.click(within(table).getByRole('button', { name: 'Limpar filtros' }))
      expect(search.value).toBe('')
      expect(txFirstCells()).toEqual(['0xaaa1', '0xbbb2', '0xccc3'])
    })
  })

  describe('filtro por coluna', () => {
    function renderFiltered(props: Partial<DataTableProps<Wallet>> = {}) {
      return renderTable({ data: mixedWallets, columns: filterColumns, ...props })
    }

    it('o botão "Filtrar <coluna>" abre o menu com as opções', async () => {
      const { user } = renderFiltered()
      expect(screen.queryByRole('button', { name: 'Filtrar Nome' })).toBeNull()

      await user.click(screen.getByRole('button', { name: 'Filtrar Rede' }))
      const menu = screen.getByRole('menu')
      expect(
        within(menu)
          .getAllByRole('menuitem')
          .map((item) => item.textContent)
      ).toEqual(['Ethereum (desmarcado)', 'Polygon (desmarcado)', 'BSC (desmarcado)'])
    })

    it('marcar uma opção filtra; marcar duas soma as linhas das duas (OR)', async () => {
      const onColumnFiltersChange = vi.fn()
      const { user } = renderFiltered({ onColumnFiltersChange })
      const trigger = screen.getByRole('button', { name: 'Filtrar Rede' })

      await user.click(trigger)
      await user.click(screen.getByRole('menuitem', { name: /^Ethereum/ }))
      expect(onColumnFiltersChange).toHaveBeenLastCalledWith({ network: ['Ethereum'] })
      expect(screen.getByText('1–10 de 15')).toBeTruthy()
      expect(columnCells(2).every((td) => td.textContent === 'Ethereum')).toBe(true)
      expect(firstCells().slice(0, 2)).toEqual(['Carteira 01', 'Carteira 04'])

      await user.click(trigger)
      expect(screen.getByRole('menuitem', { name: /^Ethereum \(marcado\)/ })).toBeTruthy()
      await user.click(screen.getByRole('menuitem', { name: /^BSC/ }))
      expect(onColumnFiltersChange).toHaveBeenLastCalledWith({ network: ['Ethereum', 'BSC'] })
      expect(screen.getByText('1–10 de 30')).toBeTruthy()
      expect(firstCells().slice(0, 3)).toEqual(['Carteira 01', 'Carteira 03', 'Carteira 04'])
    })

    it('filtrar volta à página 1', async () => {
      const { user } = renderFiltered()
      await user.click(screen.getByRole('button', { name: 'Página 3' }))
      expect(screen.getByText('21–30 de 45')).toBeTruthy()

      await user.click(screen.getByRole('button', { name: 'Filtrar Rede' }))
      await user.click(screen.getByRole('menuitem', { name: /^Polygon/ }))
      expect(screen.getByText('1–10 de 15')).toBeTruthy()
      expect(firstCells()[0]).toBe('Carteira 02')
    })

    it('"Limpar filtros" da barra só aparece com filtro ativo e limpa', async () => {
      const { user } = renderFiltered()
      expect(toolbarClearFilters()).toHaveLength(0)

      await user.click(screen.getByRole('button', { name: 'Filtrar Rede' }))
      await user.click(screen.getByRole('menuitem', { name: /^BSC/ }))
      expect(screen.getByText('1–10 de 15')).toBeTruthy()

      const [clear] = toolbarClearFilters()
      await user.click(clear as HTMLElement)
      expect(screen.getByText('1–10 de 45')).toBeTruthy()
      expect(toolbarClearFilters()).toHaveLength(0)
    })
  })

  describe('ações em lote', () => {
    it('com seleção, mostra a região com a contagem e passa as linhas de todas as páginas', async () => {
      const onArchive = vi.fn()
      const { user } = renderTable({
        selectable: true,
        bulkActions: (rows) => [{ label: 'Arquivar', onSelect: () => onArchive(rows) }],
      })
      expect(screen.queryByRole('region', { name: 'Ações em lote' })).toBeNull()

      await user.click(screen.getByRole('checkbox', { name: 'Selecionar linha Carteira 01' }))
      await user.click(screen.getByRole('button', { name: 'Página 2' }))
      await user.click(screen.getByRole('checkbox', { name: 'Selecionar linha Carteira 11' }))

      const bar = screen.getByRole('region', { name: 'Ações em lote' })
      expect(within(bar).getByText('2 selecionadas')).toBeTruthy()
      // A contagem fica só na faixa: a barra de ferramentas não a repete.
      expect(screen.getAllByText(/selecionadas?$/)).toHaveLength(1)

      await user.click(within(bar).getByRole('button', { name: 'Arquivar' }))
      expect(onArchive).toHaveBeenCalledExactlyOnceWith([wallets[0], wallets[10]])
    })

    it('"Limpar seleção" desmarca tudo e a faixa some', async () => {
      const onSelectionChange = vi.fn()
      const { user } = renderTable({
        selectable: true,
        onSelectionChange,
        bulkActions: () => [{ label: 'Arquivar', onSelect: () => {} }],
      })
      const checkbox = screen.getByRole('checkbox', {
        name: 'Selecionar linha Carteira 01',
      }) as HTMLInputElement
      await user.click(checkbox)
      const bar = screen.getByRole('region', { name: 'Ações em lote' })
      expect(within(bar).getByText('1 selecionada')).toBeTruthy()

      await user.click(within(bar).getByRole('button', { name: 'Limpar seleção' }))
      expect(onSelectionChange).toHaveBeenLastCalledWith([])
      expect(screen.queryByRole('region', { name: 'Ações em lote' })).toBeNull()
      expect(checkbox.checked).toBe(false)
      expect(screen.queryByText(/selecionada/)).toBeNull()
    })
  })

  describe('linha expansível', () => {
    it('a seta liga aria-expanded e aria-controls ao conteúdo de renderExpanded', async () => {
      const onExpandedChange = vi.fn()
      const { user } = renderTable({
        renderExpanded: (row) => <p>Detalhe da {row.name}</p>,
        onExpandedChange,
      })
      expect(screen.getByRole('columnheader', { name: 'Detalhes' })).toBeTruthy()
      const button = screen.getByRole('button', { name: 'Detalhes de Carteira 02' })
      expect(button.getAttribute('aria-expanded')).toBe('false')
      expect(screen.queryByText('Detalhe da Carteira 02')).toBeNull()

      await user.click(button)
      expect(onExpandedChange).toHaveBeenLastCalledWith(['w02'])
      expect(button.getAttribute('aria-expanded')).toBe('true')
      const controlled = document.getElementById(button.getAttribute('aria-controls') ?? '')
      expect(controlled?.textContent).toBe('Detalhe da Carteira 02')
      // A linha de detalhe ocupa a largura toda: 3 colunas de dados mais a da seta.
      expect(
        within(controlled as HTMLElement)
          .getByRole('cell')
          .getAttribute('colspan')
      ).toBe('4')

      await user.click(button)
      expect(onExpandedChange).toHaveBeenLastCalledWith([])
      expect(button.getAttribute('aria-expanded')).toBe('false')
      expect(screen.queryByText('Detalhe da Carteira 02')).toBeNull()
    })
  })

  describe('exportar CSV', () => {
    const originalCreate = URL.createObjectURL
    const originalRevoke = URL.revokeObjectURL

    afterEach(() => {
      URL.createObjectURL = originalCreate
      URL.revokeObjectURL = originalRevoke
      vi.restoreAllMocks()
    })

    /** Troca o download por espiões: guarda cada Blob e o nome do arquivo de cada clique. */
    function captureDownloads() {
      const blobs: Blob[] = []
      const fileNames: string[] = []
      // O jsdom não implementa createObjectURL.
      URL.createObjectURL = vi.fn((blob: Blob) => {
        blobs.push(blob)
        return 'blob:teste'
      })
      URL.revokeObjectURL = vi.fn()
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
        this: HTMLAnchorElement
      ) {
        fileNames.push(this.download)
      })
      /** Linhas do último CSV, sem o cabeçalho. */
      const lastRows = async () => {
        const text = (await blobs.at(-1)?.text()) ?? ''
        return text.replace(/^﻿/, '').split('\r\n').slice(1)
      }
      return { blobs, fileNames, lastRows }
    }

    it('sem exportable não há botão', () => {
      renderTable()
      expect(screen.queryByRole('button', { name: 'Exportar CSV' })).toBeNull()
    })

    it('exporta as linhas filtradas de todas as páginas, com o nome de exportFileName', async () => {
      const downloads = captureDownloads()
      const { user } = renderTable({
        exportable: true,
        exportFileName: 'carteiras.csv',
        searchable: true,
      })
      await user.click(screen.getByRole('button', { name: 'Exportar CSV' }))
      expect(downloads.fileNames).toEqual(['carteiras.csv'])
      expect(downloads.blobs[0]?.type).toContain('text/csv')
      expect(await downloads.lastRows()).toHaveLength(45)

      await user.type(screen.getByRole('searchbox'), 'Carteira 0')
      await user.click(screen.getByRole('button', { name: 'Exportar CSV' }))
      const rows = await downloads.lastRows()
      expect(rows).toHaveLength(9)
      expect(rows[0]).toBe('"Carteira 01";10;"Polygon"')
      expect(rows.some((line) => line.startsWith('"Carteira 10"'))).toBe(false)
    })

    it('com seleção, exporta só as selecionadas; sem exportFileName, "tabela.csv"', async () => {
      const downloads = captureDownloads()
      const { user } = renderTable({ exportable: true, selectable: true })
      await user.click(screen.getByRole('checkbox', { name: 'Selecionar linha Carteira 03' }))
      await user.click(screen.getByRole('button', { name: 'Exportar CSV' }))
      expect(downloads.fileNames).toEqual(['tabela.csv'])
      expect(await downloads.lastRows()).toEqual(['"Carteira 03";30;"Polygon"'])
    })
  })

  describe('modo servidor (manual)', () => {
    const pageOne = wallets.slice(0, 10).reverse()

    it('mostra o total de rowCount e pagina até a última página do servidor', () => {
      renderTable({ manual: true, rowCount: 45, data: pageOne })
      expect(screen.getByText('1–10 de 45')).toBeTruthy()
      expect(bodyRows()).toHaveLength(10)
      const nav = screen.getByRole('navigation', { name: 'Paginação' })
      expect(within(nav).getByRole('button', { name: 'Página 5' })).toBeTruthy()
      expect(within(nav).queryByRole('button', { name: 'Página 6' })).toBeNull()
    })

    it('ordenar avisa onSortChange sem reordenar data', async () => {
      const onSortChange = vi.fn()
      const { user } = renderTable({ manual: true, rowCount: 45, data: pageOne, onSortChange })
      const header = screen.getByRole('columnheader', { name: /Valor/ })
      await user.click(within(header).getByRole('button', { name: /Valor/ }))
      expect(onSortChange).toHaveBeenCalledExactlyOnceWith({ columnId: 'amount', direction: 'asc' })
      expect(header.getAttribute('aria-sort')).toBe('ascending')
      expect(firstCells()[0]).toBe('Carteira 10')
      expect(firstCells().at(-1)).toBe('Carteira 01')
    })

    it('trocar de página avisa onPageChange sem mudar as linhas', async () => {
      const onPageChange = vi.fn()
      const { user } = renderTable({ manual: true, rowCount: 45, data: pageOne, onPageChange })
      await user.click(screen.getByRole('button', { name: 'Página 2' }))
      expect(onPageChange).toHaveBeenCalledExactlyOnceWith(2)
      expect(firstCells()[0]).toBe('Carteira 10')
      expect(screen.getByText('11–20 de 45')).toBeTruthy()
    })
  })

  describe('primeira coluna fixa', () => {
    it('stickyFirstColumn fixa a primeira coluna de dados no cabeçalho e no corpo', () => {
      renderTable({ stickyFirstColumn: true })
      const headers = screen.getAllByRole('columnheader')
      expect(headers[0]?.className).toMatch(stickyClass)
      expect(headers[0]?.className).toContain('left-0')
      expect(headers[1]?.className).not.toMatch(stickyClass)
      expect(columnCells(0).every((td) => stickyClass.test(td.className))).toBe(true)
      expect(columnCells(1)[0]?.className).not.toMatch(stickyClass)
    })

    it('com checkbox, ele fica em left-0 e a primeira coluna de dados em left-[40px]', () => {
      renderTable({ stickyFirstColumn: true, selectable: true })
      const headers = screen.getAllByRole('columnheader')
      expect(headers[0]?.className).toContain('left-0')
      expect(headers[1]?.className).toContain('left-[40px]')
      const cells = within(bodyRows()[0] as HTMLElement).getAllByRole('cell')
      expect(cells[0]?.className).toContain('left-0')
      expect(cells[1]?.className).toContain('left-[40px]')
    })

    it('sem stickyFirstColumn nenhuma célula é fixa', () => {
      renderTable()
      expect(screen.getAllByRole('columnheader')[0]?.className).not.toMatch(stickyClass)
      expect(columnCells(0)[0]?.className).not.toMatch(stickyClass)
    })
  })

  describe('colunas redimensionáveis', () => {
    const sizedColumns: DataTableColumn<Wallet>[] = columns.map((column) =>
      column.id === 'amount' ? { ...column, width: 120 } : column
    )

    it('a alça é um separador com a largura em aria-valuenow; setas mudam 16px (Shift, 64px)', async () => {
      const onColumnWidthsChange = vi.fn()
      const { user } = renderTable({
        columns: sizedColumns,
        resizableColumns: true,
        onColumnWidthsChange,
      })
      const separator = screen.getByRole('separator', { name: 'Largura da coluna Valor' })
      expect(separator.getAttribute('aria-valuenow')).toBe('120')
      expect(separator.getAttribute('aria-valuemin')).toBe('64')
      expect(separator.getAttribute('aria-orientation')).toBe('vertical')

      separator.focus()
      await user.keyboard('{ArrowRight}')
      expect(onColumnWidthsChange).toHaveBeenLastCalledWith({ amount: 136 })
      expect(separator.getAttribute('aria-valuenow')).toBe('136')

      await user.keyboard('{Shift>}{ArrowLeft}{/Shift}')
      expect(onColumnWidthsChange).toHaveBeenLastCalledWith({ amount: 72 })

      // Não passa da largura mínima.
      await user.keyboard('{ArrowLeft}')
      expect(onColumnWidthsChange).toHaveBeenLastCalledWith({ amount: 64 })
      expect(separator.getAttribute('aria-valuenow')).toBe('64')
    })

    it('clicar na alça não ordena a coluna', async () => {
      // O jsdom não tem setPointerCapture (o setup só cobre has/release), e a alça o chama.
      Element.prototype.setPointerCapture ??= () => {}
      const onSortChange = vi.fn()
      const { user } = renderTable({
        columns: sizedColumns,
        resizableColumns: true,
        onSortChange,
      })
      await user.click(screen.getByRole('separator', { name: 'Largura da coluna Valor' }))
      expect(onSortChange).not.toHaveBeenCalled()
      expect(screen.getByRole('columnheader', { name: /Valor/ }).getAttribute('aria-sort')).toBe(
        'none'
      )
    })

    it('sem resizableColumns não há alça', () => {
      renderTable({ columns: sizedColumns })
      expect(screen.queryByRole('separator')).toBeNull()
    })
  })

  describe('DataTableCopyButton', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('copia o valor e anuncia "Copiado"', async () => {
      // O userEvent.setup() troca o navigator.clipboard por um stub: espione depois dele.
      const user = userEvent.setup()
      const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
      render(<DataTableCopyButton value="0xabc123" label="Copiar hash" />)

      await user.click(screen.getByRole('button', { name: 'Copiar hash' }))
      expect(writeText).toHaveBeenCalledExactlyOnceWith('0xabc123')
      expect(await screen.findByText('Copiado')).toBeTruthy()
    })

    it('anuncia "Não foi possível copiar" quando a área de transferência recusa', async () => {
      const user = userEvent.setup()
      vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('negado'))
      render(<DataTableCopyButton value="0xabc123" label="Copiar hash" />)

      await user.click(screen.getByRole('button', { name: 'Copiar hash' }))
      expect(await screen.findByText('Não foi possível copiar')).toBeTruthy()
      expect(screen.queryByText('Copiado')).toBeNull()
    })
  })

  describe('cards (mobileLayout="cards")', () => {
    /** A lista de cards (a Pagination também é lista, dentro do nav). */
    function cardLists() {
      return screen.queryAllByRole('list').filter((element) => !element.closest('nav'))
    }

    function cardList() {
      const [list] = cardLists()
      if (!list) throw new Error('lista de cards não encontrada')
      return list
    }

    it('cada linha da página vira um card com os rótulos e os valores', () => {
      renderTable({ mobileLayout: 'cards' })
      const cards = within(cardList()).getAllByRole('listitem')
      expect(cards).toHaveLength(10)
      const first = cards[0] as HTMLElement
      expect(
        within(first)
          .getAllByRole('term')
          .map((dt) => dt.textContent)
      ).toEqual(['Nome', 'Valor', 'Rede'])
      expect(
        within(first)
          .getAllByRole('definition')
          .map((dd) => dd.textContent)
      ).toEqual(['Carteira 01', '10', 'Polygon'])
    })

    it('sem mobileLayout="cards" não há lista de cards', () => {
      renderTable()
      expect(cardLists()).toEqual([])
    })

    it('o checkbox do card seleciona a mesma linha da tabela', async () => {
      const onSelectionChange = vi.fn()
      const { user } = renderTable({ mobileLayout: 'cards', selectable: true, onSelectionChange })
      const cardCheckbox = within(cardList()).getByRole('checkbox', {
        name: 'Selecionar Carteira 01',
      }) as HTMLInputElement

      await user.click(cardCheckbox)
      expect(onSelectionChange).toHaveBeenLastCalledWith(['w01'])
      expect(cardCheckbox.checked).toBe(true)
      const rowCheckbox = screen.getByRole('checkbox', {
        name: 'Selecionar linha Carteira 01',
      }) as HTMLInputElement
      expect(rowCheckbox.checked).toBe(true)
    })

    it('"Ações de <linha>" no card abre o Menu e chama a ação com a linha certa', async () => {
      const onEdit = vi.fn()
      const { user } = renderTable({
        mobileLayout: 'cards',
        rowActions: (row) => [{ label: 'Editar', onSelect: () => onEdit(row) }],
      })
      await user.click(within(cardList()).getByRole('button', { name: 'Ações de Carteira 02' }))
      await user.click(screen.getByRole('menuitem', { name: 'Editar' }))
      expect(onEdit).toHaveBeenCalledExactlyOnceWith(wallets[1])
    })

    it('"Detalhes" no card expande com aria-expanded e aria-controls', async () => {
      const { user } = renderTable({
        mobileLayout: 'cards',
        renderExpanded: (row) => <p>Detalhe da {row.name}</p>,
      })
      const card = within(cardList()).getAllByRole('listitem')[0] as HTMLElement
      const button = within(card).getByRole('button', { name: /^Detalhes de / })
      expect(button.getAttribute('aria-expanded')).toBe('false')

      await user.click(button)
      expect(button.getAttribute('aria-expanded')).toBe('true')
      const controlled = document.getElementById(button.getAttribute('aria-controls') ?? '')
      expect(controlled?.hidden).toBe(false)
      expect(within(controlled as HTMLElement).getByText('Detalhe da Carteira 01')).toBeTruthy()
      // O estado é o mesmo da tabela: a seta da linha também abriu.
      expect(
        within(screen.getByRole('table'))
          .getByRole('button', { name: 'Detalhes de Carteira 01' })
          .getAttribute('aria-expanded')
      ).toBe('true')
    })
  })
})
