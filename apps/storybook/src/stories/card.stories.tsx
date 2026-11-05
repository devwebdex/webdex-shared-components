import { Button, Card } from '@devwebdex/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  NetworkArbitrumOne,
  NetworkPolygon,
  TokenETH,
  TokenUSDC,
  TokenUSDT,
} from '@web3icons/react'
import type { ReactNode } from 'react'
import { type MeasureColumn, type MeasureRow, MeasureTable } from '../lib/measurements.js'

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
    media: {
      control: false,
      description: 'Mídia sangrada no topo, antes do título. O card desfaz o padding.',
      table: { type: { summary: 'ReactNode' } },
    },
    title: {
      control: { type: 'text' },
      description: 'Header do card, abaixo da mídia.',
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
  // `largura: 'cheia'` libera as stories em grade.
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
          'nasceu com esse nome nas Variables do Figma, e a `shadow.elevation-2` do Button',
          'em repouso.',
          '',
          'O hover **não** é a `-4`: as elevações `paper/*` são pretas, e preto a 20% sobre o',
          'fundo `#0c0611` escurece 2 pontos por canal — não dava para ver. Ele usa a',
          '`shadow.glow-brand`, a mesma sombra na cor da marca, e é token provisório: se o',
          'design quiser outro sinal de hover para superfície, é aqui que muda.',
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

/**
 * Imagem de exemplo para o card que passa uma `<img>` de verdade no slot.
 *
 * É SVG embutido em data URI, e não um arquivo nem uma URL: a story precisa funcionar sem
 * rede e sem asset no repositório.
 *
 * As cores estão em hex aqui, e não em token, porque isto é **conteúdo** — ocupa o lugar de
 * uma foto, que também não teria token. O que é estilo (o raio do topo, a sangria) continua
 * saindo do Card.
 */
const GRAFICO = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 140" preserveAspectRatio="none">
     <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
       <stop offset="0" stop-color="#ff4d5e"/><stop offset="1" stop-color="#f5127c"/>
     </linearGradient></defs>
     <rect width="400" height="140" fill="url(#g)"/>
     <path d="M0 112 L57 94 L114 101 L171 65 L228 77 L285 39 L342 47 L400 22" fill="none"
       stroke="#fff" stroke-opacity=".9" stroke-width="5" stroke-linecap="round"
       stroke-linejoin="round"/>
   </svg>`
)}`

/**
 * Faixa de mídia com o símbolo do ativo, para passar na prop `media`.
 *
 * Os símbolos vêm do `@web3icons/react`, que já era dependência de desenvolvimento do
 * Storybook para as redes do Dropdown — então são os ícones de verdade de USDT, ETH e USDC,
 * não desenho de exemplo. O fundo sai dos tokens (`coral.50` → `brand`), não de hex à mão.
 *
 * Note o que **não** está aqui: margem negativa, largura calculada, raio. Sangrar a mídia é
 * conta do Card, que conhece o próprio `p-4` e o próprio raio; a tela passa só o conteúdo.
 */
function Faixa({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-28 items-center justify-center bg-linear-to-br from-coral-50 to-brand [&_svg]:size-14">
      {children}
    </div>
  )
}

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
        Clicável: passe o mouse para ver o brilho da marca (`glow-brand`) no lugar da `elevation-2`.
      </Card>
      <Card {...args} selected title="Selecionado">
        Escolhido: borda da marca e `surface-elevated`.
      </Card>
      <Card {...args} interactive selected title="Selecionado e clicável">
        Os dois juntos. O brilho é sombra, então não disputa a borda nem a superfície que o
        `selected` já usou: funciona igual nos dois.
      </Card>
    </div>
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
 * Galeria de modelos: todas as combinações dos blocos que o Card oferece — `title`, mídia,
 * texto, descrição e `actions`, inclusive os casos mínimos (só título, só texto).
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
        <Card
          media={
            <Faixa>
              <TokenETH variant="branded" />
            </Faixa>
          }
          title="Rendimento"
        >
          Últimos 30 dias.
        </Card>
      </Modelo>

      <Modelo nome="image + title + description + button">
        <Card
          media={
            <Faixa>
              <TokenETH variant="branded" />
            </Faixa>
          }
          title="Pool WDX-ETH"
          actions={<Button className="w-full">Depositar</Button>}
        >
          <div className="text-sm text-text-secondary">Arbitrum</div>
          <div className="mt-1 font-semibold text-lg text-text-primary">11,6% ao ano</div>
        </Card>
      </Modelo>

      <Modelo nome="image + title">
        <Card
          media={
            <Faixa>
              <TokenUSDC variant="branded" />
            </Faixa>
          }
          title="Reserva em USDC"
        />
      </Modelo>
    </div>
  ),
}

