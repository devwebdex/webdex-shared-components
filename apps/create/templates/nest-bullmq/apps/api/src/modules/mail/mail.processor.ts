import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import type { Job } from 'bullmq'
import { MAIL_QUEUE, type SendMailJob } from './mail.queue.js'

// Roda só no worker. O log ocupa o lugar do provedor de e-mail (SMTP, SES...), que o projeto escolhe.
@Processor(MAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name)

  async process(job: Job<SendMailJob>) {
    this.logger.log(`job ${job.id}: "${job.data.subject}"`)
    return { sentAt: new Date().toISOString() }
  }
}
