//#if session=cookie
import cookie from '@fastify/cookie'
//#endif
import Fastify from 'fastify'
import { describe, expect, it } from 'vitest'
//#if session=cookie
import { cookieTransport, type SessionTransport } from './session.js'
//#else
import { bearerTransport, type SessionTransport } from './session.js'
//#endif

const session = { token: 'abc', expiresAt: new Date('2030-01-01T00:00:00.000Z') }

// App mínimo: /login entrega a sessão e /read devolve o token que o transporte leu.
async function appWith(transport: SessionTransport) {
  const app = Fastify()
//#if session=cookie
  await app.register(cookie)
//#endif
  app.post('/login', async (_request, reply) => transport.issue(reply, session))
  app.get('/read', async (request) => ({ token: transport.read(request) ?? null }))
  return app
}
//#if session=cookie

describe('cookieTransport', () => {
  it('em https, o cookie se chama __Host-session, é Secure e não tem Domain', async () => {
    const app = await appWith(cookieTransport('https://app.example.com'))
    const login = await app.inject({ method: 'POST', url: '/login' })
    const setCookie = String(login.headers['set-cookie'])
    expect(setCookie).toMatch(/^__Host-session=abc;/)
    expect(setCookie).toContain('Path=/')
    expect(setCookie).toContain('Secure')
    expect(setCookie).not.toContain('Domain')
    const read = (cookieHeader: string) =>
      app.inject({ method: 'GET', url: '/read', headers: { cookie: cookieHeader } })
    expect((await read('__Host-session=abc')).json()).toEqual({ token: 'abc' })
    // Sem o prefixo, o cookie poderia ter sido gravado por um subdomínio: não vale como sessão.
    expect((await read('session=abc')).json()).toEqual({ token: null })
  })

  it('em http (desenvolvimento), o cookie se chama session e não é Secure', async () => {
    const app = await appWith(cookieTransport('http://localhost:3000'))
    const login = await app.inject({ method: 'POST', url: '/login' })
    const setCookie = String(login.headers['set-cookie'])
    expect(setCookie).toMatch(/^session=abc;/)
    expect(setCookie).not.toContain('Secure')
    const read = await app.inject({
      method: 'GET',
      url: '/read',
      headers: { cookie: 'session=abc' },
    })
    expect(read.json()).toEqual({ token: 'abc' })
  })
})
//#else

describe('bearerTransport', () => {
  it('o login responde com o token e a validade', async () => {
    const app = await appWith(bearerTransport)
    const login = await app.inject({ method: 'POST', url: '/login' })
    expect(login.json()).toEqual({ token: 'abc', expiresAt: '2030-01-01T00:00:00.000Z' })
  })

  it('lê só o cabeçalho Authorization no formato Bearer', async () => {
    const app = await appWith(bearerTransport)
    const read = (authorization: string) =>
      app.inject({ method: 'GET', url: '/read', headers: { authorization } })
    expect((await read('Bearer abc')).json()).toEqual({ token: 'abc' })
    expect((await read('abc')).json()).toEqual({ token: null })
  })
})
//#endif
