//#if session=cookie
import type { Request, RequestHandler, Response } from 'express'
//#else
import type { Request, Response } from 'express'
//#endif
import type { Address } from 'viem'
import { HttpError } from '../../shared/http/http-error.js'
//#if session=cookie
import { type AuthService, type NewSession, SESSION_TTL_SECONDS } from './auth.service.js'
//#else
import type { AuthService, NewSession } from './auth.service.js'
//#endif

/** Como a sessão viaja entre o frontend e a API (escolhido na criação do projeto). */
export type SessionTransport = {
  read(req: Request): string | undefined
  /** Responde ao login com a sessão criada. */
  issue(res: Response, session: NewSession): void
  /** Responde ao logout. */
  clear(res: Response): void
}

export type Authenticate = (req: Request) => Promise<{ address: Address }>

/** Endereço da sessão da requisição; sem sessão válida, 401. */
export function createAuthenticate(
  authService: AuthService,
  transport: SessionTransport
): Authenticate {
  return async (req) => {
    const token = transport.read(req)
    const session = token ? await authService.findSession(token) : undefined
    if (!session) throw new HttpError(401, 'Não autenticado')
    return session
  }
}
//#if session=cookie

const COOKIE = 'session'
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export function cookieTransport(siweOrigin: string): SessionTransport {
  // Secure com o frontend em https (produção); em http://localhost o navegador recusaria o cookie.
  const options = {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: new URL(siweOrigin).protocol === 'https:',
  } as const
  return {
    read(req) {
      const token: unknown = req.cookies?.[COOKIE]
      return typeof token === 'string' ? token : undefined
    },
    issue(res, { token }) {
      res.cookie(COOKIE, token, { ...options, maxAge: SESSION_TTL_SECONDS * 1000 })
      res.status(204).end()
    },
    clear(res) {
      res.clearCookie(COOKIE, options)
      res.status(204).end()
    },
  }
}

/** CSRF do cookie de sessão: o que muda estado só vale vindo do frontend (Origin igual a SIWE_ORIGIN). */
export function rejectCrossSiteRequests(siweOrigin: string): RequestHandler {
  return (req, _res, next) => {
    if (UNSAFE_METHODS.has(req.method) && req.get('origin') !== siweOrigin) {
      throw new HttpError(403, 'Origem não permitida')
    }
    next()
  }
}
//#else

export const bearerTransport: SessionTransport = {
  read(req) {
    return /^Bearer (\S+)$/.exec(req.get('authorization') ?? '')?.[1]
  },
  issue(res, { token, expiresAt }) {
    res.json({ token, expiresAt: expiresAt.toISOString() })
  },
  clear(res) {
    res.status(204).end()
  },
}
//#endif
