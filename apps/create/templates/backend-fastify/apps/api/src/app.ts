//#if web3=evm
//#if session=cookie
import cookie from '@fastify/cookie'
//#endif
//#endif
import cors from '@fastify/cors'
import Fastify, { type FastifyServerOptions } from 'fastify'
//#if web3=evm
import { type AccessService, createAccessModule } from './modules/access/index.js'
//#if session=cookie
import {
  type AuthService,
  createAuthModule,
  rejectCrossSiteRequests,
} from './modules/auth/index.js'
//#else
import { type AuthService, createAuthModule } from './modules/auth/index.js'
//#endif
//#endif
import { createHealthModule } from './modules/health/index.js'
import type { DatabaseConnection } from './shared/database/database.js'
import { registerErrorHandlers } from './shared/http/error-handler.js'
//#if queue=bullmq
import type { RedisConnection } from './shared/queue/redis.js'
//#endif

export type AppDependencies = {
  database: DatabaseConnection
//#if queue=bullmq
  redis: RedisConnection
//#endif
  corsOrigins: string[]
//#if web3=evm
  authService: AuthService
  accessService: AccessService
//#if session=cookie
  /** Origem do frontend (SIWE_ORIGIN): o CSRF e o Secure do cookie dependem dela. */
  siweOrigin: string
//#endif
//#endif
}

/** Composição do app: cada módulo recebe só as dependências de que precisa e vira um plugin com prefixo. */
export async function createApp(deps: AppDependencies, options: FastifyServerOptions = {}) {
  const app = Fastify(options)
//#if web3=evm
//#if session=cookie
  // O cookie de sessão só viaja com credentials; o Origin barra CSRF no que muda estado.
  await app.register(cors, { origin: deps.corsOrigins, credentials: true })
  await app.register(cookie)
  app.addHook('onRequest', rejectCrossSiteRequests(deps.siweOrigin))
//#else
  await app.register(cors, { origin: deps.corsOrigins })
//#endif
//#else
  await app.register(cors, { origin: deps.corsOrigins })
//#endif
  registerErrorHandlers(app)
//#if web3=evm
//#if session=cookie
  const auth = createAuthModule({ authService: deps.authService, siweOrigin: deps.siweOrigin })
//#else
  const auth = createAuthModule({ authService: deps.authService })
//#endif
  // Toda rota exige sessão (docs/standards/security.md); rota pública declara config: { public: true }.
  auth.requireSession(app)
//#endif

//#if queue=bullmq
  const health = createHealthModule({ checks: [deps.database, deps.redis] })
//#else
  const health = createHealthModule({ checks: [deps.database] })
//#endif
  await app.register(health.routes, { prefix: '/health' })
//#if web3=evm
  await app.register(auth.routes, { prefix: '/auth' })
  await app.register(createAccessModule({ accessService: deps.accessService }).routes, {
    prefix: '/access',
  })
//#endif

  return app
}
