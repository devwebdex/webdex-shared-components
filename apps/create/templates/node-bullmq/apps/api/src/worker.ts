import 'dotenv/config'
import { Worker } from 'bullmq'
import { MAIL_QUEUE, processSendMail } from './modules/mail/index.js'
import { env } from './shared/config/env.js'

// Processo separado da API. Com a URL, o BullMQ abre (e fecha) a conexão do jeito que o Worker exige.
const connection = { url: env.redisUrl }
const workers = [new Worker(MAIL_QUEUE, processSendMail, { connection })]
console.log(`Worker processando: ${workers.map((worker) => worker.name).join(', ')}`)

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, () => {
    void Promise.all(workers.map((worker) => worker.close()))
  })
}
