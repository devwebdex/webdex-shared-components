import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../../lib/cn.js'

/**
 * Card do design system WEbdEX: uma superfície que agrupa header, conteúdo e ações.
 *
 * O Kit de interface (docs/ui/webdex-design-system.html) não desenha um Card — não há
 * bloco equivalente lá. O desenho sai dos tokens que já existiam e ainda não tinham
 * consumidor: `color.surface-card`, que nasceu com esse nome nas Variables do Figma, e as
 * elevações do Button.
 *
 * ELEVAÇÃO EMPRESTADA DO BUTTON
 *
 * `shadow.elevation-2/4/6` tem `$description` dizendo "Elevações do Button": são os Effect
 * Styles paper/elevation da Figma, transcritos quando o Button nasceu. Reusar aqui segue o
 * passo 2 de docs/ui/criar-componente.md ("usar um token que já existe"), e o par 2 → 4 no
 * hover é o mesmo movimento que o Button faz. Se o design quiser elevações próprias de
 * superfície, a descrição do token é o lugar de registrar isso.
 *
 * OS TRÊS ESTADOS, E ONDE CADA UM MORA
 *
 * Seguindo docs/ui/criar-componente.md: pseudo-classe não vira prop, estado de aplicação
 * vira. Então `hover` é modificador de classe e `selected` é prop.
 *
 * `hover` só aparece com `interactive`. Um card que levanta ao passar o mouse e não faz
 * nada ao clique promete uma afordância que não existe; quem monta a tela é que sabe se o
 * card responde. `interactive` é estado de aplicação ("este card é clicável"), não
 * pseudo-classe, então é prop.
 *
 * ARREDONDADOS PARA O TOKEN MAIS PERTO
 *
 *   raio   radius.3 (12px)   o Button usa 2 e 3; 3 é o raio de superfície maior
 *
 * LACUNA CONHECIDA
 *
 * `interactive` dá a afordância visual e o foco, não a semântica. Card inteiro clicável
 * precisa de `role`, `tabIndex` e ativação por Enter/Espaço — isso exigiria `'use client'`
 * e um contrato de acessibilidade próprio. Até lá, o padrão recomendado é a ação real
 * viver num Button dentro de `actions`.
 */
const cardVariants = cva(
  [
    'flex flex-col gap-3 rounded-3 border p-4',
    'bg-surface-card font-sans text-base text-text-secondary',
    'shadow-elevation-2 transition-[box-shadow,border-color,background-color]',
  ],
  {
    variants: {
      /** O card responde ao clique: ganha cursor, elevação no hover e anel de foco. */
      interactive: {
        true: [
          'cursor-pointer hover:shadow-elevation-4',
          'focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2',
        ],
        false: '',
      },
      /** Escolhido numa lista: borda da marca e a superfície rosada de `surface-elevated`. */
      selected: {
        true: 'border-brand bg-surface-elevated',
        false: 'border-line-default',
      },
    },
    defaultVariants: {
      interactive: false,
      selected: false,
    },
  }
)

export type CardProps = Omit<ComponentProps<'div'>, 'title'> &
  VariantProps<typeof cardVariants> & {
    /** Header: título em destaque, no topo do card. */
    title?: ReactNode
    /** Rodapé de ações, alinhado à direita. Lugar do Button que age sobre o card. */
    actions?: ReactNode
  }

export function Card({
  className,
  interactive,
  selected,
  title,
  actions,
  children,
  ...props
}: CardProps) {
  return (
    <div
      // `data-selected`, e não `aria-selected`: num `div` sem `role` o atributo ARIA é
      // inválido e o leitor de tela o ignora — prometeria uma acessibilidade que não
      // existe. Card que for mesmo uma opção de lista recebe `role="option"` e
      // `aria-selected` de quem monta a tela, por props.
      data-selected={selected ? '' : undefined}
      // O foco só é alcançável se o card for interativo.
      tabIndex={interactive ? 0 : undefined}
      className={cn(cardVariants({ interactive, selected }), className)}
      {...props}
    >
      {title != null && <div className="font-semibold text-text-primary text-lg">{title}</div>}
      {/* min-w-0 e wrap-break-word: endereço e hash não têm espaço e vazariam da caixa. */}
      {children != null && <div className="min-w-0 wrap-break-word">{children}</div>}
      {actions != null && <div className="flex items-center justify-end gap-2">{actions}</div>}
    </div>
  )
}
