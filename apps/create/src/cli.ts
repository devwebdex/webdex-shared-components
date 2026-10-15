#!/usr/bin/env bun
import { spawnSync } from 'node:child_process'
import { basename, resolve } from 'node:path'
import { type ParseArgsConfig, parseArgs } from 'node:util'
import pkg from '../package.json' with { type: 'json' }
import {
  type Choices,
  defaults,
  normalize,
  type ProjectOptions,
  recommendedValue,
  validate,
} from './core/catalog.js'
import { appsFor, generate, LockedError, linkPackagesProblem } from './core/generate.js'
import { initGitRepository } from './core/git.js'
import { lockReason } from './core/lock.js'

const usage = `Uso: bunx @devwebdex/create [diretório] [opções]

Sem --yes, abre a interface interativa (mouse e teclado).
Todo projeto nasce como monorepo (pnpm workspaces + Turborepo), mesmo com uma app só:
a API fica em apps/api e o frontend em apps/web (com Inertia, em apps/api/inertia).

Opções:
  --name <nome>            nome do projeto (padrão: nome do diretório)
  --architecture <valor>   modular-monolith
  --backend <valor>        nest | express | fastify | adonis | none
  --db <valor>             postgres | mysql | mongodb
  --orm <valor>            prisma | drizzle (SQL) · mongoose (MongoDB) · lucid (Adonis)
  --queue <valor>          none | bullmq
  --frontend <valor>       next | vite | inertia (só Adonis) | none
  --web3 <valor>           none | evm (Polygon com viem)
  --session <valor>        cookie | token (login com carteira; padrão: token com Vite, cookie nos outros)
  --yes                    não interativo: usa os flags e os padrões
  --skip-install           não roda pnpm install
  --skip-git               não inicializa o git nem cria o commit inicial
  --link-packages <dir>    usa os pacotes @devwebdex/* de um checkout local (CI e desenvolvimento)
  --help                   mostra esta ajuda

Exemplo:
  bunx @devwebdex/create ../meu-projeto --yes --backend nest --db postgres --frontend next`

const optionsConfig = {
  name: { type: 'string' },
  architecture: { type: 'string' },
  backend: { type: 'string' },
  orm: { type: 'string' },
  db: { type: 'string' },
  queue: { type: 'string' },
  frontend: { type: 'string' },
  web3: { type: 'string' },
  session: { type: 'string' },
  yes: { type: 'boolean', default: false },
  'skip-install': { type: 'boolean', default: false },
  'skip-git': { type: 'boolean', default: false },
  'link-packages': { type: 'string' },
  help: { type: 'boolean', default: false },
} satisfies ParseArgsConfig['options']

// Valor de exemplo de cada opção com valor, usado na mensagem de "falta o valor".
const examples: Record<string, string> = {
  name: 'meu-projeto',
  architecture: 'modular-monolith',
  backend: 'nest',
  orm: 'prisma',
  db: 'postgres',
  queue: 'bullmq',
  frontend: 'next',
  web3: 'evm',
  session: 'cookie',
  'link-packages': '.',
}

const { values, positionals } = parseCliArgs()

if (values.help) {
  console.log(usage)
  process.exit(0)
}

if (positionals.length > 1) {
  fail(
    `informe um diretório de destino só; recebi ${positionals.length}: ${positionals.join(', ')}`,
    'Se um deles era o valor de uma opção, confira se a opção está escrita certo (ex.: --db postgres).'
  )
}

const linkPackagesFrom = values['link-packages'] ? resolve(values['link-packages']) : undefined
if (linkPackagesFrom) {
  const problem = linkPackagesProblem(linkPackagesFrom)
  if (problem) fail(`--link-packages: ${problem}`)
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
    web3: values.web3,
    session: values.session,
  }).filter(([, value]) => value !== undefined)
) as Partial<ProjectOptions>

let directory = positionals[0]
if (directory) failIfLocked(resolve(directory))

let options: ProjectOptions
if (values.yes) {
  if (!directory) {
    fail(
      'o modo não interativo (--yes) exige o diretório de destino',
      `Exemplo: bunx @devwebdex/create ../meu-projeto --yes`
    )
  }
  options = {
    ...initialChoices(flags),
    name: basename(resolve(directory)),
    ...flags,
  }
} else {
  if (!process.stdin.isTTY) fail('terminal não interativo: use --yes com os flags desejados')
  const { runTui } = await import('./tui/app.js')
  const answer = await runTui({ directory, initial: initialChoices(flags) })
  if (!answer) process.exit(130)
  directory = answer.directory
  options = answer.options
  failIfLocked(resolve(directory))
}

const errors = validate(options)
if (errors.length > 0) fail(errors.join('\n  '), 'Veja os valores aceitos com --help.')

const targetDir = resolve(directory)
try {
  generate({
    targetDir,
    options,
    generatorVersion: pkg.version,
    ...(linkPackagesFrom ? { linkPackagesFrom } : {}),
  })
} catch (error) {
  if (error instanceof LockedError) fail(error.message)
  fail(`não foi possível gerar o projeto: ${error instanceof Error ? error.message : error}`)
}
console.log(`Projeto criado em ${targetDir}`)
console.log(`Monorepo (pnpm workspaces + Turborepo) com ${appsFor(options).join(' e ')}`)

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

/** Padrões com os flags por cima; sem --session, a sessão segue o frontend escolhido. */
function initialChoices(flags: Partial<ProjectOptions>): Choices {
  const choices = normalize({ ...defaults, ...flags })
  if (!flags.session) choices.session = recommendedValue('session', choices)
  return choices
}

/** parseArgs lança erro técnico em inglês; aqui ele vira uma mensagem curta, sem stack trace. */
function parseCliArgs() {
  try {
    return parseArgs({ allowPositionals: true, options: optionsConfig })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const flag = /'(-{1,2}[\w-]+)/.exec(message)?.[1] ?? ''
    const name = flag.replace(/^-+/, '') as keyof typeof optionsConfig
    const code = (error as { code?: string }).code
    if (code === 'ERR_PARSE_ARGS_UNKNOWN_OPTION') {
      // O eixo se chama "banco de dados" na TUI, mas o flag é --db.
      const suggestion = name === ('database' as string) ? ' (o banco é --db)' : ''
      fail(
        `opção desconhecida: ${flag}${suggestion}`,
        `Opções aceitas: ${Object.keys(optionsConfig)
          .map((option) => `--${option}`)
          .join(', ')}`
      )
    }
    if (code === 'ERR_PARSE_ARGS_INVALID_OPTION_VALUE' && name in optionsConfig) {
      if (optionsConfig[name].type === 'boolean') fail(`${flag} não recebe valor`)
      fail(`${flag} precisa de um valor`, `Exemplo: ${flag} ${examples[name]}`)
    }
    fail(message, 'Veja as opções com --help.')
  }
}

function failIfLocked(dir: string) {
  const reason = lockReason(dir)
  if (reason) fail(reason)
}

function fail(message: string, hint?: string): never {
  console.error(`Erro: ${message}`)
  if (hint) console.error(hint)
  process.exit(1)
}
