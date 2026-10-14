import router from '@adonisjs/core/services/router'

// Controllers importados sob demanda; cada módulo registra suas rotas aqui, agrupadas por prefixo.
const HealthController = () => import('#modules/health/health_controller')

router.get('/health', [HealthController, 'show'])
