import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

export type GitResult = { ok: true } | { ok: false; message: string }

/** Inicializa o repositório (se ainda não existir) e cria o commit inicial com o projeto gerado. */
export function initGitRepository(dir: string): GitResult {
  const git = (args: string[]) => spawnSync('git', args, { cwd: dir, encoding: 'utf8' })

  if (!existsSync(join(dir, '.git'))) {
    const init = git(['init', '-b', 'main'])
    if (init.error || init.status !== 0) {
      return {
        ok: false,
        message: `git init falhou: ${init.stderr?.trim() || 'git não encontrado'}`,
      }
    }
  }
  git(['add', '-A'])
  const commit = git(['commit', '-m', 'chore: projeto gerado pelo @devwebdex/create'])
  if (commit.status !== 0) {
    const reason = commit.stderr.trim() || commit.stdout.trim()
    return {
      ok: false,
      message: `commit inicial não criado; confira git config user.name e user.email (${reason})`,
    }
  }
  return { ok: true }
}
