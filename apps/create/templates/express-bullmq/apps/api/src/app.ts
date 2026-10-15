import cors from 'cors'
import express from 'express'
import { createHealthModule } from './modules/health/index.js'
import type { DatabaseConnection } from './shared/database/database.js'
import { errorHandler, notFoundHandler } from './shared/http/error-handler.js'
import type { RedisConnection } from './shared/queue/redis.js'

export type AppDependencies = {
  database: DatabaseConnection
  redis: RedisConnection
  corsOrigins: string[]
}

/** Composição do app: cada módulo recebe só as dependências de que precisa. */
export function createApp({ database, redis, corsOrigins }: AppDependencies) {
  const app = express()
  app.disable('x-powered-by')
  app.use(cors({ origin: corsOrigins }))
  app.use(express.json())

  app.use('/health', createHealthModule({ checks: [database, redis] }).router)

  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}
