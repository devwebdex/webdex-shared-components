export type Option<T extends string> = {
  value: T
  label: string
  description: string
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
    {
      value: 'modular-monolith',
      label: 'Monólito modular',
      description: 'Uma aplicação, dividida em módulos com fronteiras claras',
      available: true,
    },
    {
      value: 'microservices',
      label: 'Microserviços',
      description: 'Serviços separados, cada um com deploy próprio',
      available: false,
    },
  ] satisfies Option<Architecture>[],
  backend: [
    {
      value: 'nest',
      label: 'NestJS',
      description: 'Módulos e injeção de dependência, em TypeScript',
      available: true,
    },
    {
      value: 'adonis',
      label: 'AdonisJS',
      description: 'Framework completo, com ORM e autenticação próprios',
      available: false,
    },
    {
      value: 'express',
      label: 'Express',
      description: 'Mínimo e flexível, com a estrutura de módulos da WEbdEX',
      available: false,
    },
    { value: 'none', label: 'Sem backend', description: 'Só o frontend', available: true },
  ] satisfies Option<Backend>[],
  orm: [
    {
      value: 'prisma',
      label: 'Prisma',
      description: 'Schema declarativo e migrações geradas',
      available: true,
    },
    {
      value: 'drizzle',
      label: 'Drizzle',
      description: 'Consultas próximas do SQL, tipadas em TypeScript',
      available: true,
    },
    { value: 'lucid', label: 'Lucid', description: 'ORM nativo do AdonisJS', available: false },
  ] satisfies Option<Orm>[],
  database: [
    {
      value: 'postgres',
      label: 'PostgreSQL',
      description: 'Roda localmente pelo docker compose',
      available: true,
    },
    {
      value: 'mysql',
      label: 'MySQL',
      description: 'Para projetos que já dependem de MySQL',
      available: true,
    },
  ] satisfies Option<Database>[],
  frontend: [
    {
      value: 'next',
      label: 'Next.js',
      description: 'React com Tailwind, tokens e componentes da WEbdEX',
      available: true,
    },
    { value: 'none', label: 'Sem frontend', description: 'Só a API', available: true },
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

/** Todas as combinações que passam na validação (sem repetir ORM e banco quando não há backend). */
export function validCombinations(): Omit<ProjectOptions, 'name'>[] {
  const values = <K extends keyof typeof catalog>(key: K) =>
    (catalog[key] as Option<string>[]).filter((o) => o.available).map((o) => o.value)
  const combinations = new Map<string, Omit<ProjectOptions, 'name'>>()
  for (const architecture of values('architecture'))
    for (const backend of values('backend'))
      for (const orm of values('orm'))
        for (const database of values('database'))
          for (const frontend of values('frontend')) {
            const options = { architecture, backend, orm, database, frontend } as Omit<
              ProjectOptions,
              'name'
            >
            if (validate({ ...options, name: 'x' }).length > 0) continue
            const key =
              backend === 'none' ? `${architecture}/none/${frontend}` : JSON.stringify(options)
            combinations.set(key, options)
          }
  return [...combinations.values()]
}
