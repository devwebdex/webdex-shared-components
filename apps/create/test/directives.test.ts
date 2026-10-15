import { describe, expect, test } from 'bun:test'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { defaults, type ProjectOptions } from '../src/core/catalog.js'
import { renderDirectives } from '../src/core/directives.js'
import { templatesDir } from '../src/core/generate.js'

function templateFiles(dir = templatesDir): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? templateFiles(path) : [path]
  })
}

const options = (overrides: Partial<ProjectOptions> = {}): ProjectOptions => ({
  ...defaults,
  name: 'acme',
  ...overrides,
})

const render = (content: string, overrides: Partial<ProjectOptions> = {}) =>
  renderDirectives(content, options(overrides), 'teste.ts')

describe('renderDirectives', () => {
  const template = ['a', '//#if queue=bullmq', 'fila', '//#else', 'sem fila', '//#endif', 'b'].join(
    '\n'
  )

  test('mantém o bloco certo e remove as linhas de diretiva', () => {
    expect(render(template, { queue: 'bullmq' })).toBe('a\nfila\nb')
    expect(render(template)).toBe('a\nsem fila\nb')
  })

  test('aceita != e alternativas com |', () => {
    expect(render('//#if frontend=next|vite\nweb\n//#endif', { frontend: 'vite' })).toBe('web')
    expect(render('//#if backend!=none\napi\n//#endif', { backend: 'none' })).toBe('')
  })

  test('blocos aninhados respeitam o bloco de fora', () => {
    const nested = '//#if web3=evm\n  //#if session=token\nbearer\n  //#endif\n//#endif'
    expect(render(nested, { web3: 'none', session: 'token' })).toBe('')
    expect(render(nested, { web3: 'evm', session: 'token' })).toBe('bearer')
  })

  test('arquivo sem diretivas passa intacto', () => {
    expect(render('const a = 1 // #comentário\n')).toBe('const a = 1 // #comentário\n')
  })

  test('erros de template apontam o arquivo', () => {
    expect(() => render('//#if banco=postgres\n//#endif')).toThrow('teste.ts: condição inválida')
    expect(() => render('//#if queue=bullmq\nx')).toThrow('teste.ts: //#if sem //#endif')
    expect(() => render('//#endif')).toThrow('teste.ts: //#endif sem //#if')
    expect(() => render('//#if session=cokie\n//#endif')).toThrow(
      'teste.ts: valor desconhecido em //#if session: cokie'
    )
    expect(() => render('//#if web3=evm\n//#else\n//#else\n//#endif')).toThrow(
      'teste.ts: //#else repetido'
    )
  })

  test('todos os templates usam só chaves e valores do catálogo', () => {
    for (const file of templateFiles()) {
      expect(() => renderDirectives(readFileSync(file, 'utf8'), options(), file)).not.toThrow()
    }
  })
})
