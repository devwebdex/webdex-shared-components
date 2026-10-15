//#if session=cookie
import { type ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common'
//#else
import { type ExecutionContext, UnauthorizedException } from '@nestjs/common'
//#endif
import type { Request } from 'express'
import { describe, expect, it } from 'vitest'
//#if session=cookie
import type { ChainConfig } from '../../shared/chain/chain-config.js'
//#endif
import type { AuthService } from './auth.service.js'
//#if session=cookie
import { SameOriginGuard, SessionGuard } from './session.guard.js'
//#else
import { SessionGuard } from './session.guard.js'
//#endif
import { SessionTransport } from './session.transport.js'

const address = '0xd2135CfB216b74109775236E36d4b433F1DF507B'

function contextFor(request: Partial<Request>) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext
}

// Serviço falso: só o token 'valido' tem sessão.
const auth = {
  findSession: async (token: string) => (token === 'valido' ? { address } : undefined),
} as unknown as AuthService

//#if session=cookie
const config = { siweOrigin: 'https://app.example.com' } as ChainConfig
const guard = new SessionGuard(auth, new SessionTransport(config))
const withToken = (token: string) => ({ headers: { cookie: `tema=escuro; session=${token}` } })
//#else
const guard = new SessionGuard(auth, new SessionTransport())
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
})
//#if session=cookie

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
