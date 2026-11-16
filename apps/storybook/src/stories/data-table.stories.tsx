import {
  Button,
  DataTable,
  type DataTableBulkAction,
  type DataTableColumn,
  DataTableCopyButton,
  type DataTableDensity,
  type DataTableFilterOption,
  type DataTableSort,
  type DataTableSortValue,
  InputField,
  type MenuItem,
} from '@devwebdex/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { type ReactNode, useEffect, useState } from 'react'
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
  /** Hash completo (66 caracteres); `hash` é a forma abreviada da célula. */
  fullHash: string
  block: number
  /** Gas consumido, em unidades. */
  gasUsed: number
  /** Carteira de destino. */
  to: string
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
  // Os detalhes (hash completo, bloco, gas, destino) saem de outra semente: assim as colunas
  // continuam com os mesmos valores de antes deles existirem.
  const extra = seeded(7)
  const hexFrom = (next: () => number, length: number) =>
    Array.from({ length }, () => Math.floor(next() * 16).toString(16)).join('')
  const hex = (length: number) => hexFrom(random, length)
  const base = Date.UTC(2026, 10, 14, 18, 0)

  return Array.from({ length: count }, (_, index) => {
    const type = TYPES[Math.floor(random() * TYPES.length)] ?? 'Swap'
    const magnitude = Math.round((random() * 24_000 + 15) * 100) / 100
    const roll = random()
    const head = hex(4)
    const tail = hex(4)
    return {
      id: `tx-${index + 1}`,
      hash: `0x${head}…${tail}`,
      fullHash: `0x${head}${hexFrom(extra, 56)}${tail}`,
      block: 65_420_000 - index * 1_190 - Math.floor(extra() * 900),
      gasUsed: 21_000 + Math.floor(extra() * 180_000),
      to: `0x${hexFrom(extra, 40)}`,
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

// Colunas com os recursos novos: busca, filtro, CSV e largura

const options = (values: readonly string[]): DataTableFilterOption[] =>
  values.map((value) => ({ value, label: value }))

const STATUSES: TxStatus[] = ['Confirmada', 'Pendente', 'Falhou']

/** Por id: cada coluna de COLUMNS ganha o que faz sentido para ela. */
const FEATURES: Record<string, Partial<DataTableColumn<Transaction>>> = {
  // A célula mostra o hash abreviado; a busca e o CSV usam também o completo.
  hash: {
    searchValue: (tx) => `${tx.hash} ${tx.fullHash}`,
    exportValue: (tx) => tx.fullHash,
    width: 150,
  },
  owner: { width: 200 },
  network: { filterOptions: options(NETWORKS), width: 140 },
  type: { filterOptions: options(TYPES), width: 180 },
  // Número no CSV, não o texto formatado com sinal e separador de milhar.
  amount: { searchValue: false, exportValue: (tx) => tx.amount, width: 150 },
  status: { filterOptions: options(STATUSES), width: 140 },
  date: { width: 170 },
}

const FEATURE_COLUMNS: DataTableColumn<Transaction>[] = COLUMNS.map((column) => ({
  ...column,
  ...FEATURES[column.id],
}))

/** Hash abreviado com o botão que copia o completo. */
const COPY_HASH_COLUMN: DataTableColumn<Transaction> = {
  ...(FEATURE_COLUMNS[0] as DataTableColumn<Transaction>),
  cell: (tx) => (
    <span className="inline-flex items-center gap-1">
      <span className="font-mono text-text-primary">{tx.hash}</span>
      <DataTableCopyButton value={tx.fullHash} label={`Copiar hash ${tx.hash}`} />
    </span>
  ),
}

const COPY_COLUMNS: DataTableColumn<Transaction>[] = [COPY_HASH_COLUMN, ...FEATURE_COLUMNS.slice(1)]

function bulkActions(rows: Transaction[]): DataTableBulkAction[] {
  const pending = rows.filter((tx) => tx.status === 'Pendente')
  return [
    {
      label: 'Exportar seleção',
      onSelect: () => action('exportar-selecao')(rows.map((tx) => tx.hash)),
    },
    {
      label: 'Marcar como revisadas',
      onSelect: () => action('marcar-como-revisadas')(rows.map((tx) => tx.hash)),
    },
    {
      label: 'Cancelar pendentes',
      tone: 'danger',
      // Só a pendente ainda pode ser cancelada: sem nenhuma na seleção, a ação não vale.
      disabled: pending.length === 0,
      onSelect: () => action('cancelar-pendentes')(pending.map((tx) => tx.hash)),
    },
  ]
}

const integer = new Intl.NumberFormat('pt-BR')

function Detail({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="font-mono text-3xs font-medium tracking-widest text-text-disabled">{term}</dt>
      <dd className="min-w-0 text-text-primary">{children}</dd>
    </div>
  )
}

function renderDetails(tx: Transaction) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
      <Detail term="Hash">
        <span className="inline-flex max-w-full items-center gap-1">
          <span className="min-w-0 font-mono break-all">{tx.fullHash}</span>
          <DataTableCopyButton value={tx.fullHash} label="Copiar hash completo" />
        </span>
      </Detail>
      <Detail term="Bloco">
        <span className="font-mono tabular-nums">{integer.format(tx.block)}</span>
      </Detail>
      <Detail term="Gas usado">
        <span className="tabular-nums">{integer.format(tx.gasUsed)}</span>
      </Detail>
      <Detail term="Carteira de destino">
        <span className="font-mono break-all">{tx.to}</span>
      </Detail>
    </dl>
  )
}

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
      description:
        'As linhas. A tabela busca, filtra, ordena e pagina; com `manual`, `data` já é a página atual.',
      table: { type: { summary: 'Row[]' } },
    },
    columns: {
      control: false,
      description:
        '`id`, `header`, `accessor` (ordenar e texto padrão), `cell`, `sortable`, `align`, `hideable`, `className`, `searchValue`, `filterOptions`, `filterValue`, `exportValue`, `width`, `minWidth`.',
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
    searchable: {
      control: { type: 'boolean' },
      description: 'Campo de busca na barra, que procura nas colunas visíveis (ver Busca).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    searchPlaceholder: {
      control: { type: 'text' },
      description: 'Placeholder do campo de busca.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'Buscar'" } },
    },
    exportable: {
      control: { type: 'boolean' },
      description:
        'Botão "Exportar CSV" na barra: as linhas filtradas e ordenadas, ou só as selecionadas.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    stickyFirstColumn: {
      control: { type: 'boolean' },
      description: 'A primeira coluna de dados fica parada ao rolar para o lado.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    resizableColumns: {
      control: { type: 'boolean' },
      description: 'Borda do cabeçalho arrastável (e setas com foco nela) para mudar a largura.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    mobileLayout: {
      control: { type: 'inline-radio' },
      options: ['scroll', 'cards'],
      description:
        '`cards`: em contêiner com menos de 40rem, cada linha vira um card (ver Cards no celular).',
      table: { type: { summary: "'scroll' | 'cards'" }, defaultValue: { summary: "'scroll'" } },
    },
    manual: {
      control: { type: 'boolean' },
      description:
        'Dados do servidor: a tabela não busca, não filtra, não ordena nem pagina; só avisa pelos `on*Change` (ver Modo servidor). Ligado aqui, as 45 linhas aparecem numa página só.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    bulkActions: {
      control: false,
      description: 'Ações da faixa que aparece com linhas selecionadas (ver Ações em lote).',
      table: { type: { summary: '(rows: Row[]) => DataTableBulkAction[]' } },
    },
    renderExpanded: {
      control: false,
      description: 'Detalhes da linha; com ele, a primeira coluna ganha a seta que expande.',
      table: { type: { summary: '(row: Row) => ReactNode' } },
    },
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Tabela de dados com ordenação, paginação, seleção, ações por linha, alinhamento,',
          'densidade, colunas escondíveis, busca, filtro por coluna, ações em lote, linha',
          'expansível, exportação CSV, modo servidor, coluna fixa, colunas redimensionáveis,',
          'botão de copiar e cards em contêiner estreito. Todo estado é controlável ou não: prop,',
          '`default*` e callback, como no resto do pacote (ver Controlada).',
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
          'Os recursos novos:',
          '',
          '- **Busca** (`searchable`): campo na barra que procura nas colunas visíveis, sem acento',
          '  e sem caixa; `searchValue` na coluna troca o texto procurado ou a tira da busca.',
          '- **Filtro por coluna** (`filterOptions`): menu no cabeçalho com as opções marcáveis;',
          '  "Limpar filtros" na barra desfaz busca e filtros.',
          '- **Ações em lote** (`bulkActions`): com linhas selecionadas, uma faixa acima da tabela.',
          '- **Linha expansível** (`renderExpanded`): seta na primeira coluna abre os detalhes.',
          '- **Exportar CSV** (`exportable`): as linhas filtradas e ordenadas, ou só as',
          '  selecionadas, com `;` e BOM para o Excel em pt-BR; `exportValue` define o valor.',
          '- **Exportar Excel** (`excelExportable`): .xlsx com o logo e as cores da WEbdEX.',
          '- **Modo servidor** (`manual` + `rowCount`): a tabela só avisa as mudanças.',
          '- **Coluna fixa e redimensionável** (`stickyFirstColumn`, `resizableColumns`, `width`).',
          '- **Copiar** (`DataTableCopyButton`): botão ao lado de hash ou endereço.',
          '- **Cards no celular** (`mobileLayout="cards"`): abaixo de 40rem de contêiner, cada',
          '  linha vira um card.',
          '',
          'Busca feita por fora, passando `data` já filtrado, continua possível (ver Com busca).',
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
    searchable: false,
    exportable: false,
    stickyFirstColumn: false,
    resizableColumns: false,
    mobileLayout: 'scroll',
    manual: false,
    columns: FEATURE_COLUMNS,
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

/**
 * Busca feita por fora: a story filtra `data` e põe o campo em `toolbarStart`. Para a busca da
 * própria tabela, ver Busca.
 */
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

// Recursos novos

/** Digite parte do hash, da carteira ou da rede. Sem acento e sem caixa: "eth" acha Ethereum. */
export const Busca: Story = {
  args: {
    columns: FEATURE_COLUMNS,
    searchable: true,
    searchPlaceholder: 'Buscar hash, carteira ou rede',
  },
}

/**
 * O funil no cabeçalho de Rede, Tipo e Status abre as opções. Começa filtrando só as pendentes:
 * o funil de Status fica na cor da marca, e "Limpar filtros" aparece na barra.
 */
export const FiltroPorColuna: Story = {
  name: 'Filtro por coluna',
  args: {
    columns: FEATURE_COLUMNS,
    defaultColumnFilters: { status: ['Pendente'] },
  },
}

/**
 * Marque linhas: a faixa de ações em lote aparece acima da tabela. "Cancelar pendentes" só vale
 * quando a seleção tem alguma pendente.
 */
export const AcoesEmLote: Story = {
  name: 'Ações em lote',
  args: {
    columns: FEATURE_COLUMNS,
    selectable: true,
    bulkActions,
    defaultSelectedRowIds: ['tx-1', 'tx-2'],
  },
}

/** A seta à esquerda abre os detalhes da transação. A primeira já começa aberta. */
export const LinhaExpansivel: Story = {
  name: 'Linha expansível',
  args: {
    columns: FEATURE_COLUMNS,
    renderExpanded: renderDetails,
    defaultExpandedRowIds: ['tx-1'],
    rowActions,
  },
}

export const ExportarCsv: Story = {
  name: 'Exportar CSV e Excel',
  args: {
    columns: FEATURE_COLUMNS,
    exportable: true,
    exportFileName: 'transacoes.csv',
    excelExportable: true,
    excelFileName: 'transacoes.xlsx',
    searchable: true,
    selectable: true,
  },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <p className="text-2xs text-text-secondary">
        "Exportar CSV" e "Exportar Excel", na barra, baixam as linhas filtradas (todas as páginas,
        na ordem da tabela) ou, com linhas marcadas, só as selecionadas. O Excel sai com a marca:
        faixa com o logo WEbdEX, cabeçalho magenta congelado com filtro, linhas alternadas, valores
        como número e datas em dd/mm/aaaa.
      </p>
      <DataTable {...args} />
    </div>
  ),
}

