// Atualiza as faixas dos pacotes @devwebdex/* nos templates do gerador para as versões atuais de packages/.
// Roda depois do `changeset version`, no PR de release; um teste do gerador falha se as faixas divergirem.
// Template alterado muda o conteúdo publicado do @devwebdex/create, então ele precisa de versão nova também.
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const versions = Object.fromEntries(
  readdirSync(join(root, 'packages')).map((dir) => {
    const manifest = JSON.parse(readFileSync(join(root, 'packages', dir, 'package.json'), 'utf8'))
    return [manifest.name, manifest.version]
  })
)

const updated = []
const templates = walk(join(root, 'apps/create/templates')).filter((f) =>
  f.endsWith('package.json')
)
for (const file of templates) {
  const manifest = JSON.parse(readFileSync(file, 'utf8'))
  let changed = false
  for (const field of ['dependencies', 'devDependencies']) {
    for (const name of Object.keys(manifest[field] ?? {})) {
      const range = versions[name] && `^${versions[name]}`
      if (range && manifest[field][name] !== range) {
        updated.push(`${name}@${range}`)
        manifest[field][name] = range
        changed = true
      }
    }
  }
  if (changed) {
    writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`)
    console.log(`atualizado ${file.slice(root.length + 1)}`)
  }
}

if (updated.length > 0) bumpCreate([...new Set(updated)])

/** Sobe o patch do @devwebdex/create, a menos que o `changeset version` já tenha versionado ele. */
function bumpCreate(changes) {
  const path = join(root, 'apps/create/package.json')
  const manifest = JSON.parse(readFileSync(path, 'utf8'))
  const committed = JSON.parse(
    execFileSync('git', ['show', 'HEAD:apps/create/package.json'], { encoding: 'utf8' })
  )
  if (manifest.version !== committed.version) return

  const [major, minor, patch] = manifest.version.split('.').map(Number)
  manifest.version = `${major}.${minor}.${patch + 1}`
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`)

  const changelog = join(root, 'apps/create/CHANGELOG.md')
  const entry = `## ${manifest.version}\n\n### Patch Changes\n\n- Templates passam a usar ${changes.join(', ')}.\n`
  const current = existsSync(changelog) ? readFileSync(changelog, 'utf8') : `# ${manifest.name}\n`
  writeFileSync(changelog, current.replace(/^(# .+\n)/, `$1\n${entry}`))
  console.log(`@devwebdex/create ${committed.version} -> ${manifest.version}`)
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}
