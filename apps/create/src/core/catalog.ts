export type Option<T extends string> = {
  value: T
  label: string
  available: boolean
}

export type Architecture = 'modular-monolith' | 'microservices'
export type Backend = 'none' | 'nest' | 'adonis' | 'express'
export type Orm = 'prisma' | 'drizzle' | 'lucid'
export type Database = 'postgres' | 'mysql'
export type Frontend = 'none' | 'next'

export type ProjectOptions = {
  name: string
  architecture: Architecture
  backend: Backend
  orm: Orm
  database: Database
  frontend: Frontend
}

export const catalog = {
  architecture: [
    { value: 'modular-monolith', label: 'Monólito modular', available: true },
    { value: 'microservices', label: 'Microserviços', available: false },
  ] satisfies Option<Architecture>[],
  backend: [
    { value: 'nest', label: 'NestJS', available: true },
    { value: 'adonis', label: 'AdonisJS', available: false },
    { value: 'express', label: 'Express', available: false },
    { value: 'none', label: 'Sem backend', available: true },
  ] satisfies Option<Backend>[],
  orm: [
    { value: 'prisma', label: 'Prisma', available: true },
    { value: 'drizzle', label: 'Drizzle', available: false },
    { value: 'lucid', label: 'Lucid', available: false },
  ] satisfies Option<Orm>[],
  database: [
    { value: 'postgres', label: 'PostgreSQL', available: true },
    { value: 'mysql', label: 'MySQL', available: false },
  ] satisfies Option<Database>[],
  frontend: [
    { value: 'next', label: 'Next.js', available: true },
    { value: 'none', label: 'Sem frontend', available: true },
  ] satisfies Option<Frontend>[],
}

export const defaults: Omit<ProjectOptions, 'name'> = {
  architecture: 'modular-monolith',
  backend: 'nest',
  orm: 'prisma',
  database: 'postgres',
  frontend: 'next',
}

/** ORMs válidos para cada backend: Adonis só funciona com Lucid (auth, factories e validação dependem dele). */
export function ormsFor(backend: Backend): Orm[] {
  if (backend === 'adonis') return ['lucid']
  if (backend === 'none') return []
  return ['prisma', 'drizzle']
}

export function validate(options: ProjectOptions): string[] {
  const errors: string[] = []
  if (!/^[a-z0-9][a-z0-9-]*$/.test(options.name)) {
    errors.push(`nome "${options.name}" inválido: use minúsculas, números e hífen`)
  }
  if (options.backend === 'none' && options.frontend === 'none') {
    errors.push('escolha ao menos um backend ou um frontend')
  }
  if (options.backend !== 'none' && !ormsFor(options.backend).includes(options.orm)) {
    errors.push(`ORM "${options.orm}" não é compatível com o backend "${options.backend}"`)
  }
  for (const key of ['architecture', 'backend', 'orm', 'database', 'frontend'] as const) {
    if (isIrrelevant(options, key)) continue
    const option = (catalog[key] as Option<string>[]).find((o) => o.value === options[key])
    if (!option) errors.push(`${key}: valor "${options[key]}" desconhecido`)
    else if (!option.available) errors.push(`${key}: "${option.label}" ainda não está disponível`)
  }
  return errors
}

/** ORM e banco só importam quando existe backend. */
export function isIrrelevant(options: ProjectOptions, key: keyof ProjectOptions): boolean {
  return options.backend === 'none' && (key === 'orm' || key === 'database')
}
