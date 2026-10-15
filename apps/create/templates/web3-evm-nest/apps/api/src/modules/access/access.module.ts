import { Module } from '@nestjs/common'
import { ChainModule } from '../../shared/chain/chain.module.js'
import { AuthModule } from '../auth/auth.module.js'
import { AccessController } from './access.controller.js'
import { accessServiceProvider } from './access.providers.js'

@Module({
  imports: [ChainModule, AuthModule],
  controllers: [AccessController],
  providers: [accessServiceProvider],
})
export class AccessModule {}
