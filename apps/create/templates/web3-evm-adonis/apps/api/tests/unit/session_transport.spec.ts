//#if session=token|jwt
import type { HttpContext } from '@adonisjs/core/http'
//#endif
import { test } from '@japa/runner'
//#if session=cookie
import { sessionCookie } from '#modules/auth/session_transport'

test.group('cookie de sessão', () => {
  test('com SIWE_ORIGIN em https, Secure e com o prefixo __Host-', ({ assert }) => {
    assert.deepEqual(sessionCookie('https://app.example.com'), {
      name: '__Host-session',
      secure: true,
    })
  })

  test('em http (desenvolvimento), sem Secure e sem o prefixo', ({ assert }) => {
    assert.deepEqual(sessionCookie('http://localhost:3000'), { name: 'session', secure: false })
  })
})
//#endif
//#if session=token|jwt
import { readSessionToken } from '#modules/auth/session_transport'

function requestWith(authorization?: string) {
  return { header: () => authorization } as unknown as HttpContext['request']
}

test.group('token de sessão', () => {
  test('lê o token de Authorization: Bearer', ({ assert }) => {
    assert.equal(readSessionToken(requestWith('Bearer abc')), 'abc')
  })

  test('ignora outro esquema ou cabeçalho ausente', ({ assert }) => {
    assert.isUndefined(readSessionToken(requestWith('Basic abc')))
    assert.isUndefined(readSessionToken(requestWith()))
  })
})
//#endif
