import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'
import { QueueEvents, Worker } from 'bullmq'
import { MAIL_QUEUE } from '#modules/mail/mail_job'
import { processSendMail } from '#modules/mail/mail_processor'
import MailService from '#modules/mail/mail_service'
import env from '#start/env'

test.group('fila mail (Redis real)', () => {
  test('o worker processa o e-mail enviado pelo service', async ({ assert, cleanup }) => {
    const connection = { url: env.get('REDIS_URL') }
    const worker = new Worker(MAIL_QUEUE, processSendMail, { connection })
    const events = new QueueEvents(MAIL_QUEUE, { connection })
    cleanup(async () => {
      await Promise.all([worker.close(), events.close()])
    })
    await events.waitUntilReady()

    const mail = await app.container.make(MailService)
    const job = await mail.send({ to: 'dev@example.com', subject: 'Teste', body: 'Olá' })
    const result = await job.waitUntilFinished(events)
    assert.properties(result, ['sentAt'])
  })
})
