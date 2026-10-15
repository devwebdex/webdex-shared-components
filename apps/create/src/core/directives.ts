import { type ChoiceKey, catalog, choiceKeys, type Option, type ProjectOptions } from './catalog.js'

/**
 * Blocos condicionais nos templates, linha a linha. Um arquivo serve todas as combinações, em vez de
 * uma cópia inteira por recurso opcional (fila, web3...), que divergiriam entre si:
 *
 *   //#if queue=bullmq          também `!=` e alternativas: `frontend=next|vite`
 *   ...
 *   //#else
 *   ...
 *   //#endif
 *
 * As linhas de diretiva somem do arquivo gerado; blocos podem ser aninhados.
 */
export function renderDirectives(content: string, options: ProjectOptions, file: string): string {
  if (!content.includes('//#')) return content
  const output: string[] = []
  const stack: { active: boolean; inElse: boolean }[] = []
  for (const line of content.split('\n')) {
    const directive = /^\s*\/\/#(if|else|endif)\b\s*(.*)$/.exec(line)
    if (!directive) {
      if (stack.every((block) => block.active)) output.push(line)
      continue
    }
    const [, kind, condition] = directive as unknown as [string, string, string]
    const block = stack.at(-1)
    if (kind === 'if') {
      stack.push({ active: evaluate(condition.trim(), options, file), inElse: false })
    } else if (!block) {
      throw new Error(`${file}: //#${kind} sem //#if`)
    } else if (kind === 'else') {
      if (block.inElse) throw new Error(`${file}: //#else repetido no mesmo //#if`)
      block.active = !block.active
      block.inElse = true
    } else {
      stack.pop()
    }
  }
  if (stack.length > 0) throw new Error(`${file}: //#if sem //#endif`)
  return output.join('\n')
}

// Chave e valores conferidos contra o catálogo: um erro de digitação (`session=cokie`) seria
// sempre falso e sumiria com o bloco sem aviso.
function evaluate(condition: string, options: ProjectOptions, file: string): boolean {
  const match = /^(\w+)(!=|=)([\w|-]+)$/.exec(condition)
  const key = match?.[1] as ChoiceKey | undefined
  if (!match || !key || !(choiceKeys as readonly string[]).includes(key)) {
    throw new Error(`${file}: condição inválida em //#if: "${condition}"`)
  }
  const values = (match[3] as string).split('|')
  const known = (catalog[key] as Option<string>[]).map((option) => option.value)
  const unknown = values.filter((value) => !known.includes(value))
  if (unknown.length > 0) {
    throw new Error(`${file}: valor desconhecido em //#if ${key}: ${unknown.join(', ')}`)
  }
  const matches = values.includes(options[key])
  return match[2] === '=' ? matches : !matches
}
