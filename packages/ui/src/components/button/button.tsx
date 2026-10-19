import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../../lib/cn.js'

/**
 * Button do design system WEbdEX.
 *
 * Os três eixos espelham as component properties do Figma (Size, Color, Variant).
 * O quarto eixo do Figma, State, NÃO vira prop: Hovered, Pressed, Disabled e
 * Focused existem lá porque a Figma não tem pseudo-classe, e aqui são
 * `hover:`, `active:`, `disabled:` e `focus-visible:`.
 *
 * VALORES SEM TOKEN (valor arbitrário entre colchetes). Cada um existe porque a
 * propriedade correspondente não está ligada a Variable no Figma. Relatório
 * completo e pedido ao time de design: ver o PR.
 *
 *   padding    22, 11, 10, 6, 5px   fora da escala Spacing (4, 8, 12, 16, 24...)
 *   radius     10px                 fora da escala Radius; no Figma ESTÁ ligado a
 *                                   uma Variable de uma coleção que não recebemos
 *   leading    22, 24, 26px         sem namespace de line-height nos tokens
 *   ícone      22, 20, 18px         fora da escala Spacing
 *   tracking   0.3, 0.46px          sem token
 *   cor        #4f4f4f/15           cinza do Disabled, fora da paleta
 *              white/15, white/50   brancos translúcidos sem Variable
 *
 * DIVERGÊNCIAS DELIBERADAS do Figma:
 *
 * - `focus-visible` usa um anel provisório. No Figma, Focused é pixel a pixel
 *   idêntico a Enabled nas 18 combinações, o que deixaria a navegação por teclado
 *   sem indicação. O anel definitivo é o SCRUM-141.
 * - Variantes sem borda visível levam `border-transparent` para que a borda de 1px
 *   do Outlined não as deixe 2px maiores.
 * - O wrapper vertical do auto-layout do Figma foi omitido: ele envolve uma única
 *   linha e não muda o resultado.
 */
const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 border',
    'font-sans font-medium whitespace-nowrap select-none',
    'cursor-pointer transition-[background-color,background-image,border-color,box-shadow,color]',
    'disabled:cursor-not-allowed',
    'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
    '[&_svg]:shrink-0',
  ],
  {
    variants: {
      size: {
        large: 'px-[22px] py-2 rounded-3 text-lg leading-[26px] [&_svg]:size-[22px]',
        medium:
          'px-4 py-[6px] rounded-[10px] text-base leading-[24px] tracking-[0.3px] [&_svg]:size-[20px]',
        small:
          'px-[10px] py-1 rounded-2 text-sm leading-[22px] tracking-[0.46px] [&_svg]:size-[18px]',
      },
      color: {
        brand: '',
        code: '',
      },
      variant: {
        contained: '',
        outlined: '',
        text: '',
      },
    },
    compoundVariants: [
      // O padding horizontal do Text é metade do Contained, em todos os tamanhos.
      { variant: 'text', size: 'large', class: 'px-[11px]' },
      { variant: 'text', size: 'medium', class: 'px-2' },
      { variant: 'text', size: 'small', class: 'px-[5px]' },

      // Brand: o Contained é gradiente diagonal (Coral -> Brand), e o hover troca
      // o fim para Magenta 80. As três elevações vêm de shadow.json.
      {
        color: 'brand',
        variant: 'contained',
        class: [
          'border-transparent bg-linear-to-br from-coral-50 to-brand text-text-primary shadow-1',
          'hover:to-magenta-80 hover:shadow-4 active:shadow-6',
          'disabled:bg-none disabled:bg-[#4f4f4f]/15 disabled:text-white/15 disabled:shadow-none',
        ],
      },
      {
        color: 'brand',
        variant: 'outlined',
        class: [
          'border-brand text-brand hover:bg-brand-soft/15',
          'disabled:border-white/15 disabled:bg-transparent disabled:text-white/15',
        ],
      },
      {
        color: 'brand',
        variant: 'text',
        class: [
          'border-transparent text-brand hover:bg-brand-soft/10',
          'disabled:bg-transparent disabled:text-white/15',
        ],
      },

      // Code: superfície translúcida sobre o fundo escuro, sem gradiente.
      {
        color: 'code',
        variant: 'contained',
        class: [
          'border-line-default bg-surface-code text-text-primary shadow-1',
          'hover:border-white/50 hover:shadow-4 active:shadow-6',
          'disabled:border-transparent disabled:bg-[#4f4f4f]/15 disabled:text-white/15 disabled:shadow-none',
        ],
      },
      {
        color: 'code',
        variant: 'outlined',
        class: [
          'border-text-primary/27 text-text-primary hover:bg-surface-code',
          'disabled:border-white/15 disabled:bg-transparent disabled:text-white/15',
        ],
      },
      {
        color: 'code',
        variant: 'text',
        class: [
          'border-transparent text-text-primary hover:bg-surface-code',
          'disabled:bg-transparent disabled:text-white/15',
        ],
      },
    ],
    defaultVariants: {
      size: 'medium',
      color: 'brand',
      variant: 'contained',
    },
  }
)

// `color` é omitido porque o atributo HTML de mesmo nome aceita string e
// conflitaria com os valores da variante.
export type ButtonProps = Omit<ComponentProps<'button'>, 'color'> &
  VariantProps<typeof buttonVariants> & {
    /** Ícone antes do rótulo. */
    iconLeft?: ReactNode
    /** Ícone depois do rótulo. */
    iconRight?: ReactNode
  }

export function Button({
  className,
  size,
  color,
  variant,
  iconLeft,
  iconRight,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ size, color, variant }), className)}
      {...props}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  )
}

export { buttonVariants }
