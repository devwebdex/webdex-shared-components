// API pública do módulo: outros módulos e o worker só importam deste arquivo.
export { processSendMail } from './mail.processor.js'
export { createMailQueue, MAIL_QUEUE, type SendMailJob } from './mail.queue.js'
