import { BullModule } from '@nestjs/bullmq'
import { Global, Module } from '@nestjs/common'
import { env } from '../config/env.js'
import { QueueHealth } from './queue-health.js'

// Global: cada módulo registra as próprias filas com BullModule.registerQueue e herda esta conexão.
@Global()
@Module({
  imports: [BullModule.forRoot({ connection: { url: env.redisUrl } })],
  providers: [QueueHealth],
  exports: [QueueHealth],
})
export class QueueModule {}
