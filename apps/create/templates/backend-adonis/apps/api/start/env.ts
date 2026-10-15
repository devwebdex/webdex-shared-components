import { Env } from '@adonisjs/core/env'

// Falha na inicialização se alguma variável obrigatória estiver ausente ou inválida.
export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),

  APP_KEY: Env.schema.secret(),
  APP_URL: Env.schema.string({ format: 'url', tld: false }),
  CORS_ORIGINS: Env.schema.string(),

  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),
  //#if queue=bullmq

  REDIS_URL: Env.schema.string(),
  //#endif
  //#if web3=evm

  CHAIN: Env.schema.enum(['polygon', 'polygonAmoy'] as const),
  RPC_URL: Env.schema.string({ format: 'url', tld: false }),
  SIWE_ORIGIN: Env.schema.string({ format: 'url', tld: false }),
  ACCESS_CONTROL_ADDRESS: Env.schema.string.optional(),
  //#endif
})
