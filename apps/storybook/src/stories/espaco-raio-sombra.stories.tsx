import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { tokensOf, toPx } from '../lib/tokens.js'

/**
 * Espaçamento, raio, sombra e opacidade, lidos de `packages/tokens/src`. Como nas outras
 * páginas de Fundação, cada amostra pinta com o valor do token em `style`: o Tailwind não gera
 * classe montada em tempo de execução, e só emite a variável de token que alguém usa.
 */
const meta = {
  title: 'Fundação/Espaço, raio e sombra',
  parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-semibold text-text-primary text-xs">{titulo}</h2>
      {children}
    </section>
  )
}

function Rotulo({ nome, valor }: { nome: string; valor: string }) {
  return (
    <div className="flex flex-col">
      <code className="font-mono text-3xs text-text-primary">{nome}</code>
      <span className="font-mono text-3xs text-text-secondary">{valor}</span>
    </div>
  )
}

/** Grupo Spacing do Figma: bate 8 de 8 com os tokens. */
export const Espacamento: Story = {
  name: 'Espaçamento',
  render: () => (
    <div className="p-8">
      <Secao titulo="Espaçamento">
        {tokensOf('spacing').map((token) => (
          <div key={token.name} className="grid grid-cols-[8rem_1fr] items-center gap-4">
            <Rotulo nome={`spacing-${token.name}`} valor={toPx(token.value)} />
            <div className="h-4 rounded-1 bg-brand" style={{ width: token.value }} />
          </div>
        ))}
      </Secao>
    </div>
  ),
}

/**
 * Grupo Radius do Figma. Até a 0.3.0 esta escala estava deslocada a partir do índice 3 -- o
 * `radius-3` valia 12px, que é o `Radius 4` de lá -- e faltava o 10px.
 */
export const Raio: Story = {
  render: () => (
    <div className="p-8">
      <Secao titulo="Raio">
        <div className="flex flex-wrap gap-6">
          {tokensOf('radius').map((token) => (
            <div key={token.name} className="flex flex-col gap-2">
              <div
                className="size-20 bg-surface-card inset-ring-1 inset-ring-line-default"
                style={{ borderRadius: token.value }}
              />
              <Rotulo nome={`rounded-${token.name}`} valor={toPx(token.value)} />
            </div>
          ))}
        </div>
      </Secao>
    </div>
  ),
}

/** As elevações e o brilho da marca. No Figma, sombra é Effect Style, não Variable. */
export const Sombra: Story = {
  render: () => (
    <div className="p-8">
      <Secao titulo="Sombra">
        <div className="flex flex-wrap gap-8">
          {tokensOf('shadow').map((token) => (
            <div key={token.name} className="flex w-56 flex-col gap-3">
              <div className="h-20 rounded-3 bg-surface-card" style={{ boxShadow: token.value }} />
              <Rotulo nome={`shadow-${token.name}`} valor="" />
              {token.description && (
                <p className="text-3xs text-text-disabled leading-4xs">{token.description}</p>
              )}
            </div>
          ))}
        </div>
      </Secao>
    </div>
  ),
}

/** Opacidades nomeadas, usadas como modificador de cor: `bg-background/overlay`. */
export const Opacidade: Story = {
  render: () => (
    <div className="p-8">
      <Secao titulo="Opacidade">
        <div className="flex flex-wrap gap-6">
          {tokensOf('opacity').map((token) => (
            <div key={token.name} className="flex w-56 flex-col gap-2">
              <div className="relative h-14 overflow-hidden rounded-2 bg-brand">
                <div className="absolute inset-0 bg-background" style={{ opacity: token.value }} />
              </div>
              <Rotulo nome={`/${token.name}`} valor={token.value} />
              {token.description && (
                <p className="text-3xs text-text-disabled leading-4xs">{token.description}</p>
              )}
            </div>
          ))}
        </div>
      </Secao>
    </div>
  ),
}
