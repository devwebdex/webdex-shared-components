import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import { WorkerModule } from './worker.module.js'

// Processo separado da API, sem HTTP: só os processadores das filas.
const app = await NestFactory.createApplicationContext(WorkerModule)
app.enableShutdownHooks()
