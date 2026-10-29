import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '../../lib/cn.js'

/**
 * Campo de texto do design system WEbdEX: o `<input>` sozinho, sem rótulo nem
 * mensagem. Para o campo completo, com label, helper text e contador, use o
 * TextField.
 *
 * A referência visual é o `.inp` de docs/ui/webdex-design-system.html.
 *
 * Só `status` vira prop, porque erro e sucesso são estado da aplicação. Hover,
 * focus e disabled são pseudo-classes: `hover:`, `focus-visible:` e `disabled:`.
 * As cores de hover e foco ficam dentro de cada status, e não na base, para que
 * duas classes `hover:border-*` nunca disputem a mesma propriedade.
 *
 * VALORES SEM TOKEN:
 *
 *   radius     10px          o mesmo do Button medium, para os dois alinharem lado
 *                            a lado; fora da escala Radius (8, 12)
 *   leading    18px          sem namespace de line-height nos tokens. Com py-2 e a
 *                            borda, o campo fica com 36px, a altura do Button medium
 *   cor        white/22      a borda de hover (`--line-h` no HTML), sem token
 *
 * DIVERGÊNCIAS do HTML de referência:
 *
 * - O fundo é `background/55`, não rgba(5,3,8,.55): o token mais próximo.
 * - O padding horizontal é 12px (`spacing.3`), não 13px.
 * - Hover, success e disabled não existem no HTML e foram derivados dele: hover
 *   usa a linha mais forte (`--line-h`), success repete o desenho do erro com
 *   `color.success`.
 */
const inputFieldVariants = cva(
  [
    'w-full min-w-0 rounded-[10px] border bg-background/55 px-3 py-2',
    'font-mono text-sm leading-[18px] text-text-primary placeholder:text-text-disabled',
    'outline-none transition-[border-color,box-shadow]',
    'focus-visible:ring-3',
    'disabled:cursor-not-allowed disabled:border-line-default disabled:bg-transparent disabled:text-text-disabled',
  ],
  {
    variants: {
      status: {
        default: [
          'border-line-default hover:border-white/22',
          'focus-visible:border-brand/60 focus-visible:ring-brand/12',
        ],
        error: [
          'border-danger/60 hover:border-danger',
          'focus-visible:border-danger/60 focus-visible:ring-danger/12',
        ],
        success: [
          'border-success/60 hover:border-success',
          'focus-visible:border-success/60 focus-visible:ring-success/12',
        ],
      },
    },
    defaultVariants: {
      status: 'default',
    },
  }
)

export type InputFieldProps = ComponentProps<'input'> & VariantProps<typeof inputFieldVariants>

export function InputField({ className, status, ...props }: InputFieldProps) {
  return (
    <input
      aria-invalid={status === 'error' || undefined}
      className={cn(inputFieldVariants({ status }), className)}
      {...props}
    />
  )
}

export { inputFieldVariants }
