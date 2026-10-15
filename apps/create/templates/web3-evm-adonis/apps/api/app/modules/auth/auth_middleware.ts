import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Address } from 'viem'
import AuthService from '#modules/auth/auth_service'
import { readSessionToken } from '#modules/auth/session_transport'

/** Middleware nomeado `auth`: exige a sessão do login SIWE e expõe o endereço em ctx.wallet. */
@inject()
export default class AuthMiddleware {
  constructor(private readonly auth: AuthService) {}

  async handle(ctx: HttpContext, next: NextFn) {
    const token = readSessionToken(ctx.request)
    const address = token ? await this.auth.sessionAddress(token) : null
    if (!address) return ctx.response.unauthorized({ message: 'Sessão ausente ou expirada' })
    ctx.wallet = { address }
    return next()
  }
}

declare module '@adonisjs/core/http' {
  interface HttpContext {
    /** Definido pelo middleware `auth`; o endereço é o da sessão, nunca um enviado pelo cliente. */
    wallet: { address: Address }
  }
}
