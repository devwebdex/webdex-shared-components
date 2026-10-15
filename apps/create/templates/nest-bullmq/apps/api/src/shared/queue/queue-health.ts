import { Injectable, type OnModuleDestroy } from '@nestjs/common'
import { Redis } from 'ioredis'
import { env } from '../config/env.js'

/** Ping do Redis para o /health, numa conexão própria que só abre no primeiro ping. */
@Injectable()
export class QueueHealth implements OnModuleDestroy {
  private readonly redis = new Redis(env.redisUrl, { lazyConnect: true })

  async ping() {
    await this.redis.ping()
  }

  onModuleDestroy() {
    this.redis.disconnect()
  }
}
