//#if session=cookie
import { Inject, Injectable } from '@nestjs/common'
import type { CookieOptions, Request, Response } from 'express'
import { CHAIN_CONFIG } from '../../shared/chain/chain.module.js'
import type { ChainConfig } from '../../shared/chain/chain-config.js'
import { type NewSession, SESSION_TTL_SECONDS } from './auth.service.js'

const COOKIE = 'session'

/** Como a sessão viaja entre o frontend e a API: cookie HttpOnly (escolhido na criação do projeto). */
@Injectable()
export class SessionTransport {
  private readonly options: CookieOptions

  constructor(@Inject(CHAIN_CONFIG) config: ChainConfig) {
    // Secure com o frontend em https (produção); em http://localhost o navegador recusaria o cookie.
    this.options = {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: new URL(config.siweOrigin).protocol === 'https:',
    }
  }

  read(request: Request) {
    // O token é base64url: o valor do cookie não precisa de decodificação.
    for (const pair of request.headers.cookie?.split(';') ?? []) {
      const [name, value] = pair.trim().split('=', 2)
      if (name === COOKIE && value) return value
    }
    return undefined
  }

  /** Resposta do login: 204 com o cookie. */
  issue(response: Response, { token }: NewSession) {
    response.cookie(COOKIE, token, { ...this.options, maxAge: SESSION_TTL_SECONDS * 1000 })
  }

  /** Resposta do logout: 204 apagando o cookie. */
  clear(response: Response) {
    response.clearCookie(COOKIE, this.options)
  }
}
//#else
import { Injectable } from '@nestjs/common'
import type { Request, Response } from 'express'
import type { NewSession } from './auth.service.js'

/** Como a sessão viaja entre o frontend e a API: token Bearer (escolhido na criação do projeto). */
@Injectable()
export class SessionTransport {
  read(request: Request) {
    return /^Bearer (\S+)$/.exec(request.headers.authorization ?? '')?.[1]
  }

  /** Resposta do login: 200 com o token, que o frontend guarda só em memória. */
  issue(_response: Response, { token, expiresAt }: NewSession) {
    return { token, expiresAt: expiresAt.toISOString() }
  }

  /** Resposta do logout: 204; a sessão já foi apagada no servidor. */
  clear(_response: Response) {}
}
//#endif
