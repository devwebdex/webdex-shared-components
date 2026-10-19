//#if web3=evm
//#if session=cookie
import cookieParser from 'cookie-parser'
//#endif
//#endif
import cors from 'cors'
import express from 'express'
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
import { errorHandler, notFoundHandler } from './shared/http/error-handler.js'
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

/** Composição do app: cada módulo recebe só as dependências de que precisa. */
export function createApp(deps: AppDependencies) {
  const app = express()
  app.disable('x-powered-by')
//#if web3=evm
//#if session=cookie
  // O cookie de sessão só viaja com credentials; o Origin barra CSRF no que muda estado.
  app.use(cors({ origin: deps.corsOrigins, credentials: true }))
  app.use(cookieParser())
  app.use(rejectCrossSiteRequests(deps.siweOrigin))
//#else
  app.use(cors({ origin: deps.corsOrigins }))
//#endif
//#else
  app.use(cors({ origin: deps.corsOrigins }))
//#endif
//#if web3=evm
//#if session=cookie
  const auth = createAuthModule({ authService: deps.authService, siweOrigin: deps.siweOrigin })
//#else
  const auth = createAuthModule({ authService: deps.authService })
//#endif
  // Toda rota exige sessão (docs/standards/security.md). Rota nova sem sessão entra nesta lista de
  // propósito, nunca por esquecimento.
  app.use(auth.requireSession(['GET /health', 'GET /auth/nonce', 'POST /auth/verify']))
  // O login só recebe uma mensagem SIWE curta; o resto da API mantém o limite padrão (100 KB).
  app.use('/auth', express.json({ limit: '32kb' }))
//#endif
  app.use(express.json())

//#if queue=bullmq
  app.use('/health', createHealthModule({ checks: [deps.database, deps.redis] }).router)
//#else
  app.use('/health', createHealthModule({ checks: [deps.database] }).router)
//#endif
//#if web3=evm
  app.use('/auth', auth.router)
  app.use('/access', createAccessModule({ accessService: deps.accessService }).router)
//#endif

  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}
