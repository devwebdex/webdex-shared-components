import { Controller, Get } from '@nestjs/common'
//#if web3=evm
import { Public } from '../auth/session.guard.js'
//#endif
import { HealthService } from './health.service.js'

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
//#if web3=evm
  @Public()
//#endif
  async check() {
    await this.health.check()
    return { status: 'ok' }
  }
}