type ServerRequest = {
  page: number
  pageSize: number
  sort: DataTableSort | null
  globalFilter: string
}

type ServerResponse = { rows: Transaction[]; total: number }

const SERVER_DELAY_MS = 600

/** O "servidor": filtra, ordena e pagina o array e responde depois de um atraso. */
function fetchTransactions(request: ServerRequest): Promise<ServerResponse> {
  const term = request.globalFilter.trim().toLowerCase()
  const matching = term
    ? TRANSACTIONS.filter((tx) =>
        [tx.fullHash, tx.hash, tx.owner, tx.network, tx.type, tx.status].some((value) =>
          value.toLowerCase().includes(term)
        )
      )
    : TRANSACTIONS
  const sorted = request.sort ? sortTransactions(matching, request.sort) : matching
  const start = (request.page - 1) * request.pageSize
  const response = { rows: sorted.slice(start, start + request.pageSize), total: sorted.length }
  return new Promise((resolve) => setTimeout(() => resolve(response), SERVER_DELAY_MS))
}

function sortTransactions(rows: Transaction[], sort: DataTableSort) {
  const accessor = COLUMNS.find((column) => column.id === sort.columnId)?.accessor
  if (!accessor) return rows
  const factor = sort.direction === 'asc' ? 1 : -1
  const key = (value: DataTableSortValue) => (value instanceof Date ? value.getTime() : value)
  return [...rows].sort((a, b) => {
    const left = key(accessor(a)) ?? 0
    const right = key(accessor(b)) ?? 0
    if (typeof left === 'string' && typeof right === 'string') {
      return left.localeCompare(right, 'pt-BR') * factor
    }
    return (left < right ? -1 : left > right ? 1 : 0) * factor
  })
}

