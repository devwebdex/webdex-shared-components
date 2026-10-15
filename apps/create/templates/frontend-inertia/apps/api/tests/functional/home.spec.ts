import { test } from '@japa/runner'

test.group('GET / (página Inertia)', () => {
  test('responde a página home', async ({ client }) => {
    const response = await client.get('/').withInertia()
    response.assertStatus(200)
    response.assertInertiaComponent('home')
  })
})
