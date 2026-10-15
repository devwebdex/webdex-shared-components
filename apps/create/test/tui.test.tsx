import { afterEach, expect, test } from 'bun:test'
import type { TestRendererSetup } from '@opentui/core/testing'
import { testRender } from '@opentui/react/test-utils'
import { act } from 'react'
import { defaults } from '../src/core/catalog.js'
import { App, type TuiResult } from '../src/tui/app.js'

let setup: TestRendererSetup | undefined
afterEach(async () => {
  await act(async () => setup?.renderer.destroy())
})

async function mount(onDone: (result: TuiResult | null) => void) {
  setup = await testRender(
    <App directory="/tmp/webdex-tui-test/acme" initial={defaults} onDone={onDone} />,
    { width: 80, height: 40 }
  )
  await setup.renderOnce()
  return setup
}

async function interact(s: TestRendererSetup, action: () => unknown) {
  await act(async () => {
    await action()
  })
  await s.renderOnce()
}

async function click(s: TestRendererSetup, text: string) {
  const lines = s.captureCharFrame().split('\n')
  const row = lines.findIndex((line) => line.includes(text))
  if (row < 0) throw new Error(`texto "${text}" não está na tela:\n${lines.join('\n')}`)
  await interact(s, () => s.mockMouse.click((lines[row] as string).indexOf(text), row))
}

test('fluxo completo pelo mouse', async () => {
  let result: TuiResult | null | undefined
  const s = await mount((r) => {
    result = r
  })

  expect(s.captureCharFrame()).toContain('● Arquitetura')
  expect(s.captureCharFrame()).toContain('nasce como monorepo')
  await click(s, 'Monólito modular')
  await click(s, 'NestJS')
  await click(s, 'PostgreSQL')
  expect(s.captureCharFrame()).toMatch(/○ Drizzle/)
  await click(s, 'Prisma')
  expect(s.captureCharFrame()).toContain('● Filas')
  await click(s, 'Sem filas')
  expect(s.captureCharFrame()).not.toContain('Inertia')
  await click(s, 'Next.js')
  expect(s.captureCharFrame()).toContain('● Web3')
  await click(s, 'Sem web3')
  expect(s.captureCharFrame()).toContain('● Resumo')
  expect(s.captureCharFrame()).toContain('Monorepo (pnpm + Turborepo):')
  await click(s, 'Criar projeto')

  expect(result).toEqual({
    directory: '/tmp/webdex-tui-test/acme',
    options: { ...defaults, name: 'acme' },
  })
})

test('opção indisponível não avança', async () => {
  const s = await mount(() => {})
  await click(s, 'Microserviços')
  expect(s.captureCharFrame()).toContain('● Arquitetura')
})

test('sem backend pula banco, ORM e filas', async () => {
  let result: TuiResult | null | undefined
  const s = await mount((r) => {
    result = r
  })
  await click(s, 'Monólito modular')
  await click(s, 'Sem backend')
  const frame = s.captureCharFrame()
  expect(frame).toContain('● Frontend')
  expect(frame).not.toContain('○ ORM')
  expect(frame).not.toContain('○ Banco de dados')
  expect(frame).not.toContain('○ Filas')
  await click(s, 'Next.js')
  await click(s, 'EVM com viem')
  await click(s, 'Criar projeto')
  expect(result?.options).toMatchObject({ backend: 'none', web3: 'evm' })
})

test('Adonis pula a etapa de ORM (só Lucid) e mantém o ORM no resumo', async () => {
  let result: TuiResult | null | undefined
  const s = await mount((r) => {
    result = r
  })
  await click(s, 'Monólito modular')
  await click(s, 'AdonisJS')
  const frame = s.captureCharFrame()
  expect(frame).toContain('● Banco de dados')
  expect(frame).not.toContain('○ ORM')
  expect(frame).not.toContain('MongoDB')
  await click(s, 'MySQL')
  await click(s, 'Sem filas')
  expect(s.captureCharFrame()).toContain('Inertia + React')
  await click(s, 'Sem frontend')
  await click(s, 'Sem web3')
  expect(s.captureCharFrame()).toMatch(/ORM +Lucid/)
  await click(s, 'Criar projeto')
  expect(result?.options).toMatchObject({ backend: 'adonis', orm: 'lucid', database: 'mysql' })
})

test('MongoDB pula a etapa de ORM e usa Mongoose', async () => {
  let result: TuiResult | null | undefined
  const s = await mount((r) => {
    result = r
  })
  await click(s, 'Monólito modular')
  await click(s, 'Fastify')
  await click(s, 'MongoDB')
  expect(s.captureCharFrame()).toContain('● Filas')
  await click(s, 'BullMQ + Redis')
  await click(s, 'Vite + React')
  await click(s, 'Sem web3')
  expect(s.captureCharFrame()).toMatch(/ORM +Mongoose/)
  await click(s, 'Criar projeto')
  expect(result?.options).toMatchObject({
    backend: 'fastify',
    database: 'mongodb',
    orm: 'mongoose',
    queue: 'bullmq',
    frontend: 'vite',
  })
})

test('Enter seleciona a opção destacada e Esc cancela', async () => {
  let result: TuiResult | null | undefined
  const s = await mount((r) => {
    result = r
  })
  await interact(s, () => s.mockInput.pressEnter())
  expect(s.captureCharFrame()).toContain('● Backend')
  // O parser de teclado só emite um ESC isolado após um intervalo, para distingui-lo de sequências de escape.
  await interact(s, async () => {
    s.mockInput.pressEscape()
    await Bun.sleep(100)
  })
  expect(result).toBeNull()
})

test('terminal estreito usa o layout compacto', async () => {
  setup = await testRender(
    <App directory="/tmp/webdex-tui-test/acme" initial={defaults} onDone={() => {}} />,
    { width: 64, height: 30 }
  )
  await setup.renderOnce()
  const frame = setup.captureCharFrame()
  expect(frame).toContain('Arquitetura (1 de 8)')
  expect(frame).not.toContain('Etapas')
})
