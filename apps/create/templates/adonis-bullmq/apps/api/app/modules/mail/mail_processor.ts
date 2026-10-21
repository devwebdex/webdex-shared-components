import logger from '@adonisjs/core/services/logger'
import type { Job } from 'bullmq'
import type { SendMailJob } from '#modules/mail/mail_job'

// Roda só no worker. O log ocupa o lugar do provedor de e-mail (SMTP, SES...), que o projeto escolhe.
export async function processSendMail(job: Job<SendMailJob>) {
  logger.info(`[mail] job ${job.id}: "${job.data.subject}"`)
  return { sentAt: new Date().toISOString() }
}
