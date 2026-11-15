import {
  Button,
  DataTable,
  type DataTableColumn,
  type DataTableDensity,
  type DataTableSort,
  InputField,
  type MenuItem,
} from '@devwebdex/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { type ReactNode, useState } from 'react'
import { action } from 'storybook/actions'
import { useArgs } from 'storybook/preview-api'
import { type MeasureColumn, type MeasureRow, MeasureTable } from '../lib/measurements.js'

// Dados de exemplo: transações on-chain de carteiras WEbdEX

type Network = 'Polygon' | 'Ethereum' | 'Arbitrum' | 'Base' | 'BNB Chain'
type TxType = 'Depósito' | 'Saque' | 'Swap' | 'Taxa do protocolo'
type TxStatus = 'Confirmada' | 'Pendente' | 'Falhou'

type Transaction = {
  id: string
  hash: string
  owner: string
  network: Network
  type: TxType
  /** Em USDC; negativo é saída da carteira. */
  amount: number
  status: TxStatus
  date: Date
}

const NETWORKS: Network[] = ['Polygon', 'Ethereum', 'Arbitrum', 'Base', 'BNB Chain']
const TYPES: TxType[] = ['Depósito', 'Saque', 'Swap', 'Taxa do protocolo']
const OWNERS = [
  'Ana Souza',
  'Bruno Lima',
  'Carla Mendes',
  'Diego Rocha',
  'Elisa Prado',
  'Felipe Nunes',
  'Gabriela Reis',
  'Heitor Alves',
]

/** Gerador congruencial com semente fixa: as mesmas linhas em toda carga da story. */
function seeded(seed: number) {
  let state = seed
  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648
    return state / 2_147_483_648
  }
}

function makeTransactions(count: number): Transaction[] {
  const random = seeded(42)
  const hex = (length: number) =>
    Array.from({ length }, () => Math.floor(random() * 16).toString(16)).join('')
  const base = Date.UTC(2026, 10, 14, 18, 0)

  return Array.from({ length: count }, (_, index) => {
    const type = TYPES[Math.floor(random() * TYPES.length)] ?? 'Swap'
    const magnitude = Math.round((random() * 24_000 + 15) * 100) / 100
    const roll = random()
    return {
      id: `tx-${index + 1}`,
      hash: `0x${hex(4)}…${hex(4)}`,
      owner: OWNERS[Math.floor(random() * OWNERS.length)] ?? 'Ana Souza',
      network: NETWORKS[Math.floor(random() * NETWORKS.length)] ?? 'Polygon',
      type,
      amount: type === 'Saque' || type === 'Taxa do protocolo' ? -magnitude : magnitude,
      status: roll < 0.7 ? 'Confirmada' : roll < 0.88 ? 'Pendente' : 'Falhou',
      date: new Date(base - index * 7 * 3_600_000 - Math.floor(random() * 3_600_000)),
    }
  })
}

const TRANSACTIONS = makeTransactions(45)

const usdc = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
// UTC fixo: a data não muda com o fuso de quem abre a story.
const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'UTC',
})

const statusClass: Record<TxStatus, string> = {
  Confirmada: 'bg-success-bg text-success',
  Pendente: 'bg-warning-bg text-warning',
  Falhou: 'bg-danger-bg text-danger',
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
}

