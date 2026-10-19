import { test } from '@japa/runner'

test.group('GET /health (banco real)', () => {
  test('responde ok com o banco no ar', async ({ client }) => {
    const response = await client.get('/health')
    response.assertStatus(200)
    response.assertBody({ status: 'ok' })
  })
})
