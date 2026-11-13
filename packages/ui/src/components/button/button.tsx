import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../../lib/cn.js'
import { SpinnerGlyph, type SpinnerVariant } from '../spinner/spinner.js'

/**
 * Button do design system WEbdEX.
 *
 * Os três eixos espelham as component properties do Figma (Size, Color, Variant).
 * O quarto eixo do Figma, State, NÃO vira prop: Hovered, Pressed, Disabled e
 * Focused existem lá porque a Figma não tem pseudo-classe, e aqui são
 * `hover:`, `active:`, `disabled:` e `focus-visible:`.
 *
 * O QUE MUDOU AO ADOTAR A ESCALA DO FIGMA:
 *
 *   radius     o valor arbitrário de 10px virou `rounded-3`, sem mudar de pixel. Ele sempre
 *              foi a Variable `Radius 3`; faltava a coleção, que agora está nos tokens.
 *   leading    22 e 24px viraram `leading-2xs` e `leading-xs` sem mudar de valor. O 26px
 *              do large não está na escala e virou `leading-xs` (24px): o large ficou 2px
 *              mais baixo.
 *   tracking   0,3 -> `tracking-wide` (0,25px) e 0,46 -> `tracking-widest` (0,5px).
 *              Nenhum dos dois originais está na escala do Figma.
 *
 * VALORES SEM TOKEN (valor arbitrário entre colchetes). Cada um existe porque a
 * propriedade correspondente não está ligada a Variable no Figma. Relatório
 * completo e pedido ao time de design: ver o PR.
 *
 *   padding    22, 11, 10, 6, 5px   fora da escala Spacing (4, 8, 12, 16, 24...)
 *   ícone      22, 20, 18px         fora da escala Spacing
 *   cor        #4f4f4f/15           cinza do Disabled, fora da paleta
 *              white/15, white/50   brancos translúcidos sem Variable
 *
 * DIVERGÊNCIAS DELIBERADAS do Figma:
 *
 * - `focus-visible` usa um anel provisório. No Figma, Focused é pixel a pixel
 *   idêntico a Enabled nas 18 combinações, o que deixaria a navegação por teclado
 *   sem indicação. O anel definitivo é o SCRUM-141.
 * - A borda do Outlined é `inset-ring`, não `border`. No Figma, Contained e Outlined
 *   têm a mesma altura (82x42 no Large): o stroke não entra na caixa. `border` somaria
 *   1px em cima e 1px embaixo e deixaria o componente 2px mais alto que o desenho.
 *   `inset-ring` é box-shadow, então não afeta o layout.
 * - O wrapper vertical do auto-layout do Figma foi omitido: ele envolve uma única
 *   linha e não muda o resultado.
 *
 * LOADING não é um estado do Figma, é estado da aplicação: por isso é prop. O botão
 * fica com `aria-busy` e `aria-disabled`, mas não com `disabled`, que tiraria o foco
 * dele no meio do envio; em vez disso, o clique é ignorado e o `submit` não dispara.
 * O spinner vem na cor do texto e, por padrão, entra no lugar do ícone da esquerda
 * com o rótulo visível; `loadingPosition="center"` esconde o rótulo sem mudar a largura.
 */
