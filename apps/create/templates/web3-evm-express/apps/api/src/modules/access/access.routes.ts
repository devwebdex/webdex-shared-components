import { Router } from 'express'
import { HttpError } from '../../shared/http/http-error.js'
import { sessionOf } from '../auth/index.js'
import { type AccessService, ADMIN_ROLE } from './access.service.js'

export type AccessRouterDependencies = {
  accessService: AccessService
}

export function createAccessRouter({ accessService }: AccessRouterDependencies) {
  const router = Router()

  // Exemplo de acesso por contrato: copie para os papéis do projeto.
  router.get('/admin', async (_req, res) => {
    const { address } = sessionOf(res)
    if (!(await accessService.hasRole(ADMIN_ROLE, address))) {
      throw new HttpError(403, 'Acesso negado')
    }
    res.json({ address, role: 'admin' })
  })

  return router
}
