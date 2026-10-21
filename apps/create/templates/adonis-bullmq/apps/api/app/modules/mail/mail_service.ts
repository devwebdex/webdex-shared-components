import app from '@adonisjs/core/services/app'
import { Queue } from 'bullmq'
import { MAIL_QUEUE, type SendMailJob } from '#modules/mail/mail_job'
import env from '#start/env'

// Aberta no primeiro envio: importar o service (num comando Ace, por exemplo) não conecta no Redis.
let queue: Queue<SendMailJob> | undefined

/** Produtor: quem precisa enviar e-mail injeta o MailService e chama send(). */
export default class MailService {
  send(mail: SendMailJob) {
    queue ??= openQueue()
    return queue.add('send-mail', mail)
  }
}

function openQueue() {
  const opened = new Queue<SendMailJob>(MAIL_QUEUE, { connection: { url: env.get('REDIS_URL') } })
  app.terminating(() => opened.close())
  return opened
}
