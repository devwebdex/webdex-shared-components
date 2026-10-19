import { type ConnectionOptions, Queue } from 'bullmq'

export const MAIL_QUEUE = 'mail'

export type SendMailJob = {
  to: string
  subject: string
  body: string
}

/** Produtor: quem precisa enviar e-mail recebe esta fila por parâmetro e chama add('send-mail', dados). */
export function createMailQueue(connection: ConnectionOptions) {
  return new Queue<SendMailJob>(MAIL_QUEUE, { connection })
}
