//#if session=cookie
import { type ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common'
//#else
import { type ExecutionContext, UnauthorizedException } from '@nestjs/common'
//#endif
import { Reflector } from '@nestjs/core'
//#if session=cookie
import type { Request, Response } from 'express'
import { describe, expect, it, vi } from 'vitest'
//#else
import type { Request } from 'express'
import { describe, expect, it } from 'vitest'
//#endif
//#if session=cookie
import type { ChainConfig } from '../../shared/chain/chain-config.js'
//#endif
import type { AuthService } from './auth.service.js'
//#if session=cookie
import { Public, SameOriginGuard, SessionGuard } from './session.guard.js'
//#else
import { Public, SessionGuard } from './session.guard.js'
//#endif
import { SessionTransport } from './session.transport.js'

const address = '0xd2135CfB216b74109775236E36d4b433F1DF507B'

class Routes {
  protected() {}

  @Public()
  open() {}
}

function contextFor(request: Partial<Request>, handler: keyof Routes = 'protected') {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => Routes.prototype[handler],
    getClass: () => Routes,
  } as unknown as ExecutionContext
}

// Serviço falso: só o token 'valido' tem sessão.
const auth = {
  findSession: async (token: string) => (token === 'valido' ? { address } : undefined),
} as unknown as AuthService

//#if session=cookie
const config = { siweOrigin: 'http://localhost:3000' } as ChainConfig
const guard = new SessionGuard(auth, new SessionTransport(config), new Reflector())
const withToken = (token: string) => ({ headers: { cookie: `tema=escuro; session=${token}` } })
//#else
const guard = new SessionGuard(auth, new SessionTransport(), new Reflector())
const withToken = (token: string) => ({ headers: { authorization: `Bearer ${token}` } })
//#endif

describe('SessionGuard', () => {
  it('libera a rota com sessão válida e guarda o endereço da sessão', async () => {
    const request: Partial<Request> & { sessionAddress?: string } = withToken('valido')
    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true)
    expect(request.sessionAddress).toBe(address)
  })

  it('responde 401 sem token ou com sessão desconhecida', async () => {
    const missing = guard.canActivate(contextFor({ headers: {} }))
    await expect(missing).rejects.toThrow(UnauthorizedException)
    const unknown = guard.canActivate(contextFor(withToken('outro')))
    await expect(unknown).rejects.toThrow(UnauthorizedException)
  })

  it('libera sem sessão só a rota marcada com @Public()', async () => {
    await expect(guard.canActivate(contextFor({ headers: {} }, 'open'))).resolves.toBe(true)
  })
})
//#if session=cookie

describe('SessionTransport', () => {
  const cookieOf = (siweOrigin: string) => {
    const transport = new SessionTransport({ siweOrigin } as ChainConfig)
    const response = { cookie: vi.fn() }
    transport.issue(response as unknown as Response, { token: 'abc', expiresAt: new Date() })
    const read = (cookie: string) => transport.read({ headers: { cookie } } as Request)
    return { call: response.cookie.mock.calls[0], read }
  }

  it('em https, o cookie se chama __Host-session, é Secure e não tem Domain', () => {
    const { call, read } = cookieOf('https://app.example.com')
    expect(call?.[0]).toBe('__Host-session')
    expect(call?.[2]).toMatchObject({ secure: true, path: '/' })
    expect(call?.[2]).not.toHaveProperty('domain')
    expect(read('__Host-session=abc')).toBe('abc')
    // Sem o prefixo, o cookie poderia ter sido gravado por um subdomínio: não vale como sessão.
    expect(read('session=abc')).toBeUndefined()
  })

  it('em http (desenvolvimento), o cookie se chama session e não é Secure', () => {
    const { call, read } = cookieOf('http://localhost:3000')
    expect(call?.[0]).toBe('session')
    expect(call?.[2]).toMatchObject({ secure: false })
    expect(read('session=abc')).toBe('abc')
  })
})

describe('SameOriginGuard', () => {
  const sameOrigin = new SameOriginGuard(config)
  const check = (method: string, origin?: string) => () =>
    sameOrigin.canActivate(contextFor({ method, headers: origin ? { origin } : {} }))

  it('libera leitura de qualquer origem e escrita vinda do frontend', () => {
    expect(check('GET')()).toBe(true)
    expect(check('POST', config.siweOrigin)()).toBe(true)
  })

  it('responde 403 a escrita de outra origem ou sem Origin', () => {
    expect(check('POST', 'https://evil.example.com')).toThrow(ForbiddenException)
    expect(check('DELETE')).toThrow(ForbiddenException)
  })
})
//#endif
