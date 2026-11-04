import { cn, Pagination, paginationItemClass } from '@devwebdex/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ComponentProps, ReactNode } from 'react'
import { useArgs } from 'storybook/preview-api'
import { type MeasureColumn, type MeasureRow, MeasureTable } from './measurements.js'

const meta = {
  title: 'Componentes/Pagination',
  component: Pagination,
  args: {
    count: 10,
    page: 1,
    siblingCount: 1,
    boundaryCount: 1,
  },
  argTypes: {
    count: {
      control: { type: 'number', min: 0, max: 200 },
      description: 'Total de páginas. Com menos de 1, não renderiza nada.',
      table: { type: { summary: 'number' } },
    },
    page: {
      control: { type: 'number', min: 1 },
      description: 'Página atual, começando em 1. Sem ela, o componente guarda a página sozinho.',
      table: { type: { summary: 'number' } },
    },
    defaultPage: {
      control: false,
      description: 'Página inicial quando ninguém passa `page`.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '1' } },
    },
    onPageChange: {
      control: false,
      description: 'Recebe a página escolhida. Clicar na página atual não chama.',
      table: { type: { summary: '(page: number) => void' } },
    },
    siblingCount: {
      control: { type: 'number', min: 0, max: 3 },
      description: 'Quantas páginas aparecem de cada lado da atual.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '1' } },
    },
    boundaryCount: {
      control: { type: 'number', min: 0, max: 3 },
      description: 'Quantas páginas aparecem em cada ponta.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '1' } },
    },
    'aria-label': {
      control: { type: 'text' },
      description:
        'Nome da navegação para o leitor de tela. Troque quando houver mais de uma na tela.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'Paginação'" } },
    },
  },
  parameters: {
    docs: {
      description: {
        component: [
          'Anterior, próximo e os números de página. Com muitas páginas, aparecem as pontas,',
          'a atual com as vizinhas e reticências no lugar do resto; o total de itens não muda',
          'enquanto a página muda, então os botões não pulam de lugar.',
          '',
          'O design system em HTML não desenha paginação. Os estados vêm do item de navegação',
          'dele, o menu lateral: normal, hover, ativo (a página atual) e disabled (as setas nas',
          'pontas).',
        ].join('\n'),
      },
    },
  },
} satisfies Meta<typeof Pagination>

export default meta
type Story = StoryObj<typeof meta>

/** Clique nas páginas: o controle `page` acompanha. Os outros controles mudam o recorte. */
export const Playground: Story = {
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return <Pagination {...args} onPageChange={(page) => updateArgs({ page })} />
  },
}

// Estados lado a lado

/**
 * Hover e foco são pseudo-classes: só existem na interação. Como na Matriz do Button, esta função
 * tira o prefixo das classes do próprio componente (`hover:bg-surface-code` vira
 * `bg-surface-code`), então nada aqui é redigitado. Ativo e disabled são atributos de verdade.
 */
function forced(state: 'hover' | 'focus-visible') {
  const prefix = `${state}:`
  return paginationItemClass
    .split(/\s+/)
    .filter((utility) => utility.startsWith(prefix))
    .map((utility) => utility.slice(prefix.length))
    .join(' ')
}

const STATES: { label: string; props: ComponentProps<'button'> }[] = [
  { label: 'Normal', props: {} },
  { label: 'Hover', props: { className: forced('hover') } },
  { label: 'Foco', props: { className: forced('focus-visible') } },
  { label: 'Ativo', props: { 'aria-current': 'page' } },
  { label: 'Ativo + hover', props: { 'aria-current': 'page', className: forced('hover') } },
  { label: 'Disabled', props: { disabled: true } },
]

/** Os estados do ticket (ativo, hover e disabled), mais o foco do teclado. */
export const Estados: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-6">
      {STATES.map(({ label, props }) => (
        <figure key={label} className="flex flex-col items-center gap-2">
          <button type="button" {...props} className={cn(paginationItemClass, props.className)}>
            7
          </button>
          <figcaption className="font-mono text-[11px] text-text-secondary">{label}</figcaption>
        </figure>
      ))}
    </div>
  ),
}

// Onde entram as reticências

const POSITIONS = [1, 5, 10, 20]

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <span className="font-mono text-[11px] text-text-secondary">{label}</span>
      {children}
    </>
  )
}

/** A mesma lista de 20 páginas em quatro pontos, e uma lista curta, que não precisa de reticência. */
export const Reticencias: Story = {
  name: 'Reticências',
  render: () => (
    <div className="grid grid-cols-[auto_auto] items-center gap-x-6 gap-y-4">
      {POSITIONS.map((page) => (
        <Row key={page} label={`página ${page} de 20`}>
          <Pagination count={20} defaultPage={page} aria-label={`Exemplo na página ${page}`} />
        </Row>
      ))}
      <Row label="3 de 5">
        <Pagination count={5} defaultPage={3} aria-label="Exemplo com 5 páginas" />
      </Row>
    </div>
  ),
}

// Medidas

const itemRows: MeasureRow[] = [
  { property: 'altura', namespace: 'spacing', read: (_s, element) => `${element.offsetHeight}px` },
  { property: 'largura mínima', namespace: 'spacing', read: (s) => s.minWidth },
  { property: 'padding horizontal', namespace: 'spacing', read: (s) => s.paddingLeft },
  { property: 'raio', namespace: 'radius', read: (s) => s.borderTopLeftRadius },
  { property: 'borda', namespace: null, read: (s) => s.borderTopWidth },
  { property: 'tamanho da fonte', namespace: 'text', read: (s) => s.fontSize },
  // Seta e espaço entre itens são da Pagination, não do item: as três colunas leem da mesma lista,
  // em vez de o número e a página atual aparecerem como "sem token" por não terem seta.
  {
    property: 'tamanho da seta',
    namespace: 'spacing',
    read: (_s, element) => {
      const svg = element.closest('nav')?.querySelector('svg')
      return svg ? getComputedStyle(svg).width : '—'
    },
  },
  {
    property: 'espaço entre itens',
    namespace: 'spacing',
    read: (_s, element) => {
      const list = element.closest('ul')
      return list ? getComputedStyle(list).columnGap : '—'
    },
  },
]

/** Mede a Pagination real: a moldura entrega ao MeasureTable o botão de dentro. */
function itemColumn(label: string, selector: string): MeasureColumn {
  return {
    label,
    render: (ref) => (
      <div ref={(node) => ref(node?.querySelector<HTMLElement>(selector) ?? null)}>
        <Pagination count={3} defaultPage={2} aria-label={`Medida: ${label}`} />
      </div>
    ),
  }
}

export const Medidas: Story = {
  render: () => (
    <MeasureTable
      columns={[
        itemColumn('número', '[aria-label="Página 1"]'),
        itemColumn('página atual', '[aria-current="page"]'),
        itemColumn('seta', '[aria-label="Próxima página"]'),
      ]}
      rows={itemRows}
    />
  ),
}
