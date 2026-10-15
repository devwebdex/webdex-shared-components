import type { HttpContext } from '@adonisjs/core/http'
//#if session=cookie
import app from '@adonisjs/core/services/app'
import type { NextFn } from '@adonisjs/core/types/http'
import web3Config from '#config/web3'
import { SESSION_TTL_SECONDS } from '#modules/auth/auth_service'

const SESSION_COOKIE = 'session'
const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/**
 * CSRF do cookie de sessão, para toda a app (start/kernel.ts): o navegador manda o cookie em
 * qualquer requisição ao site, então método que muda estado só passa vindo da origem do frontend.
 */
export default class SameOriginMiddleware {
  handle({ request, response }: HttpContext, next: NextFn) {
    if (
      STATE_CHANGING_METHODS.has(request.method()) &&
      request.header('origin') !== web3Config.siwe.origin
    ) {
      return response.forbidden({ message: 'Origem não permitida' })
    }
    return next()
  }
}

// Cookie simples, sem a assinatura do Adonis: o valor já é um token aleatório de 256 bits, conferido
// pelo hash no banco; assinar não acrescenta proteção e prenderia as sessões ao APP_KEY.
export function setSessionCookie(response: HttpContext['response'], token: string) {
  response.plainCookie(SESSION_COOKIE, token, {
    encode: false,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
    secure: app.inProduction,
  })
}

export function clearSessionCookie(response: HttpContext['response']) {
  response.clearCookie(SESSION_COOKIE, { path: '/' })
}

export function readSessionToken(request: HttpContext['request']): string | undefined {
  return request.plainCookie(SESSION_COOKIE, { encoded: false })
}
//#else

export function readSessionToken(request: HttpContext['request']): string | undefined {
  const [scheme, token] = (request.header('authorization') ?? '').split(' ')
  return scheme === 'Bearer' && token ? token : undefined
}
//#endif
