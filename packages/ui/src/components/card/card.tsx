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
 * ELEVAÇÃO EMPRESTADA DO BUTTON, MAS NÃO NO HOVER
 *
 * `shadow.elevation-2/4/6` tem `$description` dizendo "Elevações do Button": são os Effect
 * Styles paper/elevation da Figma, transcritos quando o Button nasceu. Em repouso, reusar a
 * elevation-2 aqui segue o passo 2 de docs/ui/criar-componente.md ("usar um token que já
 * existe").
 *
 * No hover, não. O par 2 → 4 que o Button faz **não se vê neste card**: as elevações paper/*
 * são pretas, e preto a 20% sobre o `background` #0c0611 escurece 2 pontos por canal. No
 * Button o hover é visível porque ele também troca de cor (`hover:to-magenta-80`,
 * `hover:bg-brand-soft/15`); o card só tinha a sombra, então não tinha hover nenhum.
 *
 * Daí o `shadow.glow-brand`: a mesma sombra, na cor da marca. É token provisório — ver a
 * `$description` dele. O caminho nativo do Tailwind seria recolorir a elevation-4 com a
 * utilitária de cor de sombra (shadow-<cor>, que vira `--tw-shadow-color`), mas ela não
 * sobrevive ao `cn`: o tailwind-merge põe as duas no mesmo grupo e descarta a elevação.
 * Um token só não tem conflito para resolver.
 *
 * (E não escreva a classe `shadow-<cor>` por extenso nem em comentário: o Tailwind varre o
 * arquivo inteiro, comentário incluído, e emite a regra para uma classe que ninguém usa.)
 *
 * O brilho é aditivo, e é por isso que ele resolve os dois casos: funciona igual com
 * `selected`, que já gastou a borda e a superfície. A outra saída seria o idioma do Select
 * (`hover:inset-ring-brand-soft/40 hover:bg-surface-elevated`), que aqui colidiria — é
 * exatamente o que o `selected` do card faz.
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
 * A MÍDIA SANGRADA É SLOT, NÃO MARGEM NEGATIVA DE QUEM CONSOME
 *
 * `media` é o primeiro slot, antes de `title`. Quem monta a tela passa só o conteúdo (uma
 * `<img>`, uma faixa com o símbolo do ativo) e o Card desfaz o próprio `p-4` com `-mt-4
 * -mx-4`, arredonda o topo junto com a caixa e recorta o que passar.
 *
 * Duas razões para a conta viver aqui e não na tela:
 *
 * 1. Ela depende de dois valores do Card — o `p-4` e o `radius.3`. Feita de fora, cada tela
 *    repete os mesmos números, e todas erram juntas no dia em que o Card mudar de raio ou de
 *    padding.
 * 2. Sem o slot, a mídia tem de entrar em `children`, que vem depois de `title`. Aí a margem
 *    negativa não tem `p-4` para cancelar: ela come o `gap-3` e espreme a imagem contra o
 *    título (12px de gap − 16px de margem = −4px).
 *
 * Como `media` é o primeiro filho do flex, o `gap-3` do Card volta a separar a mídia do
 * título sozinho — por isso não há margem embaixo.
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
    'flex flex-col gap-3 rounded-4 border p-4',
    'bg-surface-card font-sans text-2xs text-text-secondary',
    'shadow-elevation-2 transition-[box-shadow,border-color,background-color]',
  ],
  {
    variants: {
      /** O card responde ao clique: ganha cursor, brilho da marca no hover e anel de foco. */
      interactive: {
        true: [
          'cursor-pointer hover:shadow-glow-brand',
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
    /**
     * Mídia sangrada no topo, antes do `title`: imagem, faixa, gráfico. O Card desfaz o
     * próprio padding e arredonda o topo; passe só o conteúdo, sem margem negativa.
     */
    media?: ReactNode
    /** Header: título em destaque, abaixo da `media`. */
    title?: ReactNode
    /** Rodapé de ações, alinhado à direita. Lugar do Button que age sobre o card. */
    actions?: ReactNode
  }

export function Card({
  className,
  interactive,
  selected,
  media,
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
      {/*
        `-mt-4 -mx-4` cancela o `p-4` do Card; como este é o primeiro filho do flex, o `gap-3`
        cuida do espaço até o título. O `overflow-hidden` recorta no `rounded-t-4`, então
        imagem, vídeo ou gradiente seguem o raio da caixa sem precisar repeti-lo.
        `[&>img]:w-full` porque `<img>` é elemento substituído: ele não estica com o
        `align-items: stretch` do flex, e sairia no tamanho intrínseco.
      */}
      {media != null && (
        <div className="-mx-4 -mt-4 overflow-hidden rounded-t-4 [&>img]:block [&>img]:w-full">
          {media}
        </div>
      )}
      {title != null && (
        <div className="font-semibold text-text-primary text-xs leading-xs">{title}</div>
      )}
      {/* min-w-0 e wrap-break-word: endereço e hash não têm espaço e vazariam da caixa. */}
      {children != null && <div className="min-w-0 wrap-break-word">{children}</div>}
      {actions != null && <div className="flex items-center justify-end gap-2">{actions}</div>}
    </div>
  )
}
