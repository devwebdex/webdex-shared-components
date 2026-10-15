import { Controller, ForbiddenException, Get, Inject, UseGuards } from '@nestjs/common'
import type { Address } from 'viem'
import { SessionAddress, SessionGuard } from '../auth/session.guard.js'
import { ACCESS_SERVICE } from './access.providers.js'
import { type AccessService, ADMIN_ROLE } from './access.service.js'

@Controller('access')
@UseGuards(SessionGuard)
export class AccessController {
  constructor(@Inject(ACCESS_SERVICE) private readonly access: AccessService) {}

  // Exemplo de acesso por contrato: copie para os papéis do projeto.
  @Get('admin')
  async admin(@SessionAddress() address: Address) {
    if (!(await this.access.hasRole(ADMIN_ROLE, address))) {
      throw new ForbiddenException('Acesso negado')
    }
    return { address, role: 'admin' }
  }
}
