import type { FastifyPluginAsync } from 'fastify'
import type { HealthService } from './health.service.js'

export function healthRoutes(service: HealthService): FastifyPluginAsync {
  return async (app) => {
//#if web3=evm
    app.get('/', { config: { public: true } }, async () => {
//#else
    app.get('/', async () => {
//#endif
      await service.check()
      return { status: 'ok' }
    })
  }
}
