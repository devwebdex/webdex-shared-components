import { Module } from '@nestjs/common'
import { HealthModule } from './modules/health/health.module.js'
import { MailModule } from './modules/mail/mail.module.js'
import { DatabaseModule } from './shared/database/database.module.js'
import { QueueModule } from './shared/queue/queue.module.js'

@Module({
  imports: [DatabaseModule, QueueModule, HealthModule, MailModule],
})
export class AppModule {}
