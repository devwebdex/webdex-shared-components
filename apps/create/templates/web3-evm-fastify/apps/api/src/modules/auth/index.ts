import type { FastifyInstance } from 'fastify'
import { authRoutes } from './auth.routes.js'
import type { AuthService } from './auth.service.js'
//#if session=cookie
import { cookieTransport, createAuthenticate, requireSession } from './session.js'
//#else
import { bearerTransport, createAuthenticate, requireSession } from './session.js'
//#endif

export { createAuthRepository } from './auth.repository.js'
export { type AuthService, createAuthService } from './auth.service.js'
//#if session=cookie
export { rejectCrossSiteRequests, type Session, sessionOf } from './session.js'
//#else
export { type Session, sessionOf } from './session.js'
//#endif

// API pública do módulo: outros módulos e o app.ts só importam deste arquivo.
//#if session=cookie
export function createAuthModule({
  authService,
  siweOrigin,
}: {
  authService: AuthService
  siweOrigin: string
}) {
  const transport = cookieTransport(siweOrigin)
//#else
export function createAuthModule({ authService }: { authService: AuthService }) {
  const transport = bearerTransport
//#endif
  const authenticate = createAuthenticate(authService, transport)
  return {
    routes: authRoutes({ authService, transport }),
    /** Hook global que nega por padrão; registre antes das rotas. */
    requireSession: (app: FastifyInstance) => requireSession(app, authenticate),
  }
}
