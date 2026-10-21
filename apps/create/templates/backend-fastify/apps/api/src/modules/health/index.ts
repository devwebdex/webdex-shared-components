import { healthRoutes } from './health.routes.js'
import { type HealthCheck, HealthService } from './health.service.js'

export type { HealthCheck }

// API pública do módulo: outros módulos e o app.ts só importam deste arquivo.
export function createHealthModule({ checks }: { checks: HealthCheck[] }) {
  return { routes: healthRoutes(new HealthService(checks)) }
}
