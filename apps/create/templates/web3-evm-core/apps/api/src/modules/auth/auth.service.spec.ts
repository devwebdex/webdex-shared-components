import { createHash } from 'node:crypto'
import type { Chain } from 'viem'
import { type CreateSiweMessageParameters, createSiweMessage } from 'viem/siwe'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ChainClient } from '../../shared/chain/chain-client.js'
import {
  createAuthService,
  SIWE_MESSAGE_MAX_LENGTH,
  SIWE_SIGNATURE_MAX_LENGTH,
} from './auth.service.js'
import type { AuthStore, StoredSession } from './auth.store.js'

const config = {
  chain: { id: 31_337 } as Chain,
  siweOrigin: 'https://app.example.com',
}
// Minúsculo de propósito: a sessão guarda o endereço normalizado com checksum.
const address = '0xd2135cfb216b74109775236e36d4b433f1df507b'

function memoryStore() {
  const nonces = new Map<string, Date>()
  const sessions = new Map<string, StoredSession>()
  const store: AuthStore = {
    async saveNonce(nonce, expiresAt) {
      nonces.set(nonce, expiresAt)
    },
    async consumeNonce(nonce) {
      const expiresAt = nonces.get(nonce)
      nonces.delete(nonce)
      return expiresAt !== undefined && expiresAt > new Date()
    },
    async createSession(session) {
      sessions.set(session.id, session)
    },
    async findSession(id) {
      const session = sessions.get(id)
      return session && session.expiresAt > new Date() ? { address: session.address } : undefined
    },
    async deleteSession(id) {
      sessions.delete(id)
    },
  }
  return { store, nonces, sessions }
}

function setup({ signatureValid = true } = {}) {
  const { store, nonces, sessions } = memoryStore()
  const verifySiweMessage = vi.fn(async () => signatureValid)
  const client = { verifySiweMessage } as unknown as ChainClient
  return {
    service: createAuthService({ store, client, config }),
    verifySiweMessage,
    nonces,
    sessions,
  }
}

function siweMessage(nonce: string, overrides: Partial<CreateSiweMessageParameters> = {}) {
  return createSiweMessage({
    address,
    chainId: config.chain.id,
    domain: 'app.example.com',
    nonce,
    uri: 'https://app.example.com/login',
    version: '1',
    issuedAt: new Date(),
    expirationTime: new Date(Date.now() + 5 * 60 * 1000),
    ...overrides,
  })
}

const signature = '0x1234'

afterEach(() => {
  vi.useRealTimers()
})

