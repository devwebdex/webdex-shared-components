import { Module } from '@nestjs/common'
import { MailWorkerModule } from './modules/mail/mail-worker.module.js'
import { DatabaseModule } from './shared/database/database.module.js'
import { QueueModule } from './shared/queue/queue.module.js'

@Module({
  imports: [DatabaseModule, QueueModule, MailWorkerModule],
})
export class WorkerModule {}