const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'font-sans font-medium whitespace-nowrap select-none',
    'cursor-pointer transition-[background-color,background-image,box-shadow,color]',
    'disabled:cursor-not-allowed',
    'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
    '[&_svg]:shrink-0',
  ],
  {
    variants: {
      size: {
        large: 'px-[22px] py-2 rounded-4 text-xs leading-xs [&_svg]:size-[22px]',
        medium: 'px-4 py-[6px] rounded-3 text-2xs leading-xs tracking-wide [&_svg]:size-[20px]',
        small: 'px-[10px] py-1 rounded-2 text-3xs leading-2xs tracking-widest [&_svg]:size-[18px]',
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
      // o fim para Magenta 80. As elevações são os Effect Styles paper/elevation-N do Figma.
      {
        color: 'brand',
        variant: 'contained',
        class: [
          'bg-linear-to-br from-coral-50 to-brand text-text-primary shadow-elevation-2',
          'hover:to-magenta-80 hover:shadow-elevation-4 active:shadow-elevation-6',
          'disabled:bg-none disabled:bg-[#4f4f4f]/15 disabled:text-white/15 disabled:shadow-none',
        ],
      },
      {
        color: 'brand',
        variant: 'outlined',
        class: [
          'inset-ring-1 inset-ring-brand text-brand hover:bg-brand-soft/15',
          'disabled:inset-ring-white/15 disabled:bg-transparent disabled:text-white/15',
        ],
      },
      {
        color: 'brand',
        variant: 'text',
        class: [
          'text-brand hover:bg-brand-soft/10',
          'disabled:bg-transparent disabled:text-white/15',
        ],
      },

      // Code: superfície translúcida sobre o fundo escuro, sem gradiente.
      {
        color: 'code',
        variant: 'contained',
        class: [
          'inset-ring-1 inset-ring-line-default bg-surface-code text-text-primary shadow-elevation-2',
          'hover:inset-ring-white/50 hover:shadow-elevation-4 active:shadow-elevation-6',
          'disabled:inset-ring-0 disabled:bg-[#4f4f4f]/15 disabled:text-white/15 disabled:shadow-none',
        ],
      },
      {
        color: 'code',
        variant: 'outlined',
        class: [
          'inset-ring-1 inset-ring-text-primary/27 text-text-primary hover:bg-surface-code',
          'disabled:inset-ring-white/15 disabled:bg-transparent disabled:text-white/15',
        ],
      },
      {
        color: 'code',
        variant: 'text',
        class: [
          'text-text-primary hover:bg-surface-code',
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
    /** Ação em andamento: mostra o spinner e ignora cliques. */
    loading?: boolean
    /** Desenho do spinner: `ring` (círculo, padrão), `pixel` (losango da marca) ou `dots`. */
    loadingIndicator?: SpinnerVariant
    /**
     * Onde o spinner aparece: `start` no lugar do ícone da esquerda (padrão), `end` no da
     * direita, `center` no meio com o rótulo escondido, sem mudar a largura do botão.
     */
    loadingPosition?: 'start' | 'end' | 'center'
    /** Rótulo durante o carregamento (ex.: "Salvando…"); vira também o nome acessível. */
    loadingText?: ReactNode
  }

export function Button({
  className,
  size,
  color,
  variant,
  iconLeft,
  iconRight,
  loading = false,
  loadingIndicator = 'ring',
  loadingPosition = 'start',
  loadingText,
  type = 'button',
  onClick,
  'aria-disabled': ariaDisabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      // `button`, não `submit`: um botão `aria-disabled` ainda recebe clique e Enter.
      type={loading ? 'button' : type}
      onClick={loading ? undefined : onClick}
      aria-disabled={loading || ariaDisabled}
      aria-busy={loading || undefined}
      className={cn(
        buttonVariants({ size, color, variant }),
        loading && 'cursor-wait',
        loading && loadingPosition === 'center' && 'relative',
        className
      )}
    >
      {loading ? (
        <LoadingContent
          indicator={loadingIndicator}
          position={loadingPosition}
          iconLeft={iconLeft}
          iconRight={iconRight}
          label={loadingText ?? children}
        />
      ) : (
        <>
          {iconLeft}
          {children}
          {iconRight}
        </>
      )}
    </button>
  )
}

function LoadingContent({
  indicator,
  position,
  iconLeft,
  iconRight,
  label,
}: {
  indicator: SpinnerVariant
  position: 'start' | 'end' | 'center'
  iconLeft: ReactNode
  iconRight: ReactNode
  label: ReactNode
}) {
  const spinner = <SpinnerGlyph variant={indicator} tone="current" />
  if (position === 'center') {
    // O conteúdo fica transparente, mas segue no layout e no nome acessível.
    return (
      <>
        <span className="inline-flex items-center gap-2 opacity-0">
          {iconLeft}
          {label}
          {iconRight}
        </span>
        <span className="absolute inset-0 flex items-center justify-center">{spinner}</span>
      </>
    )
  }
  return position === 'start' ? (
    <>
      {spinner}
      {label}
      {iconRight}
    </>
  ) : (
    <>
      {iconLeft}
      {label}
      {spinner}
    </>
  )
}

export { buttonVariants }
