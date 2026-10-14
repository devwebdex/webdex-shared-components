import 'dotenv/config'
import { createApp } from './app.js'
import { env } from './shared/config/env.js'
import { connectDatabase } from './shared/database/database.js'

const database = connectDatabase(env.databaseUrl)
const server = createApp({ database, corsOrigins: env.corsOrigins }).listen(env.port, (error) => {
  if (error) throw error
  console.log(`API em http://localhost:${env.port}`)
})

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, () => {
    server.close(() => {
      void database.close()
    })
  })
}
