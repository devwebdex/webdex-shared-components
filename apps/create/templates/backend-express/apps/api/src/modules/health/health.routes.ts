import { Router } from 'express'
import type { HealthService } from './health.service.js'

export function createHealthRouter(service: HealthService) {
  const router = Router()
  router.get('/', async (_req, res) => {
    await service.checkDatabase()
    res.json({ status: 'ok' })
  })
  return router
}
