//#if session=cookie
import cookieParser from 'cookie-parser'
//#endif
import express from 'express'
import request from 'supertest'
//#if session=cookie
import { describe, expect, it } from 'vitest'
//#else
import { describe, it } from 'vitest'
//#endif
//#if session=cookie
import { cookieTransport, type SessionTransport } from './session.js'
//#else
import { bearerTransport, type SessionTransport } from './session.js'
//#endif

const session = { token: 'abc', expiresAt: new Date('2030-01-01T00:00:00.000Z') }

// App mínimo: /login entrega a sessão e /read devolve o token que o transporte leu.
function appWith(transport: SessionTransport) {
  const app = express()
//#if session=cookie
  app.use(cookieParser())
//#endif
  app.post('/login', (_req, res) => {
    transport.issue(res, session)
  })
  app.get('/read', (req, res) => {
    res.json({ token: transport.read(req) ?? null })
  })
  return app
}
//#if session=cookie

describe('cookieTransport', () => {
  it('em https, o cookie se chama __Host-session, é Secure e não tem Domain', async () => {
    const app = appWith(cookieTransport('https://app.example.com'))
    const response = await request(app).post('/login').expect(204)
    const [setCookie = ''] = response.get('Set-Cookie') ?? []
    expect(setCookie).toMatch(/^__Host-session=abc;/)
    expect(setCookie).toContain('Path=/')
    expect(setCookie).toContain('Secure')
    expect(setCookie).not.toContain('Domain')
    await request(app).get('/read').set('Cookie', '__Host-session=abc').expect({ token: 'abc' })
    // Sem o prefixo, o cookie poderia ter sido gravado por um subdomínio: não vale como sessão.
    await request(app).get('/read').set('Cookie', 'session=abc').expect({ token: null })
  })

  it('em http (desenvolvimento), o cookie se chama session e não é Secure', async () => {
    const app = appWith(cookieTransport('http://localhost:3000'))
    const response = await request(app).post('/login').expect(204)
    const [setCookie = ''] = response.get('Set-Cookie') ?? []
    expect(setCookie).toMatch(/^session=abc;/)
    expect(setCookie).not.toContain('Secure')
    await request(app).get('/read').set('Cookie', 'session=abc').expect({ token: 'abc' })
  })
})
//#else

describe('bearerTransport', () => {
  it('o login responde com o token e a validade', async () => {
    await request(appWith(bearerTransport))
      .post('/login')
      .expect(200, { token: 'abc', expiresAt: '2030-01-01T00:00:00.000Z' })
  })

  it('lê só o cabeçalho Authorization no formato Bearer', async () => {
    const app = appWith(bearerTransport)
    await request(app).get('/read').set('Authorization', 'Bearer abc').expect({ token: 'abc' })
    await request(app).get('/read').set('Authorization', 'abc').expect({ token: null })
  })
})
//#endif
