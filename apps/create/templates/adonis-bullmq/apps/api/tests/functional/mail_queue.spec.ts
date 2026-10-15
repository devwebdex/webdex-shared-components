import { test } from '@japa/runner'
import { QueueEvents, Worker } from 'bullmq'
import { MAIL_QUEUE } from '#modules/mail/mail_job'
import { processSendMail } from '#modules/mail/mail_processor'
import mailQueue from '#modules/mail/mail_queue'
import env from '#start/env'

test.group('fila mail (Redis real)', () => {
  test('o worker processa o job enfileirado', async ({ assert, cleanup }) => {
    const connection = { url: env.get('REDIS_URL') }
    const worker = new Worker(MAIL_QUEUE, processSendMail, { connection })
    const events = new QueueEvents(MAIL_QUEUE, { connection })
    cleanup(async () => {
      await Promise.all([worker.close(), events.close()])
    })
    await events.waitUntilReady()

    const job = await mailQueue.add('send-mail', {
      to: 'dev@example.com',
      subject: 'Teste',
      body: 'Olá',
    })
    const result = await job.waitUntilFinished(events)
    assert.properties(result, ['sentAt'])
  })
})
