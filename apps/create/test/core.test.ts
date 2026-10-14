import { afterEach, describe, expect, test } from 'bun:test'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { defaults, type ProjectOptions, validate, validCombinations } from '../src/core/catalog.js'
import { generate, LockedError, layersFor, templatesDir } from '../src/core/generate.js'
import { lockReason } from '../src/core/lock.js'

const options = (overrides: Partial<ProjectOptions> = {}): ProjectOptions => ({
  ...defaults,
  name: 'acme',
  ...overrides,
})

const tempDirs: string[] = []
function tempDir() {
  const dir = mkdtempSync(join(tmpdir(), 'webdex-create-'))
  tempDirs.push(dir)
  return dir
}
afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('validate', () => {
  test('aceita os padrões', () => {
    expect(validate(options())).toEqual([])
  })

  test('exige backend ou frontend', () => {
    expect(validate(options({ backend: 'none', frontend: 'none' }))).toContain(
      'escolha ao menos um backend ou um frontend'
    )
  })

  test('rejeita ORM incompatível com o backend', () => {
    expect(validate(options({ backend: 'adonis', orm: 'prisma' })).join()).toContain(
      'não é compatível'
    )
  })

  test('rejeita opção ainda indisponível', () => {
    expect(validate(options({ database: 'mysql' })).join()).toContain('ainda não está disponível')
  })

  test('ignora ORM e banco quando não há backend', () => {
    expect(validate(options({ backend: 'none', database: 'mysql' }))).toEqual([])
  })

  test('rejeita nome inválido', () => {
    expect(validate(options({ name: 'Meu Projeto' })).join()).toContain('inválido')
  })
})

describe('layersFor', () => {
  test('fullstack', () => {
    expect(layersFor(options())).toEqual([
      'base',
      'backend-common',
      'db-postgres',
      'backend-nest',
      'orm-prisma',
      'orm-prisma-postgres',
      'nest-prisma',
      'database-url-postgres',
      'frontend-next',
    ])
  })

  test('só frontend', () => {
    expect(layersFor(options({ backend: 'none' }))).toEqual(['base', 'frontend-next'])
  })

  test('toda combinação disponível tem todas as camadas', () => {
    const layers = readdirSync(templatesDir)
    for (const combination of validCombinations()) {
      for (const layer of layersFor({ ...combination, name: 'x' })) {
        expect(`${JSON.stringify(combination)} -> ${layer}`).toBe(
          `${JSON.stringify(combination)} -> ${layers.includes(layer) ? layer : 'AUSENTE'}`
        )
      }
    }
  })
})

describe('lockReason', () => {
  test('libera diretório inexistente ou só com arquivos tolerados', () => {
    const dir = tempDir()
    expect(lockReason(join(dir, 'novo'))).toBeNull()
    writeFileSync(join(dir, 'README.md'), '# repo')
    mkdirSync(join(dir, '.git'))
    expect(lockReason(dir)).toBeNull()
  })

  test('bloqueia diretório com outros arquivos', () => {
    const dir = tempDir()
    writeFileSync(join(dir, 'index.ts'), '')
    expect(lockReason(dir)).toContain('não está vazio')
  })
})

describe('generate', () => {
  test('gera o projeto fullstack completo e trava a reexecução', () => {
    const dir = join(tempDir(), 'acme')
    generate({ targetDir: dir, options: options(), generatorVersion: '0.0.0-test' })

    for (const file of [
      '.webdex/manifest.json',
      '.gitignore',
      '.env',
      'apps/api/.env',
      'apps/api/src/main.ts',
      'apps/web/src/app/page.tsx',
      'docker-compose.yml',
      '.claude/agents/backend.md',
      '.opencode/agents/frontend.md',
      '.codex/agents/architecture-reviewer.toml',
      'docs/standards/modular-monolith.md',
    ]) {
      expect(existsSync(join(dir, file))).toBe(true)
    }

    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    expect(pkg.name).toBe('acme')
    expect(pkg.scripts['db:migrate']).toBeDefined()
    expect(readFileSync(join(dir, 'AGENTS.md'), 'utf8')).toContain('apps/api')
    expect(readFileSync(join(dir, '.env.example'), 'utf8')).toContain('POSTGRES_DB=acme')

    expect(() =>
      generate({ targetDir: dir, options: options(), generatorVersion: '0.0.0-test' })
    ).toThrow(LockedError)
  })

  test('só frontend não leva backend, banco nem agentes de backend', () => {
    const dir = join(tempDir(), 'site')
    generate({
      targetDir: dir,
      options: options({ name: 'site', backend: 'none' }),
      generatorVersion: '0.0.0-test',
    })

    expect(existsSync(join(dir, 'apps/web'))).toBe(true)
    for (const absent of ['apps/api', 'docker-compose.yml', 'ai/agents/backend.md']) {
      expect(existsSync(join(dir, absent))).toBe(false)
    }
    expect(
      JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).scripts['db:migrate']
    ).toBeUndefined()
  })

  test('só backend não leva frontend', () => {
    const dir = join(tempDir(), 'api')
    generate({
      targetDir: dir,
      options: options({ name: 'api', frontend: 'none' }),
      generatorVersion: '0.0.0-test',
    })
    expect(existsSync(join(dir, 'apps/api'))).toBe(true)
    expect(existsSync(join(dir, 'apps/web'))).toBe(false)
    expect(existsSync(join(dir, 'ai/agents/frontend.md'))).toBe(false)
  })

  test('não sobra placeholder nos arquivos gerados', () => {
    const dir = join(tempDir(), 'acme')
    generate({ targetDir: dir, options: options(), generatorVersion: '0.0.0-test' })
    const leftovers = walk(dir).filter((file) => readFileSync(file, 'utf8').includes('{{'))
    expect(leftovers).toEqual([])
  })

  test('--link-packages aponta os pacotes @devwebdex para o checkout local', () => {
    const dir = join(tempDir(), 'acme')
    generate({
      targetDir: dir,
      options: options(),
      generatorVersion: '0.0.0-test',
      linkPackagesFrom: '/repo',
    })
    expect(readFileSync(join(dir, 'pnpm-workspace.yaml'), 'utf8')).toContain(
      "'@devwebdex/ui': file:/repo/packages/ui"
    )
  })
})

test('templates usam a versão atual dos pacotes @devwebdex', () => {
  const packagesDir = join(import.meta.dir, '../../../packages')
  const versions = Object.fromEntries(
    readdirSync(packagesDir).map((pkg) => {
      const manifest = JSON.parse(readFileSync(join(packagesDir, pkg, 'package.json'), 'utf8'))
      return [manifest.name, manifest.version]
    })
  )
  const templatePackages = walk(templatesDir).filter((file) => file.endsWith('package.json'))
  for (const file of templatePackages) {
    const manifest = JSON.parse(readFileSync(file, 'utf8'))
    for (const [name, range] of Object.entries({
      ...manifest.dependencies,
      ...manifest.devDependencies,
    })) {
      if (name.startsWith('@devwebdex/'))
        expect(`${name}@${range}`).toBe(`${name}@^${versions[name]}`)
    }
  }
})

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}
