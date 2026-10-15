import { afterEach, expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const cli = join(import.meta.dir, '../src/cli.ts')

const tempDirs: string[] = []
afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function run(...args: string[]) {
  const dir = mkdtempSync(join(tmpdir(), 'webdex-cli-'))
  tempDirs.push(dir)
  const result = spawnSync(process.execPath, [cli, join(dir, 'acme'), ...args], {
    encoding: 'utf8',
  })
  return { status: result.status, stderr: result.stderr }
}

// Erro de uso vira mensagem curta, com código 1 e sem stack trace.
function expectUsageError(result: { status: number | null; stderr: string }, message: string) {
  expect(result.stderr).toContain(`Erro: ${message}`)
  expect(result.stderr).not.toMatch(/\n\s+at /)
  expect(result.status).toBe(1)
}

test('opção sem valor mostra um exemplo', () => {
  const result = run('--link-packages')
  expectUsageError(result, '--link-packages precisa de um valor')
  expect(result.stderr).toContain('Exemplo: --link-packages .')
})

test('opção desconhecida lista as aceitas', () => {
  const result = run('--database', 'postgres')
  expectUsageError(result, 'opção desconhecida: --database (o banco é --db)')
  expect(result.stderr).toContain('Opções aceitas: --name')
})

test('opção booleana com valor', () => {
  expectUsageError(run('--yes=sim'), '--yes não recebe valor')
})

test('dois diretórios de destino', () => {
  expectUsageError(run('outro', '--yes'), 'informe um diretório de destino só')
})

test('valor inválido lista os aceitos', () => {
  const result = run('--yes', '--backend', 'spring', '--skip-install', '--skip-git')
  expectUsageError(result, '--backend: "spring" não existe. Use: nest, express')
})

test('--link-packages fora do checkout', () => {
  expectUsageError(run('--yes', '--link-packages', tmpdir()), '--link-packages:')
})
