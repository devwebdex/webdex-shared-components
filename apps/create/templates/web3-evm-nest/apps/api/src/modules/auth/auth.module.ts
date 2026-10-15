import { Module } from '@nestjs/common'
//#if session=cookie
import { APP_GUARD } from '@nestjs/core'
//#endif
import { ChainModule } from '../../shared/chain/chain.module.js'
import { AuthController } from './auth.controller.js'
import { AUTH_SERVICE, authServiceProvider } from './auth.providers.js'
//#if session=cookie
import { SameOriginGuard, SessionGuard } from './session.guard.js'
//#else
import { SessionGuard } from './session.guard.js'
//#endif
import { SessionTransport } from './session.transport.js'

// Outros módulos importam o AuthModule e protegem rotas com @UseGuards(SessionGuard).
@Module({
  imports: [ChainModule],
  controllers: [AuthController],
//#if session=cookie
  providers: [
    authServiceProvider,
    SessionTransport,
    SessionGuard,
    // Global: barra CSRF em toda rota que muda estado, de qualquer módulo.
    { provide: APP_GUARD, useClass: SameOriginGuard },
  ],
//#else
  providers: [authServiceProvider, SessionTransport, SessionGuard],
//#endif
  exports: [AUTH_SERVICE, SessionTransport, SessionGuard],
})
export class AuthModule {}