const COLUMNS: DataTableColumn<Transaction>[] = [
  {
    id: 'hash',
    header: 'Hash',
    accessor: (tx) => tx.hash,
    cell: (tx) => <span className="font-mono text-text-primary">{tx.hash}</span>,
    hideable: false,
  },
  {
    id: 'owner',
    header: 'Carteira',
    accessor: (tx) => tx.owner,
    sortable: true,
    cell: (tx) => (
      <span className="inline-flex items-center gap-2">
        <span
          aria-hidden="true"
          className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-focus font-mono text-3xs text-brand"
        >
          {initials(tx.owner)}
        </span>
        {tx.owner}
      </span>
    ),
  },
  { id: 'network', header: 'Rede', accessor: (tx) => tx.network, sortable: true },
  { id: 'type', header: 'Tipo', accessor: (tx) => tx.type, sortable: true },
  {
    id: 'amount',
    header: 'Valor (USDC)',
    accessor: (tx) => tx.amount,
    sortable: true,
    align: 'end',
    cell: (tx) => (
      <span className={`tabular-nums ${tx.amount < 0 ? '' : 'text-text-primary'}`}>
        {tx.amount < 0 ? '−' : '+'}
        {usdc.format(Math.abs(tx.amount))}
      </span>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    accessor: (tx) => tx.status,
    sortable: true,
    cell: (tx) => (
      <span
        className={`inline-flex rounded-full px-2 font-medium whitespace-nowrap ${statusClass[tx.status]}`}
      >
        {tx.status}
      </span>
    ),
  },
  {
    id: 'date',
    header: 'Data (UTC)',
    accessor: (tx) => tx.date,
    sortable: true,
    cell: (tx) => (
      <span className="tabular-nums whitespace-nowrap">{dateFormat.format(tx.date)}</span>
    ),
  },
]

function rowActions(tx: Transaction): MenuItem[] {
  return [
    { label: 'Ver no explorador', onSelect: () => action('ver-no-explorador')(tx.hash) },
    { label: 'Copiar hash', onSelect: () => action('copiar-hash')(tx.hash) },
    { label: 'Repetir transação', disabled: true },
    'separator',
    {
      label: 'Cancelar',
      tone: 'danger',
      // Só a pendente ainda pode ser cancelada.
      disabled: tx.status !== 'Pendente',
      onSelect: () => action('cancelar')(tx.hash),
    },
  ]
}

const getRowId = (tx: Transaction) => tx.id

/** A tabela é larga: ocupa a largura do canvas em vez de encolher no centro do decorator. */
function Wide({ children }: { children: ReactNode }) {
  return <div className="w-full">{children}</div>
}

const meta = {
  title: 'Componentes/DataTable',
  component: DataTable<Transaction>,
  args: {
    data: TRANSACTIONS,
    columns: COLUMNS,
    getRowId,
    caption: 'Transações recentes',
  },
  // O docgen não extrai os tipos de um componente genérico: sem `table.type` à mão, a coluna de
  // tipo do painel de controles fica vazia.
  argTypes: {
    data: {
      control: false,
      description: 'As linhas. A tabela ordena e pagina; filtrar é de quem usa (ver ComBusca).',
      table: { type: { summary: 'Row[]' } },
    },
    columns: {
      control: false,
      description:
        '`id`, `header`, `accessor` (ordenar e texto padrão), `cell`, `sortable`, `align`, `hideable`, `className`.',
      table: { type: { summary: 'DataTableColumn<Row>[]' } },
    },
    getRowId: {
      control: false,
      description: 'Id estável da linha: chave da seleção e do React.',
      table: { type: { summary: '(row: Row) => string' } },
    },
    caption: {
      control: { type: 'text' },
      description: 'Nome da tabela para leitor de tela; vira o `<caption>`.',
      table: { type: { summary: 'string' } },
    },
    showCaption: {
      control: { type: 'boolean' },
      description: 'Mostra o `caption` acima da tabela.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    density: {
      control: { type: 'inline-radio' },
      options: ['comfortable', 'compact'],
      description: 'Altura das linhas. O botão de densidade da barra também troca.',
      table: {
        type: { summary: "'comfortable' | 'compact'" },
        defaultValue: { summary: "'comfortable'" },
      },
    },
    align: {
      control: { type: 'inline-radio' },
      options: ['start', 'center', 'end'],
      description:
        'Alinhamento do texto das colunas sem `align` próprio. O botão de alinhamento da barra avança start → center → end.',
      table: {
        type: { summary: "'start' | 'center' | 'end'" },
        defaultValue: { summary: "'start'" },
      },
    },
    striped: {
      control: { type: 'boolean' },
      description: 'Linhas pares com fundo levemente diferente.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    stickyHeader: {
      control: { type: 'boolean' },
      description: 'Cabeçalho fixo ao rolar; use com `maxHeight`.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    maxHeight: {
      control: { type: 'text' },
      description: 'Altura máxima da área rolável (valor CSS).',
      table: { type: { summary: 'string' } },
    },
    selectable: {
      control: { type: 'boolean' },
      description:
        'Checkbox por linha e "selecionar a página" no cabeçalho; a barra mostra a contagem.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    toolbar: {
      control: { type: 'boolean' },
      description: 'Barra com alinhamento, densidade e colunas visíveis.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    pagination: {
      control: { type: 'boolean' },
      description: 'Resumo, linhas por página e Pagination no rodapé.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Linhas de Skeleton no lugar dos dados, com `aria-busy` na tabela.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    rowActions: {
      control: false,
      description: 'Itens do Menu de cada linha; com eles, a última coluna ganha o botão "…".',
      table: { type: { summary: '(row: Row) => MenuItem[]' } },
    },
    toolbarStart: {
      control: false,
      description: 'Conteúdo no começo da barra (ex.: um campo de busca).',
      table: { type: { summary: 'ReactNode' } },
    },
    emptyState: {
      control: false,
      description: 'Conteúdo sem linhas.',
      table: {
        type: { summary: 'ReactNode' },
        defaultValue: { summary: "'Nenhum registro encontrado.'" },
      },
    },
    pageSizeOptions: {
      control: false,
      description: 'Opções de linhas por página. Vazio esconde o seletor.',
      table: { type: { summary: 'number[]' }, defaultValue: { summary: '[10, 20, 50]' } },
    },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Tabela de dados com ordenação, paginação, seleção, ações por linha, alinhamento,',
          'densidade e colunas escondíveis. Todo estado é controlável ou não: prop, `default*`',
          'e callback, como no resto do pacote (ver Controlada).',
          '',
          'O que o produto pediu:',
          '',
          '- **Ações "…"**: com `rowActions`, cada linha ganha na última coluna um botão que abre',
          '  o Menu do design system (ações perigosas com `tone: "danger"`).',
          '- **Botão de orientação**: um clique no botão de alinhamento da barra muda o texto das',
          '  linhas de esquerda para centro e para direita. Colunas com `align` próprio (valores',
          '  em `end`) não mudam.',
          '- **Paginação integrada**: o rodapé mostra "1–10 de 45", as linhas por página e a',
          '  Pagination; com `pagination={false}` a tabela mostra tudo.',
          '- **Hover que destaca a linha**: fundo `surface-elevated` e a barra da marca de 2px à',
          '  esquerda, a mesma do item em destaque da lista.',
          '',
          'A tabela ordena e pagina, mas não filtra: a busca é de quem usa, passando `data`',
          'já filtrado (ver ComBusca).',
        ].join('\n'),
      },
    },
  },
  decorators: [
    (Story) => (
      <Wide>
        <Story />
      </Wide>
    ),
  ],
} satisfies Meta<typeof DataTable<Transaction>>

