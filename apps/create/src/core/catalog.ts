export type Option<T extends string> = {
  value: T
  label: string
  description: string
  available: boolean
}

export type Architecture = 'modular-monolith' | 'microservices'
export type Backend = 'none' | 'nest' | 'express' | 'fastify' | 'adonis'
export type Database = 'postgres' | 'mysql' | 'mongodb'
export type Orm = 'prisma' | 'drizzle' | 'mongoose' | 'lucid'
export type Queue = 'none' | 'bullmq'
export type Frontend = 'none' | 'next' | 'vite' | 'inertia'

export type ProjectOptions = {
  name: string
  architecture: Architecture
  backend: Backend
  database: Database
  orm: Orm
  queue: Queue
  frontend: Frontend
}

export type Choices = Omit<ProjectOptions, 'name'>
export type ChoiceKey = keyof Choices

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
      value: 'express',
      label: 'Express',
      description: 'Mínimo e flexível, com a estrutura de módulos da WEbdEX',
      available: true,
    },
    {
      value: 'fastify',
      label: 'Fastify',
      description: 'Leve e rápido, com a estrutura de módulos da WEbdEX',
      available: true,
    },
    {
      value: 'adonis',
      label: 'AdonisJS',
      description: 'Framework completo, com ORM próprio (Lucid)',
      available: true,
    },
    { value: 'none', label: 'Sem backend', description: 'Só o frontend', available: true },
  ] satisfies Option<Backend>[],
  database: [
    {
      value: 'postgres',
      label: 'PostgreSQL',
      description: 'Relacional; roda localmente pelo docker compose',
      available: true,
    },
    {
      value: 'mysql',
      label: 'MySQL',
      description: 'Para projetos que já dependem de MySQL',
      available: true,
    },
    {
      value: 'mongodb',
      label: 'MongoDB',
      description: 'Banco de documentos, com Mongoose',
      available: true,
    },
  ] satisfies Option<Database>[],
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
    {
      value: 'mongoose',
      label: 'Mongoose',
      description: 'Schemas e models para MongoDB',
      available: true,
    },
    { value: 'lucid', label: 'Lucid', description: 'ORM nativo do AdonisJS', available: true },
  ] satisfies Option<Orm>[],
  queue: [
    {
      value: 'none',
      label: 'Sem filas',
      description: 'Tudo roda dentro da requisição',
      available: true,
    },
    {
      value: 'bullmq',
      label: 'BullMQ + Redis',
      description: 'Jobs em segundo plano num worker separado, com Redis local',
      available: true,
    },
  ] satisfies Option<Queue>[],
  frontend: [
    {
      value: 'next',
      label: 'Next.js',
      description: 'React com rotas no servidor, Tailwind, tokens e componentes da WEbdEX',
      available: true,
    },
    {
      value: 'vite',
      label: 'Vite + React',
      description: 'SPA React (painéis, áreas logadas) com Tailwind, tokens e componentes',
      available: true,
    },
    {
      value: 'inertia',
      label: 'Inertia + React',
      description: 'Páginas React servidas pelo próprio AdonisJS, numa app só',
      available: true,
    },
    { value: 'none', label: 'Sem frontend', description: 'Só a API', available: true },
  ] satisfies Option<Frontend>[],
}

export const defaults: Choices = {
  architecture: 'modular-monolith',
  backend: 'nest',
  database: 'postgres',
  orm: 'prisma',
  queue: 'none',
  frontend: 'next',
}

/**
 * Valores compatíveis de um eixo com as outras escolhas:
 * - Adonis só usa Lucid, que é só SQL (sem MongoDB);
 * - MongoDB só com Mongoose (o Prisma 7 não tem conector MongoDB e o Drizzle é só SQL);
 * - Inertia só existe com AdonisJS, que serve as páginas;
 * - banco, ORM e filas só existem quando há backend.
 */
