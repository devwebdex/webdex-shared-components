import { spawnSync } from 'node:child_process'
import { appendFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ProjectOptions } from './catalog.js'
import { lockReason, manifestPath } from './lock.js'

export const templatesDir = fileURLToPath(new URL('../../templates', import.meta.url))

// Pacotes de padrão que o projeto gerado consome; --link-packages aponta todos para um checkout local.
const devwebdexPackages = ['biome-config', 'eslint-config', 'tokens', 'tsconfig', 'ui']

export type GenerateInput = {
  targetDir: string
  options: ProjectOptions
  generatorVersion: string
  /** Caminho de um checkout deste monorepo: usa os pacotes locais em vez do GitHub Packages (CI e desenvolvimento). */
  linkPackagesFrom?: string
}

export class LockedError extends Error {}

export function generate({
  targetDir,
  options,
  generatorVersion,
  linkPackagesFrom,
}: GenerateInput) {
  const reason = lockReason(targetDir)
  if (reason) throw new LockedError(reason)

  mkdirSync(targetDir, { recursive: true })
  for (const layer of layersFor(options)) applyLayer(join(templatesDir, layer), targetDir, options)
  // Os .env usam os valores de desenvolvimento dos exemplos, então o projeto já nasce rodando.
  runProjectScript(targetDir, 'setup-env.mjs', 'criar os arquivos .env')
  if (linkPackagesFrom) linkPackages(targetDir, linkPackagesFrom)
  runProjectScript(targetDir, 'sync-agents.mjs', 'gerar os agentes de IA')
  writeManifest(targetDir, options, generatorVersion)
}

/**
 * Camadas em ordem de aplicação. Cada uma cuida de uma parte (framework, ORM, driver do banco,
 * integração framework + ORM) e as posteriores acrescentam ou mesclam nos arquivos das anteriores.
 */
export function layersFor({ backend, orm, database, queue, frontend }: ProjectOptions): string[] {
  const layers = ['base']
  // Express e Fastify compartilham estrutura e integrações (connectDatabase); o Nest usa as próprias (DI).
  const node = backend === 'express' || backend === 'fastify'
  if (backend === 'adonis') {
    layers.push('backend-common', `db-${database}`, 'backend-adonis', `backend-adonis-${database}`)
  } else if (backend !== 'none') {
    layers.push(
      'backend-common',
      `db-${database}`,
      ...(node ? ['backend-node-common'] : []),
      `backend-${backend}`,
      `orm-${orm}`,
      `orm-${orm}-${database}`,
      `${node ? 'node' : backend}-${orm}`,
      `database-url-${database}`
    )
  }
  if (backend !== 'none' && queue !== 'none') {
    layers.push(`queue-${queue}`, ...(node ? [`node-${queue}`] : []), `${backend}-${queue}`)
  }
  if (frontend !== 'none') layers.push(`frontend-${frontend}`)
  return layers
}

/**
 * Copia a camada para o destino. Convenções de nome:
 * - segmento iniciado por `_` vira `.` (o npm descarta `.gitignore` e similares ao publicar);
 * - segmento iniciado por `__` vira `_` literal (ex.: `__journal.json` → `_journal.json`);
 * - sufixo `.append` acrescenta o conteúdo ao arquivo de mesmo nome escrito por camadas anteriores;
 * - sufixo `.merge` mescla o JSON no arquivo de mesmo nome (objetos recursivamente, o resto substitui).
 */
function applyLayer(layerDir: string, targetDir: string, options: ProjectOptions) {
  for (const source of walk(layerDir)) {
    const parts = relative(layerDir, source).split(sep).map(targetName)
    const target = join(targetDir, ...parts)
    const content = readFileSync(source, 'utf8').replaceAll('{{name}}', options.name)
    mkdirSync(dirname(target), { recursive: true })
    if (target.endsWith('.append')) {
      appendFileSync(target.slice(0, -'.append'.length), content)
    } else if (target.endsWith('.merge')) {
      const base = target.slice(0, -'.merge'.length)
      const merged = mergeJson(JSON.parse(readFileSync(base, 'utf8')), JSON.parse(content))
      writeFileSync(base, `${JSON.stringify(merged, null, 2)}\n`)
    } else {
      writeFileSync(target, content)
    }
  }
}

export function targetName(part: string) {
  if (part.startsWith('__')) return part.slice(1)
  return part.startsWith('_') ? `.${part.slice(1)}` : part
}

function mergeJson(base: unknown, patch: unknown): unknown {
  if (!isObject(base) || !isObject(patch)) return patch
  const result: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(patch)) result[key] = mergeJson(base[key], value)
  return result
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}

// `file:` copia o pacote para dentro do projeto: com `link:` o Turbopack recusa arquivos fora da raiz.
function linkPackages(targetDir: string, monorepo: string) {
  const overrides = devwebdexPackages
    .map((pkg) => `  '@devwebdex/${pkg}': file:${join(monorepo, 'packages', pkg)}\n`)
    .join('')
  appendFileSync(join(targetDir, 'pnpm-workspace.yaml'), `\noverrides:\n${overrides}`)
}

// Scripts do próprio projeto gerado (scripts/*.mjs): a mesma lógica serve ao gerador, ao dev e ao CI.
function runProjectScript(targetDir: string, script: string, purpose: string) {
  const result = spawnSync(process.execPath, [join('scripts', script)], {
    cwd: targetDir,
    encoding: 'utf8',
  })
  if (result.status !== 0) throw new Error(`falha ao ${purpose}:\n${result.stderr}`)
}

function writeManifest(targetDir: string, options: ProjectOptions, generatorVersion: string) {
  const target = join(targetDir, manifestPath)
  mkdirSync(dirname(target), { recursive: true })
  const manifest = {
    generator: '@devwebdex/create',
    generatorVersion,
    createdAt: new Date().toISOString(),
    options,
  }
  writeFileSync(target, `${JSON.stringify(manifest, null, 2)}\n`)
}
