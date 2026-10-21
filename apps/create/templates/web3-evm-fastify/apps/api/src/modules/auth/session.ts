import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import type { Address } from 'viem'
import { HttpError } from '../../shared/http/http-error.js'
//#if session=cookie
import { type AuthService, type NewSession, SESSION_TTL_SECONDS } from './auth.service.js'
//#else
import type { AuthService, NewSession } from './auth.service.js'
//#endif

/** Como a sessão viaja entre o frontend e a API (escolhido na criação do projeto). */
export type SessionTransport = {
  read(request: FastifyRequest): string | undefined
  /** Responde ao login com a sessão criada. */
  issue(reply: FastifyReply, session: NewSession): FastifyReply
  /** Responde ao logout. */
  clear(reply: FastifyReply): FastifyReply
}

export type Session = { address: Address }

export type Authenticate = (request: FastifyRequest) => Promise<Session>

declare module 'fastify' {
  interface FastifyContextConfig {
    /** Rota sem sessão: exceção explícita à negação por padrão (requireSession). */
    public?: boolean
  }
  interface FastifyRequest {
    session: Session | null
  }
}

/** Endereço da sessão da requisição; sem sessão válida, 401. */
export function createAuthenticate(
  authService: AuthService,
  transport: SessionTransport
): Authenticate {
  return async (request) => {
    const token = transport.read(request)
    const session = token ? await authService.findSession(token) : undefined
    if (!session) throw new HttpError(401, 'Não autenticado')
    return session
  }
}

/**
 * Nega por padrão (docs/standards/security.md): toda rota exige sessão válida, menos as marcadas
 * com `config: { public: true }`. Rota inexistente segue para o 404.
 */
export function requireSession(app: FastifyInstance, authenticate: Authenticate) {
  app.decorateRequest('session', null)
  app.addHook('onRequest', async (request) => {
    if (request.is404 || request.routeOptions.config.public) return
    request.session = await authenticate(request)
  })
}

/** Sessão gravada pelo requireSession: o endereço vem dela, nunca do corpo da requisição. */
export function sessionOf(request: FastifyRequest): Session {
  if (!request.session) throw new HttpError(401, 'Não autenticado')
  return request.session
}
//#if session=cookie

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export function cookieTransport(siweOrigin: string): SessionTransport {
  // Secure com o frontend em https (produção); em http://localhost o navegador recusaria o cookie.
  const secure = new URL(siweOrigin).protocol === 'https:'
  // O prefixo __Host- (exige Secure, Path=/ e nenhum Domain) impede que um subdomínio grave um
  // cookie com o mesmo nome e fixe a sessão de outra pessoa.
  const name = secure ? '__Host-session' : 'session'
  const options = { httpOnly: true, sameSite: 'lax', path: '/', secure } as const
  return {
    read: (request) => request.cookies[name],
    issue: (reply, { token }) =>
      reply
        .setCookie(name, token, { ...options, maxAge: SESSION_TTL_SECONDS })
        .status(204)
        .send(),
    clear: (reply) => reply.clearCookie(name, options).status(204).send(),
  }
}

/** CSRF do cookie de sessão: o que muda estado só vale vindo do frontend (Origin igual a SIWE_ORIGIN). */
export function rejectCrossSiteRequests(siweOrigin: string) {
  return async (request: FastifyRequest) => {
    if (UNSAFE_METHODS.has(request.method) && request.headers.origin !== siweOrigin) {
      throw new HttpError(403, 'Origem não permitida')
    }
  }
}
//#else

export const bearerTransport: SessionTransport = {
  read: (request) => /^Bearer (\S+)$/.exec(request.headers.authorization ?? '')?.[1],
  issue: (reply, { token, expiresAt }) => reply.send({ token, expiresAt: expiresAt.toISOString() }),
  clear: (reply) => reply.status(204).send(),
}
//#endif
