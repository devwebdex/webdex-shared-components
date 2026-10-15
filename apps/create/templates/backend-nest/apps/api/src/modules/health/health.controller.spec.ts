import { Test } from '@nestjs/testing'
import { describe, expect, it } from 'vitest'
import { DatabaseHealth } from '../../shared/database/database-health.js'
//#if queue=bullmq
import { QueueHealth } from '../../shared/queue/queue-health.js'
//#endif
import { HealthController } from './health.controller.js'
import { HealthService } from './health.service.js'

const ok = async () => {}

//#if queue=bullmq
async function controllerWith({ database = ok, queue = ok }) {
  const moduleRef = await Test.createTestingModule({
    controllers: [HealthController],
    providers: [
      HealthService,
      { provide: DatabaseHealth, useValue: { ping: database } },
      { provide: QueueHealth, useValue: { ping: queue } },
    ],
  }).compile()
  return moduleRef.get(HealthController)
}
//#else
async function controllerWith({ database = ok }) {
  const moduleRef = await Test.createTestingModule({
    controllers: [HealthController],
    providers: [HealthService, { provide: DatabaseHealth, useValue: { ping: database } }],
  }).compile()
  return moduleRef.get(HealthController)
}
//#endif

describe('HealthController', () => {
//#if queue=bullmq
  it('responde ok quando o banco e o Redis respondem', async () => {
//#else
  it('responde ok quando o banco responde', async () => {
//#endif
    const controller = await controllerWith({})
    await expect(controller.check()).resolves.toEqual({ status: 'ok' })
  })

  it('propaga a falha do banco', async () => {
    const controller = await controllerWith({
      database: async () => {
        throw new Error('banco fora do ar')
      },
    })
    await expect(controller.check()).rejects.toThrow('banco fora do ar')
  })
//#if queue=bullmq

  it('propaga a falha do Redis', async () => {
    const controller = await controllerWith({
      queue: async () => {
        throw new Error('redis fora do ar')
      },
    })
    await expect(controller.check()).rejects.toThrow('redis fora do ar')
  })
//#endif
})
