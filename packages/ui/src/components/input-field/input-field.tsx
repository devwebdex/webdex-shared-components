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
 *   cor        white/22      a borda de hover (`--line-h` no HTML). Já existe token
 *                            para esse valor, `color.line-enabled` (a Variable `Line
 *                            Enabled`), mas trocar muda o que o componente pinta: fica
 *                            para um PR próprio, com o design olhando.
 *
 * ALTURA, ATENÇÃO: o campo media 36px, a altura do Button medium, porque o `rounded-3` e
 * o leading de 18px faziam os dois alinharem lado a lado. 18px não existe na escala de
 * Line Height do Figma. Ao adotar a escala, o leading virou `leading-3xs` (20px) e o campo
 * passou a 38px -- 2px mais alto que o Button medium. Não dá para ter os dois: 36px com
 * leading da escala exigiria padding de 9 ou 7px, fora da escala Spacing. Ou o Button
 * medium cresce, ou o campo usa outro padding: é decisão do design.
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
    'w-full min-w-0 rounded-3 border bg-background/55 px-3 py-2',
    'font-mono text-3xs leading-3xs text-text-primary placeholder:text-text-disabled',
    'outline-none transition-[border-color,box-shadow]',
    'focus-visible:ring-3',
    'disabled:cursor-not-allowed disabled:border-line-default disabled:bg-transparent disabled:text-text-disabled',
  ],
  {
    variants: {
      status: {
        default: [
          'border-line-default hover:border-white/22',
          'focus-visible:border-brand-active focus-visible:ring-brand-focus',
        ],
        error: [
          'border-danger-active hover:border-danger',
          'focus-visible:border-danger-active focus-visible:ring-danger-focus',
        ],
        success: [
          'border-success-active hover:border-success',
          'focus-visible:border-success-active focus-visible:ring-success-focus',
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
