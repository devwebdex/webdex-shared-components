export const MAIL_QUEUE = 'mail'

export type SendMailJob = {
  to: string
  subject: string
  body: string
}
