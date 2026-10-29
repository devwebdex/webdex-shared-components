import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../../lib/cn.js'

/**
 * Alert do design system WEbdEX.
 *
 * Referência: o bloco "Alertas" do Kit de interface, em docs/ui/webdex-design-system.html.
 * Lá só existem sucesso e erro; info e warning seguem o mesmo desenho, cada um com a sua
 * cor semântica.
 *
 * O eixo `variant` usa os nomes do SCRUM-166: info, warning, error e success. Nos tokens, o
 * vermelho se chama `danger`, então `error` lê `color.danger` e `color.danger-bg`.
 *
 * VALORES SEM TOKEN (valor arbitrário entre colchetes):
 *
 *   radius    10px   o --r-m do HTML, o mesmo do Button medium; fora da escala Radius (8, 12)
 *   leading   22px   sem namespace de line-height nos tokens
 *
 * ARREDONDADOS PARA O TOKEN MAIS PERTO (o HTML usa outro número):
 *
 *   padding horizontal   15px      ->  spacing.4 (16px)
 *   espaço do símbolo    11px      ->  spacing.3 (12px)
 *   fonte                13.5px    ->  text.base (14px)
 *   fundo                cor a 8%  ->  color.<cor>-bg, a 14% (Variable do Figma)
 *
 * Onde o HTML e o token divergem, vale o token (docs/ui/html-primeiro.md). O margin-bottom
 * do HTML não entra: o espaço entre alertas é de quem monta a tela.
 */
const alertVariants = cva(
  [
    'flex items-start gap-3 rounded-[10px] border px-4 py-3',
    'font-sans text-base leading-[22px] text-text-secondary',
  ],
  {
    variants: {
      variant: {
        info: 'border-info/30 bg-info-bg',
        warning: 'border-warning/30 bg-warning-bg',
        error: 'border-danger/30 bg-danger-bg',
        success: 'border-success/30 bg-success-bg',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  }
)

/** O símbolo usa a cor cheia da variante; o texto fica no secundário, como no HTML. */
const symbolVariants = cva('shrink-0 font-mono font-bold', {
  variants: {
    variant: {
      info: 'text-info',
      warning: 'text-warning',
      error: 'text-danger',
      success: 'text-success',
    },
  },
  defaultVariants: {
    variant: 'info',
  },
})

type Variant = NonNullable<VariantProps<typeof alertVariants>['variant']>

/** ✓ e ✕ vêm do HTML; i e ! completam as duas variantes que ele não desenhou. */
const SYMBOLS: Record<Variant, string> = {
  info: 'i',
  warning: '!',
  error: '✕',
  success: '✓',
}

/**
 * error e warning interrompem o leitor de tela (`alert`); info e success esperam a fala
 * atual terminar (`status`). Quem precisar de outro comportamento passa `role`.
 */
const ROLES: Record<Variant, 'alert' | 'status'> = {
  info: 'status',
  warning: 'alert',
  error: 'alert',
  success: 'status',
}

// `title` é omitido porque o atributo HTML de mesmo nome (a dica que aparece ao parar o
// mouse) aceita só string; aqui ele é o título em negrito.
export type AlertProps = Omit<ComponentProps<'div'>, 'title'> &
  VariantProps<typeof alertVariants> & {
    /** Título em negrito, na mesma linha do texto. */
    title?: ReactNode
    /** Troca o símbolo da variante (✓, ✕, i, !). `null` esconde. */
    icon?: ReactNode
  }

export function Alert({ className, variant, title, icon, role, children, ...props }: AlertProps) {
  const tone = variant ?? 'info'
  const symbol = icon === undefined ? SYMBOLS[tone] : icon

  return (
    <div
      role={role ?? ROLES[tone]}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {symbol != null && symbol !== false && (
        <span aria-hidden="true" className={symbolVariants({ variant })}>
          {symbol}
        </span>
      )}
      {/* min-w-0 e wrap-break-word: endereço e hash não têm espaço e vazariam da caixa. */}
      <div className="min-w-0 wrap-break-word">
        {title != null && <strong className="font-bold text-text-primary">{title}</strong>}
        {title != null && children != null && ' '}
        {children}
      </div>
    </div>
  )
}
