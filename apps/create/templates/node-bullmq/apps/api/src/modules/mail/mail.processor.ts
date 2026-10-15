import type { Job } from 'bullmq'
import type { SendMailJob } from './mail.queue.js'

// Roda só no worker. O log ocupa o lugar do provedor de e-mail (SMTP, SES...), que o projeto escolhe.
export async function processSendMail(job: Job<SendMailJob>) {
  console.log(`[mail] job ${job.id}: "${job.data.subject}"`)
  return { sentAt: new Date().toISOString() }
}
