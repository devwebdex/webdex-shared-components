import router from '@adonisjs/core/services/router'
//#if web3=evm
import { middleware } from '#start/kernel'
//#endif

// Controllers importados sob demanda; cada módulo registra suas rotas aqui, agrupadas por prefixo.
const HealthController = () => import('#modules/health/health_controller')
//#if web3=evm
const AuthController = () => import('#modules/auth/auth_controller')
const AccessController = () => import('#modules/access/access_controller')
//#endif

router.get('/health', [HealthController, 'show'])
//#if web3=evm

router
  .group(() => {
    router.get('/nonce', [AuthController, 'nonce'])
    router.post('/verify', [AuthController, 'verify'])
    router.get('/me', [AuthController, 'me']).use(middleware.auth())
    router.post('/logout', [AuthController, 'logout']).use(middleware.auth())
  })
  .prefix('/auth')

router.get('/access/admin', [AccessController, 'admin']).use(middleware.auth())
//#endif
