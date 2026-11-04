import { Button, Card } from '@devwebdex/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
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
    (Story, context) => (
      <div className={context.parameters.largura === 'cheia' ? 'w-full' : 'w-full max-w-md'}>
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

/**
 * Densidade de texto. O card não tem altura fixa: cresce com o conteúdo, e o `p-4` da caixa
 * e o `gap-3` entre as partes continuam os mesmos nos três.
 */
export const Texto: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Card title="Curto">Depósito confirmado.</Card>
      <Card title="Médio">
        Cofre publicado na Polygon em 0x3fA9…c21B. 12 depósitos nas últimas 24 horas, com rendimento
        médio de 4,2% ao ano.
      </Card>
      <Card title="Longo">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
        laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
        voluptate velit esse cillum dolore eu fugiat nulla pariatur.
      </Card>
    </div>
  ),
}

/**
 * Ilustrações embutidas como data URI: as stories não dependem de rede nem de arquivo em
 * `public/`, então funcionam igual no Storybook publicado. As cores são escritas à mão por
 * serem conteúdo de exemplo, não estilo de componente.
 */
const tile = (de: string, para: string, figura: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0" stop-color="${de}"/><stop offset="1" stop-color="${para}"/>` +
      `</linearGradient></defs>` +
      `<rect width="320" height="200" fill="url(#g)"/>${figura}</svg>`
  )}`

const GRAFICO = tile(
  '#ff4d5e',
  '#f5127c',
  '<path d="M0 164 L60 128 L120 142 L180 86 L240 104 L320 54" fill="none" stroke="#fbf5f9" stroke-width="4" opacity=".85"/>'
)
const COFRE = tile(
  '#5ec8f2',
  '#1fc98a',
  '<rect x="112" y="64" width="96" height="76" rx="10" fill="#0c0611" opacity=".35"/><circle cx="160" cy="102" r="18" fill="#fbf5f9" opacity=".8"/>'
)
const REDE = tile(
  '#f0a82e',
  '#ff5c40',
  '<circle cx="160" cy="100" r="40" fill="none" stroke="#fbf5f9" stroke-width="4" opacity=".8"/><circle cx="160" cy="60" r="10" fill="#fbf5f9"/><circle cx="196" cy="120" r="10" fill="#fbf5f9"/><circle cx="124" cy="120" r="10" fill="#fbf5f9"/>'
)

/**
 * Contorno para sangrar a mídia até a borda: desfaz o `p-4` do card e repete o raio no topo.
 *
 * Ele se repete em toda composição abaixo, e é esse o argumento para virar API: as três
 * referências que o design mandou (MDBootstrap, cards de produto, card de tênis) têm a imagem
 * encostada na borda. Enquanto não existir uma área de mídia no componente, cada tela refaz
 * essa conta — e erra o raio quando o Card mudar de `radius.3`.
 */
const MIDIA = '-mt-4 -mx-4 block w-[calc(100%+2rem)] rounded-t-3'

/**
 * Imagem recuada contra imagem sangrada. A primeira é o comportamento natural do `p-4`; a
 * segunda é o contorno.
 */
export const Midia: Story = {
  name: 'Mídia',
  render: () => (
    <div className="flex flex-col gap-4">
      <Card title="Imagem recuada" actions={<Button size="small">Ver cofre</Button>}>
        <img src={GRAFICO} alt="" className="mb-3 w-full rounded-2" />
        Respeita o `p-4` do card. Funciona sem truque, mas destoa das referências.
      </Card>

      <Card title="Imagem na borda">
        <img src={GRAFICO} alt="" className={`${MIDIA} mb-3`} />
        Encosta na borda desfazendo o padding com margem negativa.
      </Card>
    </div>
  ),
}

/** Um card de produto: mídia no topo, dados, e ação ocupando a largura. */
function Produto({
  imagem,
  nome,
  rede,
  valor,
}: {
  imagem: string
  nome: string
  rede: string
  valor: string
}) {
  return (
    <Card
      className="h-full"
      title={nome}
      // `actions` é `justify-end`; um filho `w-full` preenche a linha assim mesmo.
      actions={<Button className="w-full">Depositar</Button>}
    >
      <img src={imagem} alt="" className={`${MIDIA} mb-3`} />
      <div className="text-sm text-text-secondary">{rede}</div>
      <div className="mt-1 font-semibold text-text-primary text-lg">{valor}</div>
    </Card>
  )
}

/**
 * Grade de produtos, o padrão das referências. Três coisas aparecem aqui e nenhuma é bug do
 * Card — são decisões que faltam:
 *
 * 1. **Mídia sangrada** precisa do contorno acima, em toda tela que usar card com imagem.
 * 2. **Ação de largura cheia** sai de um filho `w-full` dentro do `justify-end`. Funciona,
 *    mas o nome da prop promete alinhamento à direita.
 * 3. **Altura igual** vem de `h-full` no card; o rodapé, porém, não encosta no fundo quando
 *    um card tem menos texto, porque não há como empurrar `actions` para baixo.
 */
export const Produtos: Story = {
  parameters: { largura: 'cheia' },
  render: () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Produto imagem={GRAFICO} nome="WebdexVault" rede="Polygon" valor="4,2% ao ano" />
      <Produto imagem={COFRE} nome="Cofre Estável" rede="Polygon · USDC" valor="2,8% ao ano" />
      <Produto imagem={REDE} nome="Pool WDX-ETH" rede="Arbitrum" valor="11,6% ao ano" />
    </div>
  ),
}

/** Card de identificação: faixa no topo, dados e ações. Aqui, a carteira conectada. */
export const Carteira: Story = {
  render: () => (
    <Card
      title="0x3fA9…c21B"
      actions={
        <>
          <Button variant="text" size="small">
            Copiar
          </Button>
          <Button size="small">Desconectar</Button>
        </>
      }
    >
      <img src={REDE} alt="" className={`${MIDIA} mb-3`} />
      <div className="text-sm text-text-secondary">Polygon · conectada por SIWE</div>
      <div className="mt-1 font-semibold text-lg text-text-primary">1.284,50 USDC</div>
    </Card>
  ),
}

/**
 * Mídia à esquerda, como as referências fazem no celular. O Card empilha em coluna, então a
 * linha vem de um wrapper no conteúdo — não do componente.
 */
export const Horizontal: Story = {
  render: () => (
    <Card title="Pool WDX-ETH" actions={<Button size="small">Depositar</Button>}>
      <div className="flex gap-3">
        <img src={COFRE} alt="" className="size-20 shrink-0 rounded-2 object-cover" />
        <div className="min-w-0">
          <div className="text-sm text-text-secondary">Arbitrum · liquidez</div>
          <div className="mt-1 font-semibold text-text-primary">11,6% ao ano</div>
        </div>
      </div>
    </Card>
  ),
}

/** Rótulo acima de cada modelo da galeria, para dizer quais blocos estão em jogo. */
function Modelo({ nome, children }: { nome: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-text-secondary text-xs">{nome}</span>
      {children}
    </div>
  )
}

/**
 * Galeria de modelos: as combinações dos blocos que o Card oferece — `title`, mídia,
 * texto, descrição e `actions`.
 *
 * Duas observações que a galeria torna visíveis:
 *
 * - **Não existe slot de descrição.** Subtítulo e texto secundário saem de marcação dentro
 *   de `children`, com `text-sm text-text-secondary` escrito à mão em cada tela. Se isso se
 *   repetir, vira candidato a prop (`description`) ou a um subcomponente.
 * - **`actions` é sempre à direita.** Botão de largura cheia e par de botões divididos saem
 *   de um filho que se estica, não de uma opção do componente.
 */
export const Modelos: Story = {
  parameters: { largura: 'cheia' },
  render: () => (
    <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <Modelo nome="title">
        <Card title="Só o título" />
      </Modelo>

      <Modelo nome="text">
        <Card>Só o texto, sem header nem ações.</Card>
      </Modelo>

      <Modelo nome="title + text">
        <Card title="WebdexVault">
          Cofre publicado na Polygon. 12 depósitos nas últimas 24 horas.
        </Card>
      </Modelo>

      <Modelo nome="title + description + text">
        <Card title="WebdexVault">
          <div className="text-sm text-text-secondary">Polygon · USDC</div>
          <p className="mt-2">A descrição não tem slot próprio: é marcação dentro de `children`.</p>
        </Card>
      </Modelo>

      <Modelo nome="title + text + button">
        <Card title="Depósito pendente" actions={<Button size="small">Confirmar</Button>}>
          Assine a transação para concluir.
        </Card>
      </Modelo>

      <Modelo nome="title + text + 2 buttons">
        <Card
          title="Encerrar cofre"
          actions={
            <>
              <Button variant="text" size="small">
                Cancelar
              </Button>
              <Button size="small">Encerrar</Button>
            </>
          }
        >
          A ação não pode ser desfeita.
        </Card>
      </Modelo>

      <Modelo nome="image + title + text">
        <Card title="Rendimento">
          <img src={GRAFICO} alt="" className={`${MIDIA} mb-3`} />
          Últimos 30 dias.
        </Card>
      </Modelo>

      <Modelo nome="image + title + description + button">
        <Card title="Pool WDX-ETH" actions={<Button className="w-full">Depositar</Button>}>
          <img src={REDE} alt="" className={`${MIDIA} mb-3`} />
          <div className="text-sm text-text-secondary">Arbitrum</div>
          <div className="mt-1 font-semibold text-lg text-text-primary">11,6% ao ano</div>
        </Card>
      </Modelo>

      <Modelo nome="image + title + text (horizontal)">
        <Card title="Cofre Estável" actions={<Button size="small">Abrir</Button>}>
          <div className="flex gap-3">
            <img src={COFRE} alt="" className="size-16 shrink-0 rounded-2 object-cover" />
            <div className="min-w-0 text-sm">
              Mídia à esquerda vem de um wrapper no conteúdo: o Card empilha em coluna.
            </div>
          </div>
        </Card>
      </Modelo>
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
