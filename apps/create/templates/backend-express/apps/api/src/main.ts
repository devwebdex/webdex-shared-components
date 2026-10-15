import 'dotenv/config'
import { createApp } from './app.js'
//#if web3=evm
import { createAccessService } from './modules/access/index.js'
import { createAuthRepository, createAuthService } from './modules/auth/index.js'
import { createChainClient } from './shared/chain/chain-client.js'
import { loadChainConfig } from './shared/chain/chain-config.js'
//#endif
import { env } from './shared/config/env.js'
import { connectDatabase } from './shared/database/database.js'
//#if queue=bullmq
import { connectRedis } from './shared/queue/redis.js'
//#endif

const database = connectDatabase(env.databaseUrl)
//#if queue=bullmq
const redis = connectRedis(env.redisUrl)
//#endif
//#if web3=evm
const chain = loadChainConfig()
const chainClient = createChainClient(chain)
//#endif
const app = createApp({
  database,
//#if queue=bullmq
  redis,
//#endif
  corsOrigins: env.corsOrigins,
//#if web3=evm
  authService: createAuthService({
    store: createAuthRepository(database),
    client: chainClient,
    config: chain,
  }),
  accessService: createAccessService({ client: chainClient, config: chain }),
//#if session=cookie
  siweOrigin: chain.siweOrigin,
//#endif
//#endif
})
const server = app.listen(env.port, (error) => {
  if (error) throw error
  console.log(`API em http://localhost:${env.port}`)
})

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, () => {
    server.close(() => {
//#if queue=bullmq
      void Promise.all([database.close(), redis.close()])
//#else
      void database.close()
//#endif
    })
  })
}
