import 'dotenv/config'
import { QueueEvents, Worker } from 'bullmq'
import { afterAll, describe, expect, it } from 'vitest'
import { createMailQueue, MAIL_QUEUE, processSendMail } from '../src/modules/mail/index.js'
import { env } from '../src/shared/config/env.js'
import { connectRedis } from '../src/shared/queue/redis.js'

describe('fila mail (Redis real)', () => {
  const redis = connectRedis(env.redisUrl)
  const queue = createMailQueue(redis.connection)
  const connection = { url: env.redisUrl }
  const worker = new Worker(MAIL_QUEUE, processSendMail, { connection })
  const events = new QueueEvents(MAIL_QUEUE, { connection })

  afterAll(async () => {
    await Promise.all([worker.close(), events.close(), queue.close()])
    await redis.close()
  })

  it('o worker processa o job enfileirado', async () => {
    await events.waitUntilReady()
    const job = await queue.add('send-mail', {
      to: 'dev@example.com',
      subject: 'Teste',
      body: 'Olá',
    })
    await expect(job.waitUntilFinished(events)).resolves.toHaveProperty('sentAt')
  })
})
