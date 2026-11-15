import { render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  DataTable,
  type DataTableColumn,
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