/**
 * Densidade de texto. O card não tem altura fixa: cresce com o conteúdo, e o `p-4` da caixa
 * e o `gap-3` entre as partes continuam os mesmos nos quatro.
 *
 * O hash fecha a lista porque é o caso que o componente trata de propósito: sem espaço para
 * quebrar, ele vazaria da caixa se não fosse o `wrap-break-word`.
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
      <Card title="Sem espaço para quebrar">
        Hash 0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060
      </Card>
    </div>
  ),
}

/**
 * Imagem recuada contra imagem sangrada. A primeira é o comportamento natural do `p-4`, e sai
 * de marcação dentro de `children`; a segunda vai na prop `media`, e quem sangra é o Card.
 *
 * O terceiro card passa uma `<img>` direta em vez de uma faixa. É o caso que o slot resolve
 * com `[&>img]:w-full`: imagem é elemento substituído, não estica com o `align-items: stretch`
 * do flex, e sairia no tamanho intrínseco.
 */
export const Midia: Story = {
  name: 'Mídia',
  render: () => (
    <div className="flex flex-col gap-4">
      <Card title="Mídia recuada" actions={<Button size="small">Ver cofre</Button>}>
        <div className="mb-3 flex h-28 items-center justify-center rounded-2 bg-linear-to-br from-coral-50 to-brand [&_svg]:size-14">
          <TokenUSDT variant="branded" />
        </div>
        Respeita o `p-4` do card. Funciona sem truque, mas destoa das referências.
      </Card>

      <Card
        media={
          <Faixa>
            <TokenUSDT variant="branded" />
          </Faixa>
        }
        title="Mídia na borda"
      >
        Encosta na borda porque o slot desfaz o `p-4` do card e arredonda o topo. A tela passa só a
        faixa, e o título continua sendo a prop `title`.
      </Card>

      <Card media={<img src={GRAFICO} alt="" />} title="Imagem direta no slot">
        Uma `img` no `media` estica para a largura do card e é recortada no raio do topo, sem
        nenhuma classe de quem consome.
      </Card>
    </div>
  ),
}

/** Um card de pool: mídia no topo, dados, e ação ocupando a largura. */
function Pool({
  simbolo,
  nome,
  rede,
  valor,
}: {
  simbolo: ReactNode
  nome: string
  rede: string
  valor: string
}) {
  return (
    <Card
      className="h-full"
      media={<Faixa>{simbolo}</Faixa>}
      title={nome}
      // `actions` é `justify-end`; um filho `w-full` preenche a linha assim mesmo.
      actions={<Button className="w-full">Depositar</Button>}
    >
      <div className="text-sm text-text-secondary">{rede}</div>
      <div className="mt-1 font-semibold text-text-primary text-lg">{valor}</div>
    </Card>
  )
}

/** Título de cada bloco da story de composições. */
function Secao({ nome, children }: { nome: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-mono text-sm text-text-secondary">{nome}</h3>
      {children}
    </section>
  )
}

/**
 * Usos reais, montados a partir das referências que o design mandou. Enquanto a galeria
 * acima mostra os blocos isolados, aqui eles aparecem como telas.
 *
 * Duas lacunas da API aparecem aqui, e nenhuma é bug do Card:
 *
 * 1. **Ação de largura cheia** sai de um filho `w-full` dentro do `justify-end`. Funciona,
 *    mas o nome da prop promete alinhamento à direita.
 * 2. **Altura igual** vem de `h-full` no card; o rodapé, porém, não encosta no fundo quando
 *    um card tem menos texto, porque não há como empurrar `actions` para baixo. Dá para ver
 *    na grade: os botões ficam em alturas diferentes.
 *
 * As outras duas saíram com o slot `media`: a mídia no topo não precisa mais abrir mão da
 * prop `title`, nem que cada tela refaça a margem negativa.
 */
export const Composicoes: Story = {
  name: 'Composições',
  parameters: { largura: 'cheia' },
  render: () => (
    <div className="flex flex-col gap-10">
      <Secao nome="grade de pools">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Pool
            simbolo={<TokenUSDT variant="branded" />}
            nome="Cofre USDT"
            rede="Polygon"
            valor="4,2% ao ano"
          />
          <Pool
            simbolo={<TokenUSDC variant="branded" />}
            nome="Cofre Estável"
            rede="Polygon · USDC"
            valor="2,8% ao ano"
          />
          <Pool
            simbolo={<TokenETH variant="branded" />}
            nome="Pool WDX-ETH"
            rede="Arbitrum"
            valor="11,6% ao ano"
          />
        </div>
      </Secao>

      <Secao nome="carteira conectada">
        <div className="max-w-md">
          <Card
            media={
              <Faixa>
                <NetworkPolygon variant="branded" />
              </Faixa>
            }
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
            <div className="text-sm text-text-secondary">Polygon · conectada por SIWE</div>
            <div className="mt-1 font-semibold text-lg text-text-primary">1.284,50 USDC</div>
          </Card>
        </div>
      </Secao>

      <Secao nome="linha com mídia à esquerda">
        <div className="max-w-md">
          <Card title="Pool WDX-ETH" actions={<Button size="small">Depositar</Button>}>
            {/* O Card empilha em coluna: a linha vem de um wrapper no conteúdo. */}
            <div className="flex items-center gap-3">
              <NetworkArbitrumOne variant="branded" className="size-12 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm text-text-secondary">Arbitrum · liquidez</div>
                <div className="mt-1 font-semibold text-text-primary">11,6% ao ano</div>
              </div>
            </div>
          </Card>
        </div>
      </Secao>
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
