import type { DatabaseHealth } from '../../shared/database/database-health.js'
import { healthRoutes } from './health.routes.js'
import { HealthService } from './health.service.js'

// API pública do módulo: outros módulos e o app.ts só importam deste arquivo.
export function createHealthModule({ database }: { database: DatabaseHealth }) {
  return { routes: healthRoutes(new HealthService(database)) }
}
