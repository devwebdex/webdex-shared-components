import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { MailProcessor } from './mail.processor.js'
import { MAIL_QUEUE } from './mail.queue.js'

// Só o WorkerModule importa este módulo: a API enfileira, o worker processa.
@Module({
  imports: [BullModule.registerQueue({ name: MAIL_QUEUE })],
  providers: [MailProcessor],
})
export class MailWorkerModule {}
