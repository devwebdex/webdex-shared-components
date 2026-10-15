import { type ChoiceKey, choiceKeys, type ProjectOptions } from './catalog.js'

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
  const stack: boolean[] = []
  for (const line of content.split('\n')) {
    const directive = /^\s*\/\/#(if|else|endif)\b\s*(.*)$/.exec(line)
    if (!directive) {
      if (stack.every(Boolean)) output.push(line)
      continue
    }
    const [, kind, condition] = directive as unknown as [string, string, string]
    if (kind === 'if') {
      stack.push(evaluate(condition.trim(), options, file))
    } else if (stack.length === 0) {
      throw new Error(`${file}: //#${kind} sem //#if`)
    } else if (kind === 'else') {
      stack.push(!(stack.pop() as boolean))
    } else {
      stack.pop()
    }
  }
  if (stack.length > 0) throw new Error(`${file}: //#if sem //#endif`)
  return output.join('\n')
}

function evaluate(condition: string, options: ProjectOptions, file: string): boolean {
  const match = /^(\w+)(!=|=)([\w|-]+)$/.exec(condition)
  const key = match?.[1] as ChoiceKey | undefined
  if (!match || !key || !(choiceKeys as readonly string[]).includes(key)) {
    throw new Error(`${file}: condição inválida em //#if: "${condition}"`)
  }
  const matches = (match[3] as string).split('|').includes(options[key])
  return match[2] === '=' ? matches : !matches
}
