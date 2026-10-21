import type { FastifyPluginAsync } from 'fastify'
import { HttpError } from '../../shared/http/http-error.js'
import { parseInput } from '../../shared/http/validation.js'
import { verifySchema } from './auth.schemas.js'
import type { AuthService } from './auth.service.js'
import { type SessionTransport, sessionOf } from './session.js'

type AuthRoutesDependencies = {
  authService: AuthService
  transport: SessionTransport
}

export function authRoutes({ authService, transport }: AuthRoutesDependencies): FastifyPluginAsync {
  return async (app) => {
    app.get('/nonce', { config: { public: true } }, async () => ({
      nonce: await authService.createNonce(),
    }))

    // O login só recebe uma mensagem SIWE curta: corpo de até 32 KB, não o 1 MB padrão.
    app.post(
      '/verify',
      { config: { public: true }, bodyLimit: 32 * 1024 },
      async (request, reply) => {
        const session = await authService.verify(parseInput(verifySchema, request.body))
        if (!session) throw new HttpError(401, 'Não autenticado')
        return transport.issue(reply, session)
      }
    )

    app.get('/me', async (request) => ({ address: sessionOf(request).address }))

    app.post('/logout', async (request, reply) => {
      const token = transport.read(request)
      if (!token) throw new HttpError(401, 'Não autenticado')
      await authService.logout(token)
      return transport.clear(reply)
    })
  }
}
