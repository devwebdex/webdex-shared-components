import { Alert, Button, Card, InputField, TextField } from '@devwebdex/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { CSSProperties, ReactNode } from 'react'
import { type MeasureColumn, type MeasureRow, MeasureTable } from '../lib/measurements.js'
import { type Token, tokensOf, toPx } from '../lib/tokens.js'

/**
 * A escala tipográfica do design system, como está no Figma: coleção Tipografia, 36 Variables.
 *
 * Tudo aqui sai de `packages/tokens/src`, não de uma lista escrita nesta página: um token novo
 * aparece sozinho. E pinta com o valor do token em `style`, não com a classe -- o Tailwind só
 * gera CSS para classe que alguém escreve por extenso, e uma página que montasse `text-${nome}`
 * sairia sem estilo nenhum. O nome da classe aparece como texto, para copiar.
 */
const meta = {
  title: 'Fundação/Tipografia',
  parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const TAMANHOS = tokensOf('text')
const ENTRELINHAS = tokensOf('leading')
const TRACKING = tokensOf('tracking')
const FAMILIAS = tokensOf('font')
const PESOS = tokensOf('font-weight')

const AMOSTRA = 'Cofre USDT rende 4,2% ao ano na Polygon'

function valor(lista: Token[], nome: string): string {
  return lista.find((token) => token.name === nome)?.value ?? ''
}

function Pagina({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-8">
      <h2 className="font-semibold text-text-primary text-xs">{titulo}</h2>
      {children}
    </div>
  )
}

function Classe({ children }: { children: string }) {
  return <code className="font-mono text-3xs text-brand-soft">{children}</code>
}

function Linha({ nome, medida, children }: { nome: string; medida: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[9rem_6rem_1fr] items-baseline gap-4 border-line-default border-b pb-3">
      <Classe>{nome}</Classe>
      <span className="font-mono text-3xs text-text-secondary">{medida}</span>
      <div className="min-w-0 text-text-primary">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------
// Playground

type PlaygroundArgs = {
  tamanho: string
  entrelinha: string
  peso: string
  familia: string
  tracking: string
  texto: string
}

function opcoes(lista: Token[]) {
  return { control: 'select' as const, options: lista.map((token) => token.name) }
}

/** Combine os tokens nos controles ao lado; a linha de baixo é a classe para copiar. */
export const Playground: StoryObj<PlaygroundArgs> = {
  args: {
    tamanho: 'xs',
    entrelinha: 'xs',
    peso: 'semibold',
    familia: 'sans',
    tracking: 'normal',
    texto: AMOSTRA,
  },
  argTypes: {
    tamanho: opcoes(TAMANHOS),
    entrelinha: opcoes(ENTRELINHAS),
    peso: opcoes(PESOS),
    familia: opcoes(FAMILIAS),
    tracking: opcoes(TRACKING),
    texto: { control: 'text' },
  },
  render: ({ tamanho, entrelinha, peso, familia, tracking, texto }) => {
    const style: CSSProperties = {
      fontSize: valor(TAMANHOS, tamanho),
      lineHeight: valor(ENTRELINHAS, entrelinha),
      fontWeight: valor(PESOS, peso),
      fontFamily: valor(FAMILIAS, familia),
      letterSpacing: valor(TRACKING, tracking),
    }
    const classes = [
      `font-${familia}`,
      `text-${tamanho}`,
      `leading-${entrelinha}`,
      `font-${peso}`,
      `tracking-${tracking}`,
    ].join(' ')
    return (
      <div className="flex flex-col gap-4 p-8">
        <p className="max-w-3xl text-text-primary" style={style}>
          {texto}
        </p>
        <Classe>{classes}</Classe>
      </div>
    )
  },
}

// ---------------------------------------------------------------------------------------------
// As escalas

/** Grupo Size: 12 Variables, de 12 a 58px. Em rem nos tokens, para acompanhar o zoom de fonte. */
export const Tamanhos: Story = {
  render: () => (
    <Pagina titulo="Tamanho">
      {TAMANHOS.map((token) => (
        <Linha key={token.name} nome={`text-${token.name}`} medida={toPx(token.value)}>
          <span style={{ fontSize: token.value, lineHeight: 1.2 }}>{AMOSTRA}</span>
        </Linha>
      ))}
    </Pagina>
  ),
}

/**
 * Grupo Line Height: 11 Variables. A barra tem a altura da linha, para comparar a escala sem
 * misturar com tamanho de fonte.
 */
export const Entrelinhas: Story = {
  render: () => (
    <Pagina titulo="Altura de linha">
      {ENTRELINHAS.map((token) => (
        <Linha key={token.name} nome={`leading-${token.name}`} medida={toPx(token.value)}>
          <div
            className="w-40 rounded-1 bg-brand-soft/10 inset-ring-1 inset-ring-brand-soft/40"
            style={{ height: token.value }}
          />
        </Linha>
      ))}
    </Pagina>
  ),
}

/**
 * Grupo Letter Spacing: 6 Variables, em px absolutos. A diferença entre elas é de décimos de
 * pixel, então a amostra usa um tamanho grande para dar para ver.
 *
 * `tracking-tight` vale 0,1px, MAIS que `tracking-normal`: no Figma ele alarga em vez de
 * apertar. Parece engano de nome lá; o token segue o Figma até o design confirmar.
 */
export const Tracking: Story = {
  render: () => (
    <Pagina titulo="Espaçamento de letra">
      {TRACKING.map((token) => (
        <Linha key={token.name} nome={`tracking-${token.name}`} medida={token.value}>
          <span
            style={{
              fontSize: valor(TAMANHOS, '2xl'),
              letterSpacing: token.value,
              lineHeight: 1.2,
            }}
          >
            WEBDEX COFRE
          </span>
        </Linha>
      ))}
    </Pagina>
  ),
}

/** Grupos Font Family e Weight. No Figma, a família mono se chama `Font Dados`. */
export const FamiliasEPesos: Story = {
  name: 'Famílias e pesos',
  render: () => (
    <Pagina titulo="Famílias e pesos">
      {FAMILIAS.map((token) => (
        <Linha
          key={token.name}
          nome={`font-${token.name}`}
          medida={token.value.split(',')[0] ?? ''}
        >
          <span style={{ fontFamily: token.value, fontSize: valor(TAMANHOS, 'sm') }}>
            {AMOSTRA}
          </span>
        </Linha>
      ))}
      {PESOS.map((token) => (
        <Linha key={token.name} nome={`font-${token.name}`} medida={token.value}>
          <span style={{ fontWeight: token.value, fontSize: valor(TAMANHOS, 'sm') }}>
            {AMOSTRA}
          </span>
        </Linha>
      ))}
    </Pagina>
  ),
}

// ---------------------------------------------------------------------------------------------
// Em uso

const linhasTipograficas: MeasureRow[] = [
  { property: 'família', namespace: 'font', read: (s) => s.fontFamily },
  { property: 'tamanho', namespace: 'text', read: (s) => s.fontSize },
  { property: 'altura de linha', namespace: 'leading', read: (s) => s.lineHeight },
  { property: 'peso', namespace: 'font-weight', read: (s) => s.fontWeight },
  {
    property: 'espaçamento de letra',
    namespace: 'tracking',
    read: (s) => (s.letterSpacing === 'normal' ? '0px' : s.letterSpacing),
  },
]

/** Mede um elemento de dentro do componente, quando ele não repassa o `ref` para lá. */
function dentro(seletor: string, ref: (element: HTMLElement | null) => void) {
  return (element: HTMLElement | null) => ref(element?.querySelector<HTMLElement>(seletor) ?? null)
}

const niveis: MeasureColumn[] = [
  {
    label: 'título — Card',
    render: (ref) => (
      <div ref={dentro('.font-semibold', ref)} className="w-64">
        <Card title="Cofre USDT">Polygon</Card>
      </div>
    ),
  },
  {
    label: 'corpo — Alert',
    render: (ref) => (
      <Alert ref={ref} className="w-64">
        Contrato publicado na Polygon.
      </Alert>
    ),
  },
  {
    label: 'label — Button medium',
    render: (ref) => <Button ref={ref}>Depositar</Button>,
  },
  {
    label: 'label pequeno — Button small',
    render: (ref) => (
      <Button ref={ref} size="small">
        Ver cofre
      </Button>
    ),
  },
  {
    label: 'campo — InputField',
    render: (ref) => <InputField ref={ref} aria-label="Valor" defaultValue="1.250,00" />,
  },
  {
    label: 'legenda — TextField',
    render: (ref) => (
      <div ref={dentro('p', ref)} className="w-64">
        <TextField label="Valor" helperText="Mínimo de 10 USDT." />
      </div>
    ),
  },
]

/**
 * Os níveis que o sistema usa hoje, medidos nos componentes de verdade. Cada célula diz de que
 * token o valor veio, ou "sem token" se não veio de nenhum.
 *
 * O Figma define as escalas, mas não os níveis: não existe Variable "título" ou "legenda". Os
 * nomes das colunas são PROPOSTA, tirada do papel que cada texto cumpre no componente, e
 * precisam ser validados pelo design antes de virar token composto.
 */
export const EmUso: Story = {
  name: 'Em uso',
  render: () => (
    <Pagina titulo="Níveis em uso nos componentes">
      <MeasureTable columns={niveis} rows={linhasTipograficas} />
    </Pagina>
  ),
}
