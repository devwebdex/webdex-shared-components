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

  expect(s.captureCharFrame()).toContain('Passo 1 de 5: Arquitetura')
  await click(s, 'Monólito modular')
  await click(s, 'NestJS')
  expect(s.captureCharFrame()).toContain('Drizzle (em breve)')
  await click(s, 'Prisma')
  await click(s, 'PostgreSQL')
  await click(s, 'Next.js')
  expect(s.captureCharFrame()).toContain('Resumo do projeto')
  await click(s, 'Criar projeto')

  expect(result).toEqual({
    directory: '/tmp/webdex-tui-test/acme',
    options: { ...defaults, name: 'acme' },
  })
})

test('opção indisponível não avança', async () => {
  const s = await mount(() => {})
  await click(s, 'Microserviços (em breve)')
  expect(s.captureCharFrame()).toContain('Passo 1 de 5: Arquitetura')
})

test('sem backend pula ORM e banco', async () => {
  let result: TuiResult | null | undefined
  const s = await mount((r) => {
    result = r
  })
  await click(s, 'Monólito modular')
  await click(s, 'Sem backend')
  expect(s.captureCharFrame()).toContain('Passo 3 de 3: Frontend')
  await click(s, 'Next.js')
  await click(s, 'Criar projeto')
  expect(result?.options.backend).toBe('none')
})

test('Enter seleciona a opção destacada e Esc cancela', async () => {
  let result: TuiResult | null | undefined
  const s = await mount((r) => {
    result = r
  })
  await interact(s, () => s.mockInput.pressEnter())
  expect(s.captureCharFrame()).toContain('Passo 2 de 5: Backend')
  // O parser de teclado só emite um ESC isolado após um intervalo, para distingui-lo de sequências de escape.
  await interact(s, async () => {
    s.mockInput.pressEscape()
    await Bun.sleep(100)
  })
  expect(result).toBeNull()
})
