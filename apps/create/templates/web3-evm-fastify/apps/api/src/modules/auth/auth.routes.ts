import type { FastifyPluginAsync } from 'fastify'
import { HttpError } from '../../shared/http/http-error.js'
import { parseInput } from '../../shared/http/validation.js'
import { verifySchema } from './auth.schemas.js'
import type { AuthService } from './auth.service.js'
import type { Authenticate, SessionTransport } from './session.js'

type AuthRoutesDependencies = {
  authService: AuthService
  transport: SessionTransport
  authenticate: Authenticate
}

export function authRoutes({
  authService,
  transport,
  authenticate,
}: AuthRoutesDependencies): FastifyPluginAsync {
  return async (app) => {
    app.get('/nonce', async () => ({ nonce: await authService.createNonce() }))

    app.post('/verify', async (request, reply) => {
      const session = await authService.verify(parseInput(verifySchema, request.body))
      if (!session) throw new HttpError(401, 'Não autenticado')
      return transport.issue(reply, session)
    })

    app.get('/me', async (request) => {
      const { address } = await authenticate(request)
      return { address }
    })

    app.post('/logout', async (request, reply) => {
      const token = transport.read(request)
      if (!token) throw new HttpError(401, 'Não autenticado')
      await authService.logout(token)
      return transport.clear(reply)
    })
  }
}
