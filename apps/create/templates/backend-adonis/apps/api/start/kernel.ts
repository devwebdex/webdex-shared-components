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

router.use([() => import('@adonisjs/core/bodyparser_middleware')])

//#if web3=evm
export const middleware = router.named({
  auth: () => import('#modules/auth/auth_middleware'),
})
//#else
export const middleware = router.named({})
//#endif
