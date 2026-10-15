import app from '@adonisjs/core/services/app'
import { Queue } from 'bullmq'
import { MAIL_QUEUE, type SendMailJob } from '#modules/mail/mail_job'
import env from '#start/env'

/** Produtor: quem precisa enviar e-mail importa esta fila e chama add('send-mail', dados). */
const mailQueue = new Queue<SendMailJob>(MAIL_QUEUE, { connection: { url: env.get('REDIS_URL') } })
app.terminating(() => mailQueue.close())

export default mailQueue
