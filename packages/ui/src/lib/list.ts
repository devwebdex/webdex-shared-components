import { cva } from 'class-variance-authority'

/**
 * Lista suspensa compartilhada pelo Select e pelo Menu: a caixa que abre e os itens dela.
 *
 * Os estados vêm dos atributos que o Radix põe no DOM (`data-highlighted`, `aria-disabled`,
 * `data-state`), escritos como classes literais para o Tailwind encontrá-las no código.
 *
 * VALORES SEM TOKEN: altura de linha (22, 24, 26px), como no Button, porque os tokens não têm
 * escala de line-height; e a barra de 2px do item em destaque, menor que o menor espaçamento.
 */

/** Tamanhos com as alturas do Button (42, 36 e 30px), para campo e botão alinharem lado a lado. */
export type ListSize = 'large' | 'medium' | 'small'

/** Nomes dos tokens de `radius` (0, 4, 8, 12, 16, 24px e `full`). */
export type ListRadius = '0' | '1' | '2' | '3' | '4' | '5' | 'full'

// O item fica dentro da caixa com 4px de respiro (p-1): o raio dele é o da caixa menos 4px, para
// as curvas serem concêntricas. Uma caixa de várias linhas não pode ser pílula, então `full`
// arredonda a caixa até o maior token (24px) e deixa a pílula para os itens.
//
// A abertura cresce a partir do gatilho (o componente define o `origin` com a variável do Radix)
// usando @starting-style. O fechamento usa o `animate-list-out` dos tokens: o Radix espera a
// animação terminar antes de desmontar a lista.
export const listPopupVariants = cva(
  [
    'z-50 overflow-y-auto p-1',
    'bg-background text-text-primary font-sans shadow-elevation-6',
    'inset-ring-1 inset-ring-line-default',
    'transition-[opacity,scale] duration-150 ease-out starting:opacity-0 starting:scale-97',
    'data-[state=closed]:animate-list-out',
    'motion-reduce:transition-none motion-reduce:data-[state=closed]:animate-none',
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

// O item em destaque ganha uma barra fina na borda esquerda, além do fundo: marca onde o teclado
// ou o mouse está, como um cursor. A cor da barra fica no tom, para não disputar com a do danger.
export const listItemVariants = cva(
  [
    'relative flex w-full items-center gap-2 select-none',
    'cursor-pointer outline-none transition-colors duration-100 motion-reduce:transition-none',
    'data-highlighted:bg-brand-soft/10 data-[state=checked]:text-brand',
    'before:absolute before:inset-y-1 before:left-0 before:w-[2px] before:rounded-full',
    'before:opacity-0 before:transition-opacity data-highlighted:before:opacity-100',
    // aria-disabled, não data-disabled: o cmdk (Combobox) põe data-disabled="false" em todo item.
    'aria-disabled:cursor-not-allowed aria-disabled:text-text-disabled',
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
        default: 'before:bg-brand',
        danger: 'text-danger before:bg-danger data-highlighted:bg-danger-bg',
      },
    },
    defaultVariants: { size: 'medium', radius: '2', tone: 'default' },
  }
)

export const listSeparatorClass = 'my-1 h-px bg-line-default'

/**
 * Halo que pulsa em volta do gatilho para chamar a atenção (ex.: rede ainda não escolhida).
 * Some quando a lista abre e para com `prefers-reduced-motion`. O gatilho precisa de `relative`.
 */
export const attentionClass = [
  'after:pointer-events-none after:absolute after:-inset-1 after:rounded-[inherit]',
  'after:inset-ring-2 after:inset-ring-brand/60 after:animate-pulse',
  'data-[state=open]:after:hidden motion-reduce:after:animate-none',
].join(' ')
