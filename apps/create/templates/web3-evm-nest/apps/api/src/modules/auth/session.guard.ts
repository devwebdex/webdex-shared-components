import {
  type CanActivate,
  createParamDecorator,
  type ExecutionContext,
//#if session=cookie
  ForbiddenException,
//#endif
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import type { Request } from 'express'
import type { Address } from 'viem'
//#if session=cookie
import { CHAIN_CONFIG } from '../../shared/chain/chain.module.js'
import type { ChainConfig } from '../../shared/chain/chain-config.js'
//#endif
import { AUTH_SERVICE } from './auth.providers.js'
import type { AuthService } from './auth.service.js'
import { SessionTransport } from './session.transport.js'

type AuthenticatedRequest = Request & { sessionAddress?: Address }

/** Rota com sessão: sem sessão válida responde 401; com ela, @SessionAddress() entrega o endereço. */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    @Inject(AUTH_SERVICE) private readonly auth: AuthService,
    private readonly transport: SessionTransport
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const token = this.transport.read(request)
    const session = token ? await this.auth.findSession(token) : undefined
    if (!session) throw new UnauthorizedException('Não autenticado')
    request.sessionAddress = session.address
    return true
  }
}

/** Endereço da sessão (com checksum), nunca o enviado pelo cliente. Só em rotas com SessionGuard. */
export const SessionAddress = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const address = context.switchToHttp().getRequest<AuthenticatedRequest>().sessionAddress
  if (!address) throw new Error('@SessionAddress() exige @UseGuards(SessionGuard) na rota')
  return address
})
//#if session=cookie

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/** CSRF do cookie de sessão: o que muda estado só vale vindo do frontend (Origin igual a SIWE_ORIGIN). */
@Injectable()
export class SameOriginGuard implements CanActivate {
  constructor(@Inject(CHAIN_CONFIG) private readonly config: ChainConfig) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>()
    if (UNSAFE_METHODS.has(request.method) && request.headers.origin !== this.config.siweOrigin) {
      throw new ForbiddenException('Origem não permitida')
    }
    return true
  }
}
//#endif
