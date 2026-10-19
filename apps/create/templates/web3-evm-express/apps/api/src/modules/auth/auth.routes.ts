import { Router } from 'express'
import { HttpError } from '../../shared/http/http-error.js'
import { parseInput } from '../../shared/http/validation.js'
import { verifySchema } from './auth.schemas.js'
import type { AuthService } from './auth.service.js'
import { type SessionTransport, sessionOf } from './session.js'

type AuthRouterDependencies = {
  authService: AuthService
  transport: SessionTransport
}

export function createAuthRouter({ authService, transport }: AuthRouterDependencies) {
  const router = Router()

  router.get('/nonce', async (_req, res) => {
    res.json({ nonce: await authService.createNonce() })
  })

  router.post('/verify', async (req, res) => {
    const session = await authService.verify(parseInput(verifySchema, req.body))
    if (!session) throw new HttpError(401, 'Não autenticado')
    transport.issue(res, session)
  })

  router.get('/me', (_req, res) => {
    res.json({ address: sessionOf(res).address })
  })

  router.post('/logout', async (req, res) => {
    const token = transport.read(req)
    if (!token) throw new HttpError(401, 'Não autenticado')
    await authService.logout(token)
    transport.clear(res)
  })

  return router
}