export default meta
type Story = StoryObj<typeof meta>

/** Densidade e alinhamento acompanham os botões da barra: os controles ao lado mudam junto. */
export const Playground: Story = {
  args: {
    density: 'comfortable',
    align: 'start',
    striped: false,
    stickyHeader: false,
    selectable: false,
    toolbar: true,
    pagination: true,
    loading: false,
    rowActions,
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return (
      <DataTable
        {...args}
        onDensityChange={(density: DataTableDensity) => updateArgs({ density })}
        onAlignChange={(align) => updateArgs({ align })}
      />
    )
  },
}

/** O botão "…" de cada linha abre as ações. "Cancelar" só vale para transação pendente. */
export const ComAcoes: Story = {
  name: 'Com ações',
  args: { rowActions },
}

/** Clique no cabeçalho: ascendente, descendente e sem ordem. Começa pelas mais recentes. */
export const Ordenacao: Story = {
  name: 'Ordenação',
  args: { defaultSort: { columnId: 'date', direction: 'desc' } },
}

/** Marque linhas: a barra mostra quantas estão selecionadas, mesmo trocando de página. */
export const Selecao: Story = {
  name: 'Seleção',
  args: { selectable: true, defaultSelectedRowIds: ['tx-2', 'tx-5'], rowActions },
}

/**
 * Clique no botão de alinhamento da barra (o primeiro ícone à direita): o texto das linhas
 * passa para o centro e depois para a direita. O valor em USDC tem `align: 'end'` e não muda.
 */
export const Alinhamento: Story = {
  render: (args) => (
    <div className="flex flex-col gap-6">
      <p className="text-2xs text-text-secondary">
        Clique no botão de alinhamento da barra para mudar a orientação do texto das linhas.
      </p>
      <DataTable {...args} defaultPageSize={5} />
      <p className="text-2xs text-text-secondary">
        Começando ao centro: <code className="font-mono">defaultAlign="center"</code>.
      </p>
      <DataTable
        {...args}
        caption="Transações ao centro"
        defaultAlign="center"
        defaultPageSize={5}
      />
    </div>
  ),
}

/** Linhas baixas, para listas longas. O botão de densidade da barra volta ao confortável. */
export const Compacta: Story = {
  args: { defaultDensity: 'compact', defaultPageSize: 20 },
}

export const Listrada: Story = {
  args: { striped: true },
}

/** Role a área: o cabeçalho fica no topo. Sem paginação, com as 45 linhas. */
export const CabecalhoFixo: Story = {
  name: 'Cabeçalho fixo',
  args: { stickyHeader: true, maxHeight: '20rem', pagination: false },
}

