import 'dotenv/config'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module.js'
import { env } from './shared/config/env.js'

const app = await NestFactory.create(AppModule)
app.enableCors({ origin: env.corsOrigins })
app.useGlobalPipes(
  new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })
)
app.enableShutdownHooks()
await app.listen(env.port)
