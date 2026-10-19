import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { MAIL_QUEUE } from './mail.queue.js'
import { MailService } from './mail.service.js'

@Module({
  imports: [BullModule.registerQueue({ name: MAIL_QUEUE })],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