/**
 * Página, tamanho, ordenação e busca vivem na story; cada mudança vira um pedido ao "servidor",
 * que responde em ~600ms. Enquanto isso, a tabela mostra o Skeleton.
 */
export const ModoServidor: Story = {
  name: 'Modo servidor',
  render: function Render(args) {
    const [request, setRequest] = useState<ServerRequest>({
      page: 1,
      pageSize: 10,
      sort: null,
      globalFilter: '',
    })
    const [response, setResponse] = useState<ServerResponse>({ rows: [], total: 45 })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      // A resposta de um pedido antigo que chega depois da do novo é descartada.
      let current = true
      setLoading(true)
      void fetchTransactions(request).then((next) => {
        if (!current) return
        setResponse(next)
        setLoading(false)
      })
      return () => {
        current = false
      }
    }, [request])

    // Mudar a busca chama `onGlobalFilterChange` e `onPageChange(1)` no mesmo clique: o estado
    // anterior vem da função, senão uma mudança apagaria a outra.
    const update = (patch: Partial<ServerRequest>) =>
      setRequest((previous) => ({ ...previous, ...patch }))

    return (
      <div className="flex flex-col gap-4">
        <DataTable
          {...args}
          columns={FEATURE_COLUMNS}
          data={response.rows}
          manual
          rowCount={response.total}
          loading={loading}
          searchable
          searchPlaceholder="Buscar hash, carteira ou rede"
          page={request.page}
          onPageChange={(page) => update({ page })}
          pageSize={request.pageSize}
          onPageSizeChange={(pageSize) => update({ pageSize })}
          sort={request.sort}
          onSortChange={(sort) => update({ sort })}
          globalFilter={request.globalFilter}
          onGlobalFilterChange={(globalFilter) => update({ globalFilter })}
        />
        <p className="text-2xs text-text-secondary">Último pedido ao servidor:</p>
        <pre className="rounded-2 bg-surface-code p-3 font-mono text-3xs text-text-secondary">
          {JSON.stringify(request, null, 2)}
        </pre>
      </div>
    )
  },
}

