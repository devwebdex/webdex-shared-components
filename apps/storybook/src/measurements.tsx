import { Button, type ButtonProps } from '@devwebdex/ui'
import { type ReactNode, useEffect, useRef, useState } from 'react'

/**
 * Mede o componente já renderizado e diz, valor a valor, de qual token ele veio.
 *
 * Lê `getComputedStyle` do elemento real em vez de interpretar as classes: o que
 * aparece é o que o navegador aplicou, incluindo o que vier de cascata ou de
 * valor arbitrário. Depois compara cada medida com os tokens do tema, lidos de
 * `document.documentElement`, e marca o que não corresponde a nenhum.
 *
 * É a informação que o time de design precisa para saber o que falta virar
 * Variable no Figma.
 */

/** Tokens procurados, por namespace. A lista acompanha packages/tokens/src. */
const SCALES = {
  spacing: ['1', '2', '3', '4', '5', '6', '7', '8'],
  radius: ['0', '1', '2', '3', '4', '5', 'full'],
  text: ['sm', 'base', 'lg'],
}

export type MeasureRow = {
  property: string
  namespace: keyof typeof SCALES | null
  read: (style: CSSStyleDeclaration, element: HTMLElement) => string
}

/** Medidas de uma caixa com texto e ícone: serve ao Button, ao campo do Select e aos itens da lista. */
export const boxRows: MeasureRow[] = [
  { property: 'padding horizontal', namespace: 'spacing', read: (s) => s.paddingLeft },
  { property: 'padding vertical', namespace: 'spacing', read: (s) => s.paddingTop },
  { property: 'espaço entre ícone e texto', namespace: 'spacing', read: (s) => s.columnGap },
  { property: 'raio', namespace: 'radius', read: (s) => s.borderTopLeftRadius },
  { property: 'tamanho da fonte', namespace: 'text', read: (s) => s.fontSize },
  { property: 'altura de linha', namespace: null, read: (s) => s.lineHeight },
  { property: 'espaçamento de letra', namespace: null, read: (s) => s.letterSpacing },
  {
    property: 'tamanho do ícone',
    namespace: 'spacing',
    read: (_s, element) => {
      // Largura do CSS, não getBoundingClientRect: a lista abre com escala (97% para 100%), e o
      // retângulo medido no meio da transição sai 1px menor.
      const svg = element.querySelector('svg')
      return svg ? getComputedStyle(svg).width : '—'
    },
  },
  {
    // A borda é inset-ring (box-shadow), não `border`: ler borderTopWidth daria 0.
    property: 'borda (inset ring)',
    namespace: null,
    read: (s) =>
      s
        .getPropertyValue('--tw-inset-ring-shadow')
        .match(/inset\s+0\S*\s+0\S*\s+0\S*\s+(\d+px)/)?.[1] ?? '—',
  },
  {
    property: 'altura total',
    namespace: null,
    read: (_s, element) => `${Math.round(element.offsetHeight)}px`,
  },
]

type Measured = { value: string; token: string | null }

export type MeasureColumn = {
  label: string
  /** Desenha o que será medido e entrega o elemento-alvo pelo `ref`. */
  render: (ref: (element: HTMLElement | null) => void) => ReactNode
}

function readTheme(): Map<string, string> {
  const root = getComputedStyle(document.documentElement)
  const map = new Map<string, string>()
  for (const [namespace, names] of Object.entries(SCALES)) {
    for (const name of names) {
      const value = root.getPropertyValue(`--${namespace}-${name}`).trim()
      if (value) map.set(`${namespace}|${normalize(value)}`, `${namespace}.${name}`)
    }
  }
  return map
}

/** rem e px comparáveis: o navegador devolve tudo em px no computed style. */
function normalize(value: string): string {
  const rem = value.match(/^([\d.]+)rem$/)
  if (rem) return `${Number(rem[1]) * 16}px`
  const px = value.match(/^([\d.]+)px$/)
  return px ? `${Number(px[1])}px` : value
}

export function MeasureTable({ columns, rows }: { columns: MeasureColumn[]; rows: MeasureRow[] }) {
  const refs = useRef(new Map<string, HTMLElement>())
  const [data, setData] = useState<Record<string, Measured[]> | null>(null)
  // Mede uma vez, depois de montar: as colunas são recriadas a cada render e, como dependência
  // do efeito, fariam medir e renderizar em laço.
  const input = useRef({ columns, rows })

  useEffect(() => {
    const { columns, rows } = input.current
    let frame = 0
    const measure = () => {
      const theme = readTheme()
      const next: Record<string, Measured[]> = {}
      for (const column of columns) {
        const element = refs.current.get(column.label)
        if (!element) continue
        const style = getComputedStyle(element)
        next[column.label] = rows.map((row) => {
          const value = normalize(row.read(style, element))
          const token = row.namespace ? (theme.get(`${row.namespace}|${value}`) ?? null) : null
          return { value, token }
        })
      }
      setData(next)
    }
    // Medir no próprio efeito pega o layout pela metade: a fonte ainda não carregou e o Radix
    // ainda não pôs o valor escolhido dentro do Select (o campo media 38px em vez de 42px).
    void document.fonts.ready.then(() => {
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(measure)
      })
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div className="flex flex-col gap-6">
      {/* O que é medido fica visível, porque medir o que está escondido mente. */}
      <div className="flex flex-wrap items-start gap-4">
        {columns.map((column) => (
          <div key={column.label}>
            {column.render((element) => {
              if (element) refs.current.set(column.label, element)
            })}
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr>
              <th className="border-b border-line-default px-3 py-2 font-mono text-xs text-text-secondary">
                propriedade
              </th>
              {columns.map((column) => (
                <th
                  key={column.label}
                  className="border-b border-line-default px-3 py-2 font-mono text-xs text-brand"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.property}>
                <td className="border-b border-line-default px-3 py-2 text-text-secondary">
                  {row.property}
                </td>
                {columns.map((column) => {
                  const cell = data?.[column.label]?.[index]
                  return (
                    <td key={column.label} className="border-b border-line-default px-3 py-2">
                      <span className="font-mono">{cell?.value ?? '…'}</span>
                      {cell &&
                        (cell.token ? (
                          <span className="ml-2 font-mono text-xs text-success">{cell.token}</span>
                        ) : row.namespace ? (
                          <span className="ml-2 font-mono text-xs text-warning">sem token</span>
                        ) : (
                          <span className="ml-2 font-mono text-xs text-text-disabled">
                            sem namespace
                          </span>
                        ))}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="max-w-2xl text-sm text-text-secondary">
        <span className="text-warning">sem token</span> é valor que existe no componente mas não
        corresponde a nenhuma Variable — é o que o time de design precisa criar no Figma.{' '}
        <span className="text-text-disabled">sem namespace</span> é propriedade para a qual o design
        system ainda não tem escala nenhuma, como altura de linha e espessura de borda.
      </p>
    </div>
  )
}

const SIZES = ['large', 'medium', 'small'] as const

export function Measurements(props: ButtonProps) {
  const columns: MeasureColumn[] = SIZES.map((size) => ({
    label: size,
    render: (ref) => <Button {...props} size={size} ref={ref} />,
  }))
  return <MeasureTable columns={columns} rows={boxRows} />
}
