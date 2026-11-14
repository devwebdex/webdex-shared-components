import { describe, expect, it } from 'vitest'
import { cn } from '../src/index.js'

// O cn decide qual classe vence quando duas mexem na mesma propriedade. Se ele não reconhece
// um nome da escala, as duas ficam no elemento e quem vence é a ordem do CSS: o className de
// quem consome o componente deixa de sobrescrever a classe interna.
describe('cn', () => {
  it.each([
    ['rounded-4', 'rounded-full', 'rounded-full'],
    ['rounded-3', 'rounded-7', 'rounded-7'],
    ['rounded-full', 'rounded-100', 'rounded-100'],
    ['rounded-t-4', 'rounded-t-0', 'rounded-t-0'],
    ['leading-xs', 'leading-none', 'leading-none'],
    ['leading-2xs', 'leading-4xs', 'leading-4xs'],
    ['text-3xs', 'text-2xs', 'text-2xs'],
    ['tracking-wide', 'tracking-widest', 'tracking-widest'],
  ])('%s seguido de %s fica só com %s', (interna, externa, esperada) => {
    expect(cn(interna, externa)).toBe(esperada)
  })

  it('não confunde cor de texto com tamanho de texto', () => {
    expect(cn('text-text-primary text-3xs', 'text-2xs')).toBe('text-text-primary text-2xs')
  })

  it('o className de quem consome vence a classe interna do Button', () => {
    const interna = 'rounded-3 text-2xs leading-xs'
    expect(cn(interna, 'rounded-full leading-none')).toBe('text-2xs rounded-full leading-none')
  })
})
