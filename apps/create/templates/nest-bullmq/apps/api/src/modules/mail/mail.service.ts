import { InjectQueue } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { Queue } from 'bullmq'
import { MAIL_QUEUE, type SendMailJob } from './mail.queue.js'

/** Produtor: quem precisa enviar e-mail importa o MailModule e chama send(). */
@Injectable()
export class MailService {
  constructor(@InjectQueue(MAIL_QUEUE) private readonly queue: Queue<SendMailJob>) {}

  send(mail: SendMailJob) {
    return this.queue.add('send-mail', mail)
  }
}
