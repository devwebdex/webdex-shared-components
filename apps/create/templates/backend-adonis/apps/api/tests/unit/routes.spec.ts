import router from '@adonisjs/core/services/router'
import { test } from '@japa/runner'

test.group('rotas', () => {
  test('GET /health está registrada', ({ assert }) => {
    router.commit()
    const route = router.match('/health', 'GET', false)
    assert.isNotNull(route)
  })
})