/** O contêiner é estreito de propósito: a tabela rola para o lado e o hash fica parado. */
export const ColunaFixaERedimensionavel: Story = {
  name: 'Coluna fixa e redimensionável',
  args: {
    columns: FEATURE_COLUMNS,
    stickyFirstColumn: true,
    resizableColumns: true,
    selectable: true,
    rowActions,
  },
  render: (args) => (
    <div className="flex max-w-3xl flex-col gap-4">
      <p className="text-2xs text-text-secondary">
        Arraste a borda direita do cabeçalho para mudar a largura da coluna, ou dê foco nela (Tab) e
        use as setas ← e → (com Shift, passos maiores).
      </p>
      <DataTable {...args} />
    </div>
  ),
}

/** O botão ao lado do hash abreviado copia o hash completo. */
export const Copiar: Story = {
  args: { columns: COPY_COLUMNS, rowActions },
}

/**
 * Abaixo de 40rem de contêiner (não de tela), cada linha vira um card. Mova o controle para ver
 * a troca entre cards e tabela.
 */
export const CardsNoCelular: Story = {
  name: 'Cards no celular',
  args: {
    columns: COPY_COLUMNS,
    mobileLayout: 'cards',
    selectable: true,
    rowActions,
    renderExpanded: renderDetails,
    defaultPageSize: 5,
  },
  render: function Render(args) {
    const [width, setWidth] = useState(22)
    return (
      <div className="flex flex-col gap-4">
        <label className="flex max-w-md items-center gap-3 text-2xs text-text-secondary">
          Largura do contêiner
          <input
            type="range"
            min={20}
            max={60}
            step={1}
            value={width}
            onChange={(event) => setWidth(Number(event.target.value))}
            className="flex-1 accent-brand"
          />
          <output className="w-12 font-mono tabular-nums">{width}rem</output>
        </label>
        <div style={{ width: `${width}rem` }} className="max-w-full">
          <DataTable {...args} />
        </div>
      </div>
    )
  },
}

/** Todos os recursos juntos. Em contêiner com menos de 40rem, as linhas viram cards. */
export const Completa: Story = {
  args: {
    columns: COPY_COLUMNS,
    searchable: true,
    searchPlaceholder: 'Buscar hash, carteira ou rede',
    selectable: true,
    bulkActions,
    renderExpanded: renderDetails,
    exportable: true,
    exportFileName: 'transacoes.csv',
    excelExportable: true,
    excelFileName: 'transacoes.xlsx',
    stickyFirstColumn: true,
    resizableColumns: true,
    mobileLayout: 'cards',
    rowActions,
    defaultSort: { columnId: 'date', direction: 'desc' },
  },
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
