import { cva } from 'class-variance-authority'

/**
 * Lista suspensa compartilhada pelo Select e pelo Menu: a caixa que abre e os itens dela.
 *
 * Os estados vêm dos atributos que o Radix põe no DOM (`data-highlighted`, `data-disabled`,
 * `data-state`), escritos como classes literais para o Tailwind encontrá-las no código.
 *
 * VALORES SEM TOKEN, os mesmos do Button: altura de linha (22, 24, 26px), porque os tokens não
 * têm escala de line-height, e `white/50` na borda em hover, que não tem Variable.
 */

/** Tamanhos com as alturas do Button (42, 36 e 30px), para campo e botão alinharem lado a lado. */
export type ListSize = 'large' | 'medium' | 'small'

/** Nomes dos tokens de `radius` (0, 4, 8, 12, 16, 24px e `full`). */
export type ListRadius = '0' | '1' | '2' | '3' | '4' | '5' | 'full'

// O item fica dentro da caixa com 4px de respiro (p-1): o raio dele é o da caixa menos 4px, para
// as curvas serem concêntricas. Uma caixa de várias linhas não pode ser pílula, então `full`
// arredonda a caixa até o maior token (24px) e deixa a pílula para os itens.
export const listPopupVariants = cva(
  [
    'z-50 overflow-y-auto p-1',
    'bg-background text-text-primary font-sans shadow-elevation-6',
    'inset-ring-1 inset-ring-line-default',
  ],
  {
    variants: {
      radius: {
        '0': 'rounded-0',
        '1': 'rounded-1',
        '2': 'rounded-2',
        '3': 'rounded-3',
        '4': 'rounded-4',
        '5': 'rounded-5',
        full: 'rounded-5',
      },
    },
    defaultVariants: { radius: '2' },
  }
)

export const listItemVariants = cva(
  [
    'relative flex w-full items-center gap-2 select-none',
    'cursor-pointer outline-none',
    'data-highlighted:bg-brand-soft/15 data-[state=checked]:text-brand',
    'data-disabled:cursor-not-allowed data-disabled:text-text-disabled',
    '[&_svg]:shrink-0',
  ],
  {
    variants: {
      size: {
        large: 'px-3 py-2 text-lg leading-[26px] [&_svg]:size-[22px]',
        medium: 'px-3 py-[6px] text-base leading-[24px] [&_svg]:size-[20px]',
        small: 'px-2 py-1 text-sm leading-[22px] [&_svg]:size-[18px]',
      },
      radius: {
        '0': 'rounded-0',
        '1': 'rounded-0',
        '2': 'rounded-1',
        '3': 'rounded-2',
        '4': 'rounded-3',
        '5': 'rounded-4',
        full: 'rounded-full',
      },
      /** `danger` para ação destrutiva no Menu (ex.: Excluir). */
      tone: {
        default: '',
        danger: 'text-danger data-highlighted:bg-danger-bg',
      },
    },
    defaultVariants: { size: 'medium', radius: '2', tone: 'default' },
  }
)

export const listSeparatorClass = 'my-1 h-px bg-line-default'
