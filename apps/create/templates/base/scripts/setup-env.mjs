// Cria cada .env a partir do .env.example vizinho (sem sobrescrever .env existente).
// Chave ou segredo vazio no exemplo (ex.: APP_KEY=) ganha valor aleatório no .env, nunca no exemplo.
// Uso, na raiz do repositório: node scripts/setup-env.mjs
import { randomBytes } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ignored = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.turbo'])

for (const example of findExamples(process.cwd())) {
  const env = example.slice(0, -'.example'.length)
  if (existsSync(env)) continue
  const content = readFileSync(example, 'utf8').replace(
    /^([A-Z0-9_]*(?:KEY|SECRET))=$/gm,
    (_line, name) => `${name}=${randomBytes(32).toString('base64url')}`
  )
  writeFileSync(env, content)
  console.log(`criado ${env.slice(process.cwd().length + 1)}`)
}

function findExamples(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (ignored.has(entry.name)) return []
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return findExamples(path)
    return entry.name === '.env.example' ? [path] : []
  })
}
