import 'dotenv/config'
import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'
import { QueueEvents } from 'bullmq'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { MailModule } from '../src/modules/mail/mail.module.js'
import { MAIL_QUEUE } from '../src/modules/mail/mail.queue.js'
import { MailService } from '../src/modules/mail/mail.service.js'
import { MailWorkerModule } from '../src/modules/mail/mail-worker.module.js'
import { env } from '../src/shared/config/env.js'
import { QueueModule } from '../src/shared/queue/queue.module.js'

describe('fila mail (Redis real)', () => {
  let moduleRef: TestingModule
  const events = new QueueEvents(MAIL_QUEUE, { connection: { url: env.redisUrl } })

  // API e worker no mesmo processo só aqui, para o teste enfileirar e ver o job terminar.
  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [QueueModule, MailModule, MailWorkerModule],
    }).compile()
    await moduleRef.init()
    await events.waitUntilReady()
  })

  afterAll(async () => {
    await events.close()
    await moduleRef.close()
  })

  it('o worker processa o job enfileirado', async () => {
    const job = await moduleRef.get(MailService).send({
      to: 'dev@example.com',
      subject: 'Teste',
      body: 'Olá',
    })
    await expect(job.waitUntilFinished(events)).resolves.toHaveProperty('sentAt')
  })
})
