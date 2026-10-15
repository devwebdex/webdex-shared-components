import router from '@adonisjs/core/services/router'
import server from '@adonisjs/core/services/server'

server.errorHandler(() => import('#exceptions/handler'))

// Sem o middleware que força JSON: as páginas do Inertia respondem HTML.
server.use([
  () => import('#middleware/container_bindings_middleware'),
  () => import('@adonisjs/static/static_middleware'),
  () => import('@adonisjs/cors/cors_middleware'),
  //#if web3=evm
  // CSRF do cookie de sessão: métodos que mudam estado exigem Origin igual a SIWE_ORIGIN.
  () => import('#modules/auth/session_transport'),
  //#endif
  () => import('@adonisjs/vite/vite_middleware'),
  () => import('#middleware/inertia_middleware'),
])

router.use([() => import('@adonisjs/core/bodyparser_middleware')])

//#if web3=evm
export const middleware = router.named({
  auth: () => import('#modules/auth/auth_middleware'),
})
//#else
export const middleware = router.named({})
//#endif