describe('AuthService', () => {
  it('createNonce gera 16 bytes em hex, válidos por 5 minutos', async () => {
    const { service, nonces } = setup()
    const nonce = await service.createNonce()
    expect(nonce).toMatch(/^[0-9a-f]{32}$/)
    const expiresAt = nonces.get(nonce)?.getTime() ?? 0
    expect(expiresAt - Date.now()).toBeGreaterThan(4 * 60 * 1000)
    expect(expiresAt - Date.now()).toBeLessThanOrEqual(5 * 60 * 1000)
  })

  it('login válido cria a sessão com o endereço com checksum e guarda só o hash do token', async () => {
    const { service, verifySiweMessage, sessions } = setup()
    const nonce = await service.createNonce()
    const message = siweMessage(nonce)

    const session = await service.verify({ message, signature })

    expect(verifySiweMessage).toHaveBeenCalledWith({
      message,
      signature,
      domain: 'app.example.com',
      nonce,
    })
    expect(session?.token).toMatch(/^[\w-]{43}$/)
    const stored = [...sessions.values()]
    expect(stored).toEqual([
      {
        id: createHash('sha256')
          .update(session?.token ?? '')
          .digest('hex'),
        address: '0xd2135CfB216b74109775236E36d4b433F1DF507B',
        expiresAt: session?.expiresAt,
      },
    ])
    await expect(service.findSession(session?.token ?? '')).resolves.toEqual({
      address: '0xd2135CfB216b74109775236E36d4b433F1DF507B',
    })
  })

  it('nonce desconhecido é recusado sem consultar a rede', async () => {
    const { service, verifySiweMessage } = setup()
    const message = siweMessage('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6')
    await expect(service.verify({ message, signature })).resolves.toBeUndefined()
    expect(verifySiweMessage).not.toHaveBeenCalled()
  })

  it('nonce só vale uma vez', async () => {
    const { service } = setup()
    const message = siweMessage(await service.createNonce())
    await expect(service.verify({ message, signature })).resolves.toBeDefined()
    await expect(service.verify({ message, signature })).resolves.toBeUndefined()
  })

  it('nonce expirado é recusado', async () => {
    vi.useFakeTimers()
    const { service } = setup()
    const nonce = await service.createNonce()
    vi.advanceTimersByTime(5 * 60 * 1000 + 1)
    await expect(
      service.verify({ message: siweMessage(nonce), signature })
    ).resolves.toBeUndefined()
  })

  const invalid: [string, Partial<CreateSiweMessageParameters>][] = [
    ['domínio de outro site', { domain: 'evil.example.com' }],
    ['URI de outra origem com o mesmo prefixo', { uri: 'https://app.example.com.evil.net/login' }],
    ['outra rede', { chainId: config.chain.id + 1 }],
    ['sem expiração', { expirationTime: undefined }],
    ['expiração além de 10 minutos', { expirationTime: new Date(Date.now() + 60 * 60 * 1000) }],
  ]
  it.each(invalid)('recusa mensagem com %s e consome o nonce', async (_case, overrides) => {
    const { service, verifySiweMessage, nonces } = setup()
    const nonce = await service.createNonce()
    await expect(
      service.verify({ message: siweMessage(nonce, overrides), signature })
    ).resolves.toBeUndefined()
    expect(verifySiweMessage).not.toHaveBeenCalled()
    expect(nonces.has(nonce)).toBe(false)
  })

  it('mensagem ou assinatura acima do limite é recusada antes da leitura da mensagem', async () => {
    const { service, verifySiweMessage, nonces } = setup()
    const nonce = await service.createNonce()
    const message = siweMessage(nonce)
    const tooLong = `${message}\n${'x'.repeat(SIWE_MESSAGE_MAX_LENGTH)}`
    await expect(service.verify({ message: tooLong, signature })).resolves.toBeUndefined()
    const longSignature = `0x${'a'.repeat(SIWE_SIGNATURE_MAX_LENGTH)}` as const
    await expect(service.verify({ message, signature: longSignature })).resolves.toBeUndefined()
    expect(verifySiweMessage).not.toHaveBeenCalled()
    expect(nonces.has(nonce)).toBe(true)
  })

  it('assinatura inválida não cria sessão', async () => {
    const { service, sessions } = setup({ signatureValid: false })
    const message = siweMessage(await service.createNonce())
    await expect(service.verify({ message, signature })).resolves.toBeUndefined()
    expect(sessions.size).toBe(0)
  })

  it('a sessão vale 24 horas', async () => {
    vi.useFakeTimers()
    const { service } = setup()
    const message = siweMessage(await service.createNonce())
    const session = await service.verify({ message, signature })
    const token = session?.token ?? ''

    vi.advanceTimersByTime(24 * 60 * 60 * 1000 - 1)
    await expect(service.findSession(token)).resolves.toBeDefined()
    vi.advanceTimersByTime(1)
    await expect(service.findSession(token)).resolves.toBeUndefined()
  })

  it('logout apaga a sessão', async () => {
    const { service } = setup()
    const session = await service.verify({
      message: siweMessage(await service.createNonce()),
      signature,
    })
    const token = session?.token ?? ''
    await service.logout(token)
    await expect(service.findSession(token)).resolves.toBeUndefined()
  })
})
