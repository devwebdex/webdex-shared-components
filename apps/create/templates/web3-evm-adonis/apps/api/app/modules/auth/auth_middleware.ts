import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Address } from 'viem'
import AuthService from '#modules/auth/auth_service'
import { readSessionToken } from '#modules/auth/session_transport'

/**
 * Únicas rotas sem sessão (docs/standards/security.md: rota pública é exceção explícita). Rota nova
 * exige sessão até entrar aqui, como `MÉTODO /padrão`, com o padrão igual ao de start/routes.ts.
 */
export const PUBLIC_ROUTES = new Set([
  'GET /health',
  // O login SIWE acontece antes de existir sessão.
  'GET /auth/nonce',
  'POST /auth/verify',
  //#if frontend=inertia
  // Página inicial, onde a carteira se conecta.
  'GET /',
  //#endif
])

/** Exige a sessão do login SIWE em toda rota (router.use em start/kernel.ts), exceto PUBLIC_ROUTES. */
@inject()
export default class AuthMiddleware {
  constructor(private readonly auth: AuthService) {}

  async handle(ctx: HttpContext, next: NextFn) {
    if (PUBLIC_ROUTES.has(`${ctx.request.method()} ${ctx.route?.pattern}`)) return next()

    const token = readSessionToken(ctx.request)
    const address = token ? await this.auth.sessionAddress(token) : null
    if (!address) return ctx.response.unauthorized({ message: 'Sessão ausente ou expirada' })
    ctx.wallet = { address }
    return next()
  }
}

declare module '@adonisjs/core/http' {
  interface HttpContext {
    /** Definido pelo AuthMiddleware nas rotas com sessão; nunca um endereço enviado pelo cliente. */
    wallet: { address: Address }
  }
}
