import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module.js'
import { env } from './shared/config/env.js'

const app = await NestFactory.create(AppModule)
//#if web3=evm
//#if session=cookie
// O cookie de sessão só viaja com credentials; o SameOriginGuard barra CSRF no que muda estado.
app.enableCors({ origin: env.corsOrigins, credentials: true })
//#else
app.enableCors({ origin: env.corsOrigins })
//#endif
//#else
app.enableCors({ origin: env.corsOrigins })
//#endif
app.enableShutdownHooks()
await app.listen(env.port)
