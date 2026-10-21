import router from '@adonisjs/core/services/router'

// Controllers importados sob demanda; cada módulo registra suas rotas aqui, agrupadas por prefixo.
const HealthController = () => import('#modules/health/health_controller')
//#if web3=evm
const AuthController = () => import('#modules/auth/auth_controller')
const AccessController = () => import('#modules/access/access_controller')

// Toda rota exige sessão, páginas inclusive. Rota pública só com o par `MÉTODO /padrão` em
// PUBLIC_ROUTES (app/modules/auth/auth_middleware.ts).
//#endif

// Páginas (Inertia): componentes em inertia/pages.
router.on('/').renderInertia('home', {})

router.get('/health', [HealthController, 'show'])
//#if web3=evm

router
  .group(() => {
    router.get('/nonce', [AuthController, 'nonce'])
    router.post('/verify', [AuthController, 'verify'])
    router.get('/me', [AuthController, 'me'])
    router.post('/logout', [AuthController, 'logout'])
  })
  .prefix('/auth')

router.get('/access/admin', [AccessController, 'admin'])
//#endif
