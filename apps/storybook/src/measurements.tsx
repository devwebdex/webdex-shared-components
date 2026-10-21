import { Button, type ButtonProps } from '@devwebdex/ui'
import { useEffect, useRef, useState } from 'react'

/**
 * Mede o componente já renderizado e diz, valor a valor, de qual token ele veio.
 *
 * Lê `getComputedStyle` do botão real em vez de interpretar as classes: o que
 * aparece é o que o navegador aplicou, incluindo o que vier de cascata ou de
 * valor arbitrário. Depois compara cada medida com os tokens do tema, lidos de
 * `document.documentElement`, e marca o que não corresponde a nenhum.
 *
 * É a informação que o time de design precisa para saber o que falta virar
 * Variable no Figma.
 */

const SIZES = ['large', 'medium', 'small'] as const
type Size = (typeof SIZES)[number]

/** Tokens procurados, por namespace. A lista acompanha packages/tokens/src. */
const SCALES = {
  spacing: ['1', '2', '3', '4', '5', '6', '7', '8'],
  radius: ['0', '1', '2', '3', '4', '5', 'full'],
  text: ['sm', 'base', 'lg'],
}

type Row = {
  property: string
  namespace: keyof typeof SCALES | null
  read: (style: CSSStyleDeclaration, button: HTMLButtonElement) => string
}

const ROWS: Row[] = [
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
    read: (_s, button) => {
      const svg = button.querySelector('svg')
      return svg ? `${Math.round(svg.getBoundingClientRect().width)}px` : '—'
    },
  },
  {
    // A borda é inset-ring (box-shadow), não `border`: ler borderTopWidth daria 0.
    property: 'borda (inset ring)',
    namespace: null,
    read: (s) => s.getPropertyValue('--tw-inset-ring-shadow').match(/(\d+px)\s*\S*$/)?.[1] ?? '—',
  },
  { property: 'altura total', namespace: null, read: (_s, b) => `${Math.round(b.offsetHeight)}px` },
]

type Measured = { value: string; token: string | null }

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

export function Measurements(props: ButtonProps) {
  const refs = useRef(new Map<Size, HTMLButtonElement>())
  const [data, setData] = useState<Record<Size, Measured[]> | null>(null)

  useEffect(() => {
    const theme = readTheme()
    const next = {} as Record<Size, Measured[]>
    for (const size of SIZES) {
      const button = refs.current.get(size)
      if (!button) continue
      const style = getComputedStyle(button)
      next[size] = ROWS.map((row) => {
        const value = normalize(row.read(style, button))
        const token = row.namespace ? (theme.get(`${row.namespace}|${value}`) ?? null) : null
        return { value, token }
      })
    }
    setData(next)
  }, [])

  return (
    <div className="flex flex-col gap-6">
      {/* Os botões medidos; ficam visíveis porque medir o que está escondido mente. */}
      <div className="flex flex-wrap items-center gap-4">
        {SIZES.map((size) => (
          <Button
            key={size}
            {...props}
            size={size}
            ref={(node) => {
              if (node) refs.current.set(size, node)
            }}
          />
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr>
              <th className="border-b border-line-default px-3 py-2 font-mono text-xs text-text-secondary">
                propriedade
              </th>
              {SIZES.map((size) => (
                <th
                  key={size}
                  className="border-b border-line-default px-3 py-2 font-mono text-xs text-brand"
                >
                  {size}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, index) => (
              <tr key={row.property}>
                <td className="border-b border-line-default px-3 py-2 text-text-secondary">
                  {row.property}
                </td>
                {SIZES.map((size) => {
                  const cell = data?.[size]?.[index]
                  return (
                    <td key={size} className="border-b border-line-default px-3 py-2">
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
