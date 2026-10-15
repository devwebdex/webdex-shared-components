import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common'
import type { Request, Response } from 'express'
import type { Address } from 'viem'
import { AUTH_SERVICE } from './auth.providers.js'
import type { AuthService } from './auth.service.js'
import { VerifyDto } from './dto/verify.dto.js'
import { Public, SessionAddress } from './session.guard.js'
import { SessionTransport } from './session.transport.js'

// Contrato das rotas: docs/standards/web3.md, seção "Login gerado com o projeto".
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTH_SERVICE) private readonly auth: AuthService,
    private readonly transport: SessionTransport
  ) {}

  @Get('nonce')
  @Public()
  async nonce() {
    return { nonce: await this.auth.createNonce() }
  }

  @Post('verify')
  @Public()
//#if session=cookie
  @HttpCode(204)
//#else
  @HttpCode(200)
//#endif
  async verify(@Body() credentials: VerifyDto, @Res({ passthrough: true }) response: Response) {
    const session = await this.auth.verify(credentials)
    if (!session) throw new UnauthorizedException('Não autenticado')
    return this.transport.issue(response, session)
  }

  @Get('me')
  me(@SessionAddress() address: Address) {
    return { address }
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const token = this.transport.read(request)
    if (!token) throw new UnauthorizedException('Não autenticado')
    await this.auth.logout(token)
    this.transport.clear(response)
  }
}
