import {
  Button,
  Drawer,
  DrawerClose,
  type DrawerProps,
  Select,
  type SelectOption,
  TextField,
} from '@devwebdex/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'

/**
 * Cancelar e a ação principal. Nas stories, a ação só fecha a gaveta, como se tivesse dado certo:
 * num app, ela faria o trabalho (aplicar, salvar) e fecharia pelo `open`/`onOpenChange`.
 */
function Footer({ action }: { action: ReactNode }) {
  return (
    <>
      <DrawerClose>
        <Button variant="outlined" color="code">
          Cancelar
        </Button>
      </DrawerClose>
      <DrawerClose>
        <Button>{action}</Button>
      </DrawerClose>
    </>
  )
}

const NETWORKS: SelectOption[] = [
  { value: 'polygon', label: 'Polygon' },
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'bnb', label: 'BNB Chain' },
]

/** Formulário secundário: o caso de uso dos filtros de uma tabela de ordens. */
function Filters() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="drawer-rede" className="text-2xs leading-2xs text-text-secondary">
          Rede
        </label>
        <Select id="drawer-rede" options={NETWORKS} placeholder="Todas as redes" />
      </div>
      <TextField label="Par" placeholder="POL/USDT" />
      <TextField label="Valor mínimo (USDT)" inputMode="decimal" placeholder="0,00" />
    </div>
  )
}

const meta = {
  title: 'Componentes/Sobreposição/Drawer',
  component: Drawer,
  args: {
    title: 'Filtros',
    description: 'Refine as ordens mostradas na tabela.',
    side: 'right',
    size: 'md',
    trigger: <Button>Abrir drawer</Button>,
    children: <Filters />,
    footer: <Footer action="Aplicar" />,
  },
  // O docgen não extrai tipo de VariantProps, que é um mapped type: sem declarar `table.type`
  // à mão, a coluna de tipo do painel de controles fica vazia.
  argTypes: {
    side: {
      control: { type: 'inline-radio' },
      options: ['right', 'left'],
      description: 'Lado de onde a gaveta abre.',
      table: { type: { summary: "'right' | 'left'" }, defaultValue: { summary: 'right' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['sm', 'md', 'lg'],
      description: 'Largura máxima: sm 400px, md 560px, lg 800px.',
      table: { type: { summary: "'sm' | 'md' | 'lg'" }, defaultValue: { summary: 'md' } },
    },
    title: {
      control: { type: 'text' },
      description: 'Título. Obrigatório: é o nome que o leitor de tela anuncia.',
      table: { type: { summary: 'ReactNode' } },
    },
    description: {
      control: { type: 'text' },
      description: 'Texto abaixo do título, ligado à gaveta por aria-describedby.',
      table: { type: { summary: 'ReactNode' } },
    },
    hideClose: {
      control: { type: 'boolean' },
      description: 'Esconde o X do header. Esc e o clique fora continuam fechando.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    closeLabel: {
      control: { type: 'text' },
      description: 'Nome acessível do botão de fechar.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'Fechar'" } },
    },
    trigger: { control: false, table: { type: { summary: 'ReactElement' } } },
    footer: { control: false, table: { type: { summary: 'ReactNode' } } },
    children: { control: false, table: { type: { summary: 'ReactNode' } } },
  },
  parameters: {
    docs: {
      description: {
        component: [
          'Painel que abre pela lateral, sobre o conteúdo, com o fundo escurecido: para detalhes',
          'de registro, filtros e formulários secundários. É o Dialog do Radix do Modal, com foco',
          'preso, Esc, clique fora, rolagem da página travada e leitor de tela.',
          '',
          'Header com título, descrição e fechar; conteúdo que rola; footer de ações preso embaixo.',
          'Para um botão do footer que só fecha, envolva-o em `DrawerClose`.',
          '',
          'O fundo escurecido e as partes internas são as do Modal. A referência aprovada não tem',
          'gaveta: o visual é proposta para revisão do design.',
        ].join('\n'),
      },
    },
  },
} satisfies Meta<typeof Drawer>

export default meta
type Story = StoryObj<typeof meta>

/** Clique no botão para abrir. Use os controles para trocar lado, tamanho, título e descrição. */
export const Playground: Story = {}

/** Gavetas que já abrem renderizam em iframe na página de docs, para um fundo não cobrir o outro. */
const iframe = { docs: { story: { inline: false, height: '560px' } } }

const DETAILS: [string, string][] = [
  ['Par', 'POL/USDT'],
  ['Lado', 'Compra'],
  ['Preço', '0,4128 USDT'],
  ['Quantidade', '1.250 POL'],
  ['Taxa', '0,52 USDT'],
  ['Hash', '0x5c50…2060'],
]

/** Aberta, para conferir header, conteúdo e footer sem clicar: o caso dos detalhes de registro. */
export const Estrutura: Story = {
  args: {
    defaultOpen: true,
    title: 'Ordem #4821',
    description: 'Compra executada pelo bot em 16/11, às 14:32.',
    children: (
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3">
        {DETAILS.map(([term, value]) => (
          <div key={term} className="contents">
            <dt className="text-text-secondary">{term}</dt>
            <dd className="text-text-primary">{value}</dd>
          </div>
        ))}
      </dl>
    ),
    footer: (
      <DrawerClose>
        <Button variant="outlined" color="code">
          Fechar
        </Button>
      </DrawerClose>
    ),
  },
  parameters: iframe,
}

/** Os dois lados. Cada botão abre a gaveta do lado indicado. */
export const Lados: Story = {
  render: (args: DrawerProps) => (
    <div className="flex flex-wrap gap-4">
      {(['left', 'right'] as const).map((side) => (
        <Drawer
          key={side}
          {...args}
          side={side}
          title={side === 'left' ? 'Pela esquerda' : 'Pela direita'}
          trigger={
            <Button variant="outlined" color="code">
              Abrir {side === 'left' ? 'à esquerda' : 'à direita'}
            </Button>
          }
        />
      ))}
    </div>
  ),
}

/** Os três tamanhos. Cada botão abre uma gaveta com a largura indicada. */
export const Tamanhos: Story = {
  render: (args: DrawerProps) => (
    <div className="flex flex-wrap gap-4">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Drawer
          key={size}
          {...args}
          size={size}
          title={`Tamanho ${size}`}
          trigger={
            <Button variant="outlined" color="code">
              Abrir {size}
            </Button>
          }
        />
      ))}
    </div>
  ),
}

/** Conteúdo maior que a tela: o header e o footer ficam fixos e só o meio rola. */
export const ConteudoLongo: Story = {
  name: 'Conteúdo longo',
  args: {
    defaultOpen: true,
    title: 'Histórico do bot',
    description: 'As 30 últimas execuções.',
    children: (
      <ol className="flex flex-col gap-3">
        {Array.from({ length: 30 }, (_, index) => index + 1).map((run) => (
          <li key={run}>Execução {run}: compra de 1.250 POL a 0,41 USDT, com taxa de 0,52 USDT.</li>
        ))}
      </ol>
    ),
    footer: <Footer action="Exportar" />,
  },
  parameters: iframe,
}