export function compatibleValues(key: ChoiceKey, choices: Choices): string[] {
  const all = (catalog[key] as Option<string>[]).map((o) => o.value)
  const { backend, database } = choices
  switch (key) {
    case 'database':
      if (backend === 'none') return []
      return backend === 'adonis' ? ['postgres', 'mysql'] : all
    case 'orm':
      if (backend === 'none') return []
      if (backend === 'adonis') return ['lucid']
      return database === 'mongodb' ? ['mongoose'] : ['prisma', 'drizzle']
    case 'queue':
      return backend === 'none' ? [] : all
    case 'frontend':
      return backend === 'adonis' ? all : all.filter((value) => value !== 'inertia')
    default:
      return all
  }
}

/** Banco, ORM, filas e frontend só são perguntados/validados quando fazem sentido. */
export function isIrrelevant(options: Choices, key: ChoiceKey): boolean {
  return compatibleValues(key, options).length === 0
}

/** Ajusta as escolhas dependentes depois de uma mudança (ex.: MongoDB troca o ORM para Mongoose). */
export function normalize(choices: Choices): Choices {
  const next = { ...choices }
  for (const key of ['database', 'orm', 'queue', 'frontend'] as const) {
    const values = compatibleValues(key, next).filter((value) => isAvailable(key, value))
    if (values.length > 0 && !values.includes(next[key])) {
      next[key] = (values.includes(defaults[key]) ? defaults[key] : values[0]) as never
    }
  }
  return next
}

export function validate(options: ProjectOptions): string[] {
  const errors: string[] = []
  if (!/^[a-z0-9][a-z0-9-]*$/.test(options.name)) {
    errors.push(`nome "${options.name}" inválido: use minúsculas, números e hífen`)
  }
  if (options.backend === 'none' && options.frontend === 'none') {
    errors.push('escolha ao menos um backend ou um frontend')
  }
  for (const key of ['architecture', 'backend', 'database', 'orm', 'queue', 'frontend'] as const) {
    if (isIrrelevant(options, key)) continue
    const flag = `--${flagNames[key]}`
    const option = (catalog[key] as Option<string>[]).find((o) => o.value === options[key])
    if (!option) {
      const known = (catalog[key] as Option<string>[]).filter((o) => o.available)
      errors.push(
        `${flag}: "${options[key]}" não existe. Use: ${known.map((o) => o.value).join(', ')}`
      )
    } else if (!option.available) {
      errors.push(`${flag}: "${option.label}" ainda não está disponível`)
    } else if (!compatibleValues(key, options).includes(option.value)) {
      const usable = compatibleValues(key, options).filter((value) => isAvailable(key, value))
      errors.push(
        `${flag}: "${option.label}" não é compatível com as outras escolhas. Com elas, use: ${usable.join(', ')}`
      )
    }
  }
  return errors
}

/** Nome do flag do CLI de cada eixo (o banco é --db). */
export const flagNames: Record<ChoiceKey, string> = {
  architecture: 'architecture',
  backend: 'backend',
  database: 'db',
  orm: 'orm',
  queue: 'queue',
  frontend: 'frontend',
}

/** Todas as combinações válidas (eixos irrelevantes fixados no padrão, para não repetir). */
export function validCombinations(): Choices[] {
  const values = (key: ChoiceKey) =>
    (catalog[key] as Option<string>[]).filter((o) => o.available).map((o) => o.value)
  const combinations = new Map<string, Choices>()
  for (const architecture of values('architecture'))
    for (const backend of values('backend'))
      for (const database of values('database'))
        for (const orm of values('orm'))
          for (const queue of values('queue'))
            for (const frontend of values('frontend')) {
              const options = { architecture, backend, database, orm, queue, frontend } as Choices
              if (validate({ ...options, name: 'x' }).length > 0) continue
              const key = (
                ['architecture', 'backend', 'database', 'orm', 'queue', 'frontend'] as const
              )
                .map((k) => (isIrrelevant(options, k) ? '-' : options[k]))
                .join('/')
              combinations.set(key, options)
            }
  return [...combinations.values()]
}

function isAvailable(key: ChoiceKey, value: string) {
  return (catalog[key] as Option<string>[]).some((o) => o.value === value && o.available)
}
