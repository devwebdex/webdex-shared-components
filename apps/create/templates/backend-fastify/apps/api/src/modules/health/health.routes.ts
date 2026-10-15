import type { FastifyPluginAsync } from 'fastify'
import type { HealthService } from './health.service.js'

export function healthRoutes(service: HealthService): FastifyPluginAsync {
  return async (app) => {
    app.get('/', async () => {
      await service.checkDatabase()
      return { status: 'ok' }
    })
  }
}
