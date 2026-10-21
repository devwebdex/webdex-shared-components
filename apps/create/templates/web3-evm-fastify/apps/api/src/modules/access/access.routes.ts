import type { FastifyPluginAsync } from 'fastify'
import { HttpError } from '../../shared/http/http-error.js'
import { sessionOf } from '../auth/index.js'
import { type AccessService, ADMIN_ROLE } from './access.service.js'

export type AccessRoutesDependencies = {
  accessService: AccessService
}

export function accessRoutes({ accessService }: AccessRoutesDependencies): FastifyPluginAsync {
  return async (app) => {
    // Exemplo de acesso por contrato: copie para os papéis do projeto.
    app.get('/admin', async (request) => {
      const { address } = sessionOf(request)
      if (!(await accessService.hasRole(ADMIN_ROLE, address))) {
        throw new HttpError(403, 'Acesso negado')
      }
      return { address, role: 'admin' }
    })
  }
}
