import { createHash } from 'node:crypto'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { type CreateSiweMessageParameters, createSiweMessage } from 'viem/siwe'
import web3Config from '#config/web3'
import AuthService from '#modules/auth/auth_service'
import type ChainClient from '#shared/chain_client'

// Repositório em memória com o mesmo contrato do AuthRepository: os testes unitários não usam banco.
function memoryRepository() {
  const nonces = new Map<string, DateTime>()
  const sessions = new Map<string, { address: string; expiresAt: DateTime }>()
  return {
    nonces,
    sessions,
    async createNonce(nonce: string, expiresAt: DateTime) {
      nonces.set(nonce, expiresAt)
    },
    async consumeNonce(nonce: string) {
      const expiresAt = nonces.get(nonce)
      nonces.delete(nonce)
      return expiresAt !== undefined && expiresAt > DateTime.now()
    },
    async createSession({ id, ...session }: { id: string; address: string; expiresAt: DateTime }) {
      sessions.set(id, session)
    },
    async findSessionAddress(id: string) {
      const session = sessions.get(id)
      return session && session.expiresAt > DateTime.now() ? session.address : null
    },
    async deleteSession(id: string) {
      sessions.delete(id)
    },
  }
}

function fakeChainClient(signatureValid: boolean) {
  const calls: unknown[] = []
  const client = {
    async verifySiweMessage(params: unknown) {
      calls.push(params)
      return signatureValid
    },
  } as unknown as ChainClient
  return { client, calls }
}

async function setup(signatureValid = true) {
  const repository = memoryRepository()
  const chain = fakeChainClient(signatureValid)
  const service = new AuthService(chain.client, repository)
  const account = privateKeyToAccount(generatePrivateKey())
  const nonce = await service.issueNonce()
  const message = (overrides: Partial<CreateSiweMessageParameters> = {}) =>
    createSiweMessage({
      address: account.address,
      chainId: web3Config.chain.id,
      domain: web3Config.siwe.domain,
      uri: web3Config.siwe.origin,
      version: '1',
      nonce,
      expirationTime: new Date(Date.now() + 5 * 60 * 1000),
      ...overrides,
    })
  return { service, repository, chain, account, nonce, message }
}

test.group('AuthService', () => {
  test('emite nonce de 16 bytes em hex, válido por 5 minutos', async ({ assert }) => {
    const { repository, nonce } = await setup()
    assert.match(nonce, /^[0-9a-f]{32}$/)
    const minutes = repository.nonces.get(nonce)?.diffNow('minutes').minutes ?? 0
    assert.closeTo(minutes, 5, 0.1)
  })

  test('abre a sessão e guarda só o hash do token', async ({ assert }) => {
    const { service, repository, account, message } = await setup()

    const session = await service.login(message(), '0x00')
    if (!session) return assert.fail('login recusado')

    const hash = createHash('sha256').update(session.token).digest('hex')
    assert.deepEqual([...repository.sessions.keys()], [hash])
    assert.equal(repository.sessions.get(hash)?.address, account.address)
    assert.equal(await service.sessionAddress(session.token), account.address)

    await service.logout(session.token)
    assert.isNull(await service.sessionAddress(session.token))
  })

  test('nonce só vale uma vez', async ({ assert }) => {
    const { service, message } = await setup()
    assert.isNotNull(await service.login(message(), '0x00'))
    assert.isNull(await service.login(message(), '0x00'))
  })

  test('recusa sem consultar a rede: {label}')
    .with([
      { label: 'domínio errado', overrides: { domain: 'evil.example' } },
      { label: 'URI de outra origem', overrides: { uri: 'https://evil.example' } },
      { label: 'outra rede', overrides: { chainId: web3Config.chain.id + 1 } },
      { label: 'sem expiração', overrides: { expirationTime: undefined } },
      {
        label: 'expiração longa demais',
        overrides: { expirationTime: new Date(Date.now() + 60 * 60 * 1000) },
      },
    ])
    .run(async ({ assert }, { overrides }) => {
      const { service, repository, chain, message } = await setup()
      assert.isNull(await service.login(message(overrides), '0x00'))
      assert.lengthOf(chain.calls, 0)
      assert.equal(repository.sessions.size, 0)
    })

  test('recusa assinatura inválida', async ({ assert }) => {
    const { service, repository, chain, message } = await setup(false)
    assert.isNull(await service.login(message(), '0x00'))
    assert.lengthOf(chain.calls, 1)
    assert.equal(repository.sessions.size, 0)
  })
})
