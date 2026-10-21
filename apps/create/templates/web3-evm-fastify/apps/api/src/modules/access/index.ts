import { type AccessRoutesDependencies, accessRoutes } from './access.routes.js'

export { type AccessService, ADMIN_ROLE, createAccessService } from './access.service.js'

// API pública do módulo: outros módulos e o app.ts só importam deste arquivo.
export function createAccessModule(dependencies: AccessRoutesDependencies) {
  return { routes: accessRoutes(dependencies) }
}
