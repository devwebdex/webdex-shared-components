/**
 * Os tokens lidos da fonte, `packages/tokens/src`, e não do CSS compilado.
 *
 * O Tailwind 4 só emite a variável de um token que alguma classe usa: enquanto nenhum
 * componente usar `text-6xl`, `--text-6xl` não existe no CSS do Storybook. Uma página de
 * referência que lesse o CSS mostraria só o pedaço da escala que já está em uso.
 *
 * Também não serve montar a classe (`text-${nome}`) e deixar o Tailwind gerar: ele não vê
 * classe montada em tempo de execução. Por isso as páginas de Fundação pintam com o valor do
 * token em `style`, e mostram o nome da classe como texto.
 *
 * O glob pega todo JSON da pasta, então um arquivo de token novo aparece aqui sozinho. Antes
 * disto, a lista de escalas da MeasureTable era escrita à mão, e ficou para trás na primeira
 * vez que a escala mudou.
 */

const files = import.meta.glob<Record<string, unknown>>('../../../../packages/tokens/src/*.json', {
  eager: true,
  import: 'default',
})

export type Token = {
  /** Nome no tema, sem o namespace: `2xs`, `magenta-40`, `brand-hover`. */
  name: string
  /** Valor com as referências (`{color.brand}`) já resolvidas. */
  value: string
  description?: string
}

type Leaf = { $value: unknown; $description?: string }

function isLeaf(node: unknown): node is Leaf {
  return typeof node === 'object' && node !== null && '$value' in node
}

function walk(node: Record<string, unknown>, prefix: string, out: Token[]) {
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith('$')) continue
    const name = prefix ? `${prefix}-${key}` : key
    if (isLeaf(child)) {
      const token: Token = { name, value: String(child.$value) }
      if (child.$description) token.description = child.$description
      out.push(token)
    } else if (typeof child === 'object' && child !== null) {
      walk(child as Record<string, unknown>, name, out)
    }
  }
}

/** `color.json` antes de `color-estado.json`: o arquivo base vem primeiro. */
function stem(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1).replace(/\.json$/, '')
}
const orderedFiles = Object.entries(files)
  .sort(([a], [b]) => stem(a).localeCompare(stem(b)))
  .map(([, file]) => file)

/** Os tokens de um namespace (`text`, `color`, `font-weight`...), na ordem dos arquivos. */
export function tokensOf(namespace: string): Token[] {
  const raw: Token[] = []
  for (const file of orderedFiles) {
    const group = file[namespace]
    if (typeof group === 'object' && group !== null) {
      walk(group as Record<string, unknown>, '', raw)
    }
  }
  // Resolve `{color.brand-soft}` -> o valor do token referido. As referências do DTCG usam
  // ponto; os nomes aqui usam hífen, como no CSS.
  const byName = new Map(raw.map((token) => [token.name, token.value]))
  const resolve = (value: string, depth = 0): string => {
    const reference = value.match(/^\{[^.]+\.(.+)\}$/)
    if (!reference?.[1] || depth > 5) return value
    const target = byName.get(reference[1].replaceAll('.', '-'))
    return target === undefined ? value : resolve(target, depth + 1)
  }
  return raw.map((token) => ({ ...token, value: resolve(token.value) }))
}

/** Só os nomes, para quem precisa comparar medida com escala. */
export function tokenNames(namespace: string): string[] {
  return tokensOf(namespace).map((token) => token.name)
}

/** `0.875rem` -> `14px`. Os tokens vêm em rem, e quem lê o Figma pensa em px. */
export function toPx(value: string): string {
  const rem = value.match(/^(-?[\d.]+)rem$/)
  return rem ? `${Number(rem[1]) * 16}px` : value
}
