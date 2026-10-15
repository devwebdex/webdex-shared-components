import { Router } from 'express'
import { HttpError } from '../../shared/http/http-error.js'
import { parseInput } from '../../shared/http/validation.js'
import { verifySchema } from './auth.schemas.js'
import type { AuthService } from './auth.service.js'
import type { Authenticate, SessionTransport } from './session.js'

type AuthRouterDependencies = {
  authService: AuthService
  transport: SessionTransport
  authenticate: Authenticate
}

export function createAuthRouter({ authService, transport, authenticate }: AuthRouterDependencies) {
  const router = Router()

  router.get('/nonce', async (_req, res) => {
    res.json({ nonce: await authService.createNonce() })
  })

  router.post('/verify', async (req, res) => {
    const session = await authService.verify(parseInput(verifySchema, req.body))
    if (!session) throw new HttpError(401, 'Não autenticado')
    transport.issue(res, session)
  })

  router.get('/me', async (req, res) => {
    const { address } = await authenticate(req)
    res.json({ address })
  })

  router.post('/logout', async (req, res) => {
    const token = transport.read(req)
    if (!token) throw new HttpError(401, 'Não autenticado')
    await authService.logout(token)
    transport.clear(res)
  })

  return router
}
