import cors from '@fastify/cors'
import Fastify, { type FastifyServerOptions } from 'fastify'
import { createHealthModule } from './modules/health/index.js'
import type { DatabaseConnection } from './shared/database/database.js'
import { registerErrorHandlers } from './shared/http/error-handler.js'
import type { RedisConnection } from './shared/queue/redis.js'

export type AppDependencies = {
  database: DatabaseConnection
  redis: RedisConnection
  corsOrigins: string[]
}

/** Composição do app: cada módulo recebe só as dependências de que precisa e vira um plugin com prefixo. */
export async function createApp(
  { database, redis, corsOrigins }: AppDependencies,
  options: FastifyServerOptions = {}
) {
  const app = Fastify(options)
  await app.register(cors, { origin: corsOrigins })
  registerErrorHandlers(app)

  await app.register(createHealthModule({ checks: [database, redis] }).routes, {
    prefix: '/health',
  })

  return app
}
