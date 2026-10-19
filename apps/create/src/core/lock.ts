import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export const manifestPath = '.webdex/manifest.json'

// Arquivos que um repositório recém-criado no GitHub costuma ter; README e .gitignore são sobrescritos.
const tolerated = new Set(['.git', 'README.md', 'LICENSE', 'LICENSE.md', '.gitignore'])

/** Retorna o motivo do bloqueio, ou null se o diretório pode receber um projeto novo. */
export function lockReason(targetDir: string): string | null {
  const manifest = join(targetDir, manifestPath)
  if (existsSync(manifest)) {
    const { createdAt } = JSON.parse(readFileSync(manifest, 'utf8')) as { createdAt?: string }
    return `este diretório já foi inicializado pelo gerador em ${createdAt ?? 'data desconhecida'}. Rodar de novo sobrescreveria o projeto.`
  }
  if (!existsSync(targetDir)) return null
  const unexpected = readdirSync(targetDir).filter((entry) => !tolerated.has(entry))
  if (unexpected.length > 0) {
    return `o diretório não está vazio (${unexpected.slice(0, 5).join(', ')}${unexpected.length > 5 ? ', ...' : ''}).`
  }
  return null
}
