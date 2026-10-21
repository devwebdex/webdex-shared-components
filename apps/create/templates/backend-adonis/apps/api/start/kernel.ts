import router from '@adonisjs/core/services/router'
import server from '@adonisjs/core/services/server'

server.errorHandler(() => import('#exceptions/handler'))

server.use([
  () => import('#middleware/force_json_response_middleware'),
  () => import('#middleware/container_bindings_middleware'),
  () => import('@adonisjs/cors/cors_middleware'),
  //#if web3=evm
  //#if session=cookie
  // CSRF do cookie de sessão: métodos que mudam estado exigem Origin igual a SIWE_ORIGIN.
  () => import('#modules/auth/session_transport'),
  //#endif
  //#endif
])

//#if web3=evm
router.use([
  // Toda rota exige sessão, exceto PUBLIC_ROUTES (app/modules/auth/auth_middleware.ts). Antes do
  // bodyparser: requisição sem sessão é recusada sem ler o corpo.
  () => import('#modules/auth/auth_middleware'),
  () => import('@adonisjs/core/bodyparser_middleware'),
])
//#else
router.use([() => import('@adonisjs/core/bodyparser_middleware')])
//#endif

export const middleware = router.named({})
