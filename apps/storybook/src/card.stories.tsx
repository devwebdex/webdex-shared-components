import { Button, Card } from '@devwebdex/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { type MeasureColumn, type MeasureRow, MeasureTable } from './measurements.js'

const meta = {
  title: 'Componentes/Card',
  component: Card,
  args: {
    title: 'WebdexVault',
    children: 'Cofre publicado na Polygon em 0x3fA9…c21B. 12 depósitos nas últimas 24 horas.',
    interactive: false,
    selected: false,
  },
  // O docgen não extrai tipo de VariantProps, que é um mapped type: sem declarar
  // `table.type` à mão, a coluna de tipo do painel de controles fica vazia.
  argTypes: {
    interactive: {
      control: { type: 'boolean' },
      description: 'O card é clicável: cursor, elevação no hover e anel de foco.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    selected: {
      control: { type: 'boolean' },
      description: 'Escolhido numa lista: borda da marca e superfície rosada.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    title: {
      control: { type: 'text' },
      description: 'Header do card.',
      table: { type: { summary: 'ReactNode' } },
    },
    children: {
      control: { type: 'text' },
      description: 'Conteúdo do card.',
      table: { type: { summary: 'ReactNode' } },
    },
    actions: {
      control: false,
      description: 'Rodapé de ações, alinhado à direita.',
      table: { type: { summary: 'ReactNode' } },
    },
  },
  // O Card ocupa a largura de quem o contém; a moldura dá uma largura de leitura.
  decorators: [
    (Story) => (
      <div className="w-full max-w-md">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: [
          'Superfície que agrupa **header**, **conteúdo** e **ações**.',
          '',
          'O Kit de interface (`docs/ui/webdex-design-system.html`) não desenha um Card. O',
          'desenho sai dos tokens que já existiam sem consumidor: `color.surface-card`, que',
          'nasceu com esse nome nas Variables do Figma, e as elevações do Button',
          '(`shadow.elevation-2` em repouso, `-4` no hover).',
          '',
          '`hover` é modificador de classe e só aparece com `interactive`; `selected` é prop,',
          'porque é estado da aplicação. A regra está em `docs/ui/criar-componente.md`.',
          '',
          '**Lacuna:** `interactive` dá a afordância visual e o foco, não a semântica. Card',
          'inteiro clicável precisa de `role`, `tabIndex` e ativação por teclado. Até lá, a',
          'ação real vive num Button dentro de `actions`.',
        ].join('\n'),
      },
    },
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

/** Use os controles ao lado para trocar os estados e o texto. */
export const Playground: Story = {}

/**
 * Os três estados do SCRUM-168. `hover` não aparece parado: passe o mouse no card do meio,
 * que é o único `interactive` — é essa a razão de ele existir como prop.
 */
export const Estados: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <Card {...args} title="Default">
        Em repouso: `surface-card`, borda `line-default` e `elevation-2`.
      </Card>
      <Card {...args} interactive title="Hover">
        Clicável: passe o mouse para ver subir de `elevation-2` para `elevation-4`.
      </Card>
      <Card {...args} selected title="Selecionado">
        Escolhido: borda da marca e `surface-elevated`.
      </Card>
      <Card {...args} interactive selected title="Selecionado e clicável">
        Os dois juntos: a borda da marca continua, e o hover ainda levanta.
      </Card>
    </div>
  ),
}

/**
 * As três partes são independentes: o card funciona só com conteúdo, só com header, ou com
 * os três. O hash sem espaço quebra em vez de vazar da caixa.
 */
export const Conteudo: Story = {
  name: 'Conteúdo',
  render: () => (
    <div className="flex flex-col gap-4">
      <Card title="Só header e conteúdo">
        O rodapé de ações só aparece quando `actions` é passado.
      </Card>
      <Card>Só conteúdo: sem header, sem ações.</Card>
      <Card
        title="Com ações"
        actions={
          <>
            <Button variant="text" size="small">
              Cancelar
            </Button>
            <Button size="small">Publicar</Button>
          </>
        }
      >
        As ações ficam à direita, no rodapé.
      </Card>
      <Card title="Transação enviada">
        Hash 0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060
      </Card>
    </div>
  ),
}

/** Medido no elemento renderizado, não no que a classe promete. */
const cardRows: MeasureRow[] = [
  { property: 'padding horizontal', namespace: 'spacing', read: (s) => s.paddingLeft },
  { property: 'padding vertical', namespace: 'spacing', read: (s) => s.paddingTop },
  { property: 'espaço entre as partes', namespace: 'spacing', read: (s) => s.rowGap },
  { property: 'raio', namespace: 'radius', read: (s) => s.borderTopLeftRadius },
  { property: 'borda', namespace: null, read: (s) => s.borderTopWidth },
  { property: 'tamanho da fonte', namespace: 'text', read: (s) => s.fontSize },
  { property: 'elevação', namespace: null, read: (s) => s.boxShadow.split(',')[0] ?? '—' },
]

export const Medidas: Story = {
  render: () => {
    const columns: MeasureColumn[] = [
      {
        label: 'default',
        render: (ref) => (
          <Card ref={ref} title="Título">
            Conteúdo
          </Card>
        ),
      },
      {
        label: 'selecionado',
        render: (ref) => (
          <Card ref={ref} selected title="Título">
            Conteúdo
          </Card>
        ),
      },
    ]
    return <MeasureTable columns={columns} rows={cardRows} />
  },
}