/** A busca é de quem usa: a story filtra `data` e a tabela recebe só o que passou no filtro. */
export const ComBusca: Story = {
  name: 'Com busca',
  render: function Render(args) {
    const [query, setQuery] = useState('')
    const term = query.trim().toLowerCase()
    const data = term
      ? TRANSACTIONS.filter((tx) =>
          [tx.hash, tx.owner, tx.network, tx.type, tx.status].some((value) =>
            value.toLowerCase().includes(term)
          )
        )
      : TRANSACTIONS
    return (
      <DataTable
        {...args}
        data={data}
        toolbarStart={
          <InputField
            type="search"
            aria-label="Buscar transações"
            placeholder="Buscar por hash, carteira, rede, tipo ou status"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="max-w-80"
          />
        }
      />
    )
  },
}

export const Carregando: Story = {
  args: { loading: true, rowActions, selectable: true },
}

export const Vazia: Story = {
  args: {
    data: [],
    emptyState: (
      <div className="flex flex-col items-center gap-3">
        <p>Esta carteira ainda não tem transações.</p>
        <Button size="small" onClick={() => action('fazer-deposito')()}>
          Fazer o primeiro depósito
        </Button>
      </div>
    ),
  },
}

/** Rede e tipo começam escondidas; o menu de colunas da barra (último ícone) mostra de novo. */
export const ColunasOcultas: Story = {
  name: 'Colunas ocultas',
  args: { defaultHiddenColumnIds: ['network', 'type'] },
}

/** Página, ordenação e seleção vivem na story; o estado aparece em JSON abaixo da tabela. */
export const Controlada: Story = {
  render: function Render(args) {
    const [page, setPage] = useState(1)
    const [sort, setSort] = useState<DataTableSort | null>({
      columnId: 'amount',
      direction: 'desc',
    })
    const [selectedRowIds, setSelectedRowIds] = useState<string[]>([])
    return (
      <div className="flex flex-col gap-4">
        <DataTable
          {...args}
          selectable
          page={page}
          onPageChange={setPage}
          sort={sort}
          onSortChange={setSort}
          selectedRowIds={selectedRowIds}
          onSelectionChange={setSelectedRowIds}
        />
        <pre className="rounded-2 bg-surface-code p-3 font-mono text-3xs text-text-secondary">
          {JSON.stringify({ page, sort, selectedRowIds }, null, 2)}
        </pre>
      </div>
    )
  },
}

/** Só a tabela: sem barra e sem rodapé, para listas curtas dentro de um card. */
export const SemBarraNemPaginacao: Story = {
  name: 'Sem barra nem paginação',
  args: { data: TRANSACTIONS.slice(0, 4), toolbar: false, pagination: false },
}

// Medidas

const cellRows: MeasureRow[] = [
  { property: 'altura', namespace: null, read: (_s, element) => `${element.offsetHeight}px` },
  { property: 'padding horizontal', namespace: 'spacing', read: (s) => s.paddingLeft },
  { property: 'padding vertical', namespace: 'spacing', read: (s) => s.paddingTop },
  { property: 'tamanho da fonte', namespace: 'text', read: (s) => s.fontSize },
  { property: 'altura de linha', namespace: 'leading', read: (s) => s.lineHeight },
  {
    property: 'espaçamento de letra',
    namespace: 'tracking',
    read: (s) => (s.letterSpacing === 'normal' ? '0px' : s.letterSpacing),
  },
]

const MEASURE_COLUMNS = COLUMNS.filter((column) => ['hash', 'network'].includes(column.id))

/** Mede a DataTable real: a moldura entrega ao MeasureTable a célula de dentro. */
function cellColumn(label: string, selector: string, density: DataTableDensity): MeasureColumn {
  return {
    label,
    render: (ref) => (
      <div ref={(node) => ref(node?.querySelector<HTMLElement>(selector) ?? null)}>
        <DataTable
          data={TRANSACTIONS.slice(0, 2)}
          columns={MEASURE_COLUMNS}
          getRowId={getRowId}
          caption={`Medida: ${label}`}
          defaultDensity={density}
          toolbar={false}
          pagination={false}
        />
      </div>
    ),
  }
}

/** Cabeçalho e célula do corpo nas duas densidades. O cabeçalho não muda com a densidade. */
export const Medidas: Story = {
  render: () => (
    <MeasureTable
      columns={[
        cellColumn('cabeçalho confortável', 'thead th', 'comfortable'),
        cellColumn('célula confortável', 'tbody td', 'comfortable'),
        cellColumn('cabeçalho compacta', 'thead th', 'compact'),
        cellColumn('célula compacta', 'tbody td', 'compact'),
      ]}
      rows={cellRows}
    />
  ),
}
