import { Test } from '@nestjs/testing'
import { describe, expect, it } from 'vitest'
import { DatabaseHealth } from '../../shared/database/database-health.js'
import { HealthController } from './health.controller.js'
import { HealthService } from './health.service.js'

async function controllerWith(ping: () => Promise<void>) {
  const moduleRef = await Test.createTestingModule({
    controllers: [HealthController],
    providers: [HealthService, { provide: DatabaseHealth, useValue: { ping } }],
  }).compile()
  return moduleRef.get(HealthController)
}

describe('HealthController', () => {
  it('responde ok quando o banco responde', async () => {
    const controller = await controllerWith(async () => {})
    await expect(controller.check()).resolves.toEqual({ status: 'ok' })
  })

  it('propaga a falha do banco', async () => {
    const controller = await controllerWith(async () => {
      throw new Error('banco fora do ar')
    })
    await expect(controller.check()).rejects.toThrow('banco fora do ar')
  })
})
