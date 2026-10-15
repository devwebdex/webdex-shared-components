#!/usr/bin/env bun
import { spawnSync } from 'node:child_process'
import { basename, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import pkg from '../package.json' with { type: 'json' }
import { defaults, normalize, type ProjectOptions, validate } from './core/catalog.js'
import { generate, LockedError } from './core/generate.js'
import { initGitRepository } from './core/git.js'
import { lockReason } from './core/lock.js'

const usage = `Uso: bunx @devwebdex/create [diretório] [opções]

Sem --yes, abre a interface interativa (mouse e teclado).

Opções:
  --name <nome>            nome do projeto (padrão: nome do diretório)
  --architecture <valor>   modular-monolith
  --backend <valor>        nest | express | fastify | adonis | none
  --db <valor>             postgres | mysql | mongodb
  --orm <valor>            prisma | drizzle (SQL) · mongoose (MongoDB) · lucid (Adonis)
  --queue <valor>          none | bullmq
  --frontend <valor>       next | vite | inertia (só Adonis) | none
  --yes                    não interativo: usa os flags e os padrões
  --skip-install           não roda pnpm install
  --skip-git               não inicializa o git nem cria o commit inicial
  --link-packages <dir>    usa os pacotes @devwebdex/* de um checkout local (CI e desenvolvimento)
  --help                   mostra esta ajuda`

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    name: { type: 'string' },
    architecture: { type: 'string' },
    backend: { type: 'string' },
    orm: { type: 'string' },
    db: { type: 'string' },
    queue: { type: 'string' },
    frontend: { type: 'string' },
    yes: { type: 'boolean', default: false },
    'skip-install': { type: 'boolean', default: false },
    'skip-git': { type: 'boolean', default: false },
    'link-packages': { type: 'string' },
    help: { type: 'boolean', default: false },
  },
})

if (values.help) {
  console.log(usage)
  process.exit(0)
}

const flags = Object.fromEntries(
  Object.entries({
    name: values.name,
    architecture: values.architecture,
    backend: values.backend,
    orm: values.orm,
    database: values.db,
    queue: values.queue,
    frontend: values.frontend,
  }).filter(([, value]) => value !== undefined)
) as Partial<ProjectOptions>

let directory = positionals[0]
if (directory) failIfLocked(resolve(directory))

let options: ProjectOptions
if (values.yes) {
  if (!directory) fail('o modo não interativo exige o diretório de destino')
  options = {
    ...normalize({ ...defaults, ...flags }),
    name: basename(resolve(directory)),
    ...flags,
  }
} else {
  if (!process.stdin.isTTY) fail('terminal não interativo: use --yes com os flags desejados')
  const { runTui } = await import('./tui/app.js')
  const answer = await runTui({ directory, initial: normalize({ ...defaults, ...flags }) })
  if (!answer) process.exit(130)
  directory = answer.directory
  options = answer.options
  failIfLocked(resolve(directory))
}

const errors = validate(options)
if (errors.length > 0) fail(errors.join('\n'))

const targetDir = resolve(directory)
try {
  generate({
    targetDir,
    options,
    generatorVersion: pkg.version,
    ...(values['link-packages'] ? { linkPackagesFrom: resolve(values['link-packages']) } : {}),
  })
} catch (error) {
  if (error instanceof LockedError) fail(error.message)
  throw error
}
console.log(`Projeto criado em ${targetDir}`)

if (!values['skip-install']) {
  const install = spawnSync('pnpm', ['install'], { cwd: targetDir, stdio: 'inherit', shell: true })
  if (install.status !== 0)
    fail('pnpm install falhou; o projeto foi gerado, rode a instalação manualmente')
}

// Depois da instalação, para o lockfile entrar no commit inicial.
if (!values['skip-git']) {
  const git = initGitRepository(targetDir)
  console.log(git.ok ? 'Repositório git criado com o commit inicial' : `Aviso: ${git.message}`)
}

console.log(`
Próximos passos:
  cd ${directory}${options.backend !== 'none' ? '\n  docker compose up -d' : ''}
  pnpm dev`)

function failIfLocked(dir: string) {
  const reason = lockReason(dir)
  if (reason) fail(reason)
}

function fail(message: string): never {
  console.error(`Erro: ${message}`)
  process.exit(1)
}
