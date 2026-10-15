import { Module, ValidationPipe } from '@nestjs/common'
import { APP_PIPE } from '@nestjs/core'
//#if web3=evm
import { AccessModule } from './modules/access/access.module.js'
import { AuthModule } from './modules/auth/auth.module.js'
//#endif
import { HealthModule } from './modules/health/health.module.js'
//#if queue=bullmq
import { MailModule } from './modules/mail/mail.module.js'
//#endif
import { DatabaseModule } from './shared/database/database.module.js'
//#if queue=bullmq
import { QueueModule } from './shared/queue/queue.module.js'
//#endif

@Module({
//#if queue=bullmq
//#if web3=evm
  imports: [DatabaseModule, QueueModule, HealthModule, MailModule, AuthModule, AccessModule],
//#else
  imports: [DatabaseModule, QueueModule, HealthModule, MailModule],
//#endif
//#else
//#if web3=evm
  imports: [DatabaseModule, HealthModule, AuthModule, AccessModule],
//#else
  imports: [DatabaseModule, HealthModule],
//#endif
//#endif
  providers: [
    // Pipe global registrado no módulo, não no main.ts: assim vale também nos testes e2e.
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
  ],
})
export class AppModule {}
