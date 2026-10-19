import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ChainModule } from '../../shared/chain/chain.module.js'
import { AuthController } from './auth.controller.js'
import { authServiceProvider } from './auth.providers.js'
//#if session=cookie
import { SameOriginGuard, SessionGuard } from './session.guard.js'
//#else
import { SessionGuard } from './session.guard.js'
//#endif
import { SessionTransport } from './session.transport.js'

// Guards globais: valem para as rotas de todos os módulos. Rota sem sessão usa @Public().
@Module({
  imports: [ChainModule],
  controllers: [AuthController],
  providers: [
    authServiceProvider,
    SessionTransport,
//#if session=cookie
    // Barra CSRF em toda rota que muda estado; roda antes do SessionGuard.
    { provide: APP_GUARD, useClass: SameOriginGuard },
//#endif
    { provide: APP_GUARD, useClass: SessionGuard },
  ],
})
export class AuthModule {}
