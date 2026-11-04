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
 * Contorno para sangrar a mídia até a borda: desfaz o `p-4` do card e repete o raio no topo.
 *
 * Ele se repete em toda composição abaixo, e é esse o argumento para virar API: as três
 * referências que o design mandou (MDBootstrap, cards de produto, card de tênis) têm a imagem
 * encostada na borda. Enquanto não existir uma área de mídia no componente, cada tela refaz
 * essa conta — e erra o raio quando o Card mudar de `radius.3`.
 */
const MIDIA = '-mt-4 -mx-4 mb-3 block w-[calc(100%+2rem)] rounded-t-3'

/**
 * Faixa de mídia com o símbolo do ativo. Os símbolos vêm do `@web3icons/react`, que já era
 * dependência de desenvolvimento do Storybook para as redes do Dropdown — então são os
 * ícones de verdade de USDT, ETH e USDC, não desenho de exemplo.
 *
 * O fundo sai dos tokens (`coral.50` → `brand`), não de hex escrito à mão.
 *
 * **Só funciona como primeiro filho de `children`, num card sem `title`.** O Card renderiza
 * `title` → `children` → `actions` nessa ordem fixa, então com `title` preenchido a faixa
 * nasce abaixo dele e o `-mt-4` deixa de encostar na borda: ele só come o `gap-3` e espreme
 * a imagem contra o título.
 */
function Faixa({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${MIDIA} flex h-28 items-center justify-center bg-linear-to-br from-coral-50 to-brand [&_svg]:size-14`}
    >
      {children}
    </div>
  )
}

/**
 * Título escrito dentro de `children`, para os cards cuja mídia vem antes dele.
 *
 * Repete o estilo que o componente aplica à prop `title` (`font-semibold`, `text-lg`,
 * `text-text-primary`). Essa duplicação é sintoma, não solução: com a ordem dos slots fixa,
 * card com imagem no topo precisa abrir mão da prop e refazer o estilo à mão.
 */
function Titulo({ children }: { children: ReactNode }) {
  return <div className="font-semibold text-lg text-text-primary">{children}</div>
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

      {/* Sem a prop `title`: a mídia vem antes dele, e a ordem dos slots é fixa. */}
      <Modelo nome="image + title + text">
        <Card>
          <Faixa>
            <TokenETH variant="branded" />
          </Faixa>
          <Titulo>Rendimento</Titulo>
          <p className="mt-2">Últimos 30 dias.</p>
        </Card>
      </Modelo>

      <Modelo nome="image + title + description + button">
        <Card actions={<Button className="w-full">Depositar</Button>}>
          <Faixa>
            <TokenETH variant="branded" />
          </Faixa>
          <Titulo>Pool WDX-ETH</Titulo>
          <div className="mt-1 text-sm text-text-secondary">Arbitrum</div>
          <div className="mt-1 font-semibold text-lg text-text-primary">11,6% ao ano</div>
        </Card>
      </Modelo>

      {/* Com `title`, para mostrar o aperto: o -mt-4 da faixa come o gap e encosta no título. */}
      <Modelo nome="title + image ⚠ aperta">
        <Card title="Rendimento">
          <Faixa>
            <TokenETH variant="branded" />
          </Faixa>
          A faixa nasce abaixo do título e o `-mt-4` espreme os dois.
        </Card>
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
 * Imagem recuada contra imagem sangrada. A primeira é o comportamento natural do `p-4`; a
 * segunda é o contorno de `MIDIA`.
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

      <Card>
        <Faixa>
          <TokenUSDT variant="branded" />
        </Faixa>
        <Titulo>Mídia na borda</Titulo>
        <p className="mt-2">
          Encosta na borda desfazendo o padding com margem negativa. O título vem de marcação dentro
          de `children`: com a prop `title`, a faixa nasceria abaixo dele.
        </p>
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
      // Sem `title`: a mídia vem antes dele. O nome entra em `children`, depois da faixa.
      // `actions` é `justify-end`; um filho `w-full` preenche a linha assim mesmo.
      actions={<Button className="w-full">Depositar</Button>}
    >
      <Faixa>{simbolo}</Faixa>
      <Titulo>{nome}</Titulo>
      <div className="mt-1 text-sm text-text-secondary">{rede}</div>
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
 * Quatro lacunas da API aparecem juntas, e nenhuma é bug do Card:
 *
 * 1. **A ordem dos slots é fixa**: `title` → `children` → `actions`. Card com imagem no topo
 *    — o padrão das três referências — precisa abrir mão da prop `title` e reescrever o
 *    título dentro de `children`, duplicando o estilo que o componente já aplica.
 * 2. **Mídia sangrada** precisa do contorno `MIDIA`, em toda tela que usar card com imagem.
 * 3. **Ação de largura cheia** sai de um filho `w-full` dentro do `justify-end`. Funciona,
 *    mas o nome da prop promete alinhamento à direita.
 * 4. **Altura igual** vem de `h-full` no card; o rodapé, porém, não encosta no fundo quando
 *    um card tem menos texto, porque não há como empurrar `actions` para baixo. Dá para ver
 *    na grade: os botões ficam em alturas diferentes.
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
            actions={
              <>
                <Button variant="text" size="small">
                  Copiar
                </Button>
                <Button size="small">Desconectar</Button>
              </>
            }
          >
            <Faixa>
              <NetworkPolygon variant="branded" />
            </Faixa>
            <Titulo>0x3fA9…c21B</Titulo>
            <div className="mt-1 text-sm text-text-secondary">Polygon · conectada por SIWE</div>
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
