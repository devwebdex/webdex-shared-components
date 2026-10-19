import { Redis } from 'ioredis'

/** Conexão da API com o Redis: os produtores de fila e o /health usam a mesma. */
export function connectRedis(redisUrl: string) {
  const redis = new Redis(redisUrl)
  return {
    connection: redis,
    async ping() {
      await redis.ping()
    },
    async close() {
      await redis.quit()
    },
  }
}

export type RedisConnection = ReturnType<typeof connectRedis>
