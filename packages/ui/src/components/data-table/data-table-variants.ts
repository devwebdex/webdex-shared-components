import { cva } from 'class-variance-authority'

/**
 * Classes da DataTable. Ficam fora do data-table.tsx, que tem 'use client', como o
 * paginationItemClass: um Server Component pode montar uma tabela estática com elas.
 *
 * O estilo vem da tabela do design system em HTML (`table.tk`): fonte de 13px, texto secundário,
 * borda inferior da linha em cada célula. Os estados da linha:
 *
 *   hover        fundo surface-elevated (brand a 6%), texto primário e a barra brand de 2px na
 *                borda esquerda, a mesma do item em destaque da lista (lib/list.ts)
 *   selecionada  fundo brand-focus (brand a 12%), o fundo da página atual na Pagination. Como
 *                `aria-*` sai depois de `hover:` e `even:` no CSS, a seleção vence os dois
 *   listrada     linhas pares em surface-code (branco a 5%), que não se confunde com o hover,
 *                que é rosado
 *
 * A barra do hover é sombra interna na primeira célula, não `before:` na linha: `position:
 * relative` em `<tr>` não posiciona filho em todos os navegadores.
 *
 * MEDIDAS, todas na escala salvo a barra:
 *
 *   fonte              14px     text-2xs (13px no HTML)
 *   célula confortável 8px 12px py-2 px-3 (9px 10px no HTML), o mesmo padding do cabeçalho
 *   célula compacta    4px 12px py-1 px-3
 *   checkbox           16px     size-4
 *   raio do contêiner  12px     rounded-4, o do Card do Skeleton
 *
 * VALORES SEM TOKEN: a barra de 2px do hover (`inset_2px_0_0`), menor que o menor espaçamento,
 * como a do item de lista.
 *
 * VALORES SEM TOKEN (recursos da tabela):
 *
 *   colunas de controle  40px   `w-[40px]` (seta de expandir e checkbox): a escala pula de 32 para
 *                               48px, e 40px é o que o checkbox já ocupava (16px + 12px de cada
 *                               lado). Largura fixa porque o `left` da coluna fixa é a soma delas:
 *                               `left-[40px]` e `left-[80px]`
 *   coluna de ações      56px   `w-[56px]`, o botão de 32px mais 12px de cada lado, para o
 *                               `<colgroup>` do `table-fixed`
 *   cards                40rem  `@max-[40rem]`: abaixo disso a tabela vira cards. Nenhum tamanho
 *                               de contêiner do Tailwind dá 40rem (`@xl` 36rem, `@2xl` 42rem)
 *
 * COLUNA FIXA (`stickyFirstColumn`). A célula fixa precisa de fundo opaco, senão o conteúdo que
 * rola passa por baixo dela à vista. Mas o fundo dos estados da linha (hover, seleção, listra) é
 * translúcido e fica no `<tr>`, atrás da célula: com um `bg-*` opaco na célula, ele sumiria.
 * A saída: a linha publica a cor do estado numa variável (`--data-table-row-bg`), com os mesmos
 * modificadores do fundo dela, e a célula fixa pinta três camadas: `background` (opaco, o fundo da
 * página), por cima `surface-card` (o fundo do contêiner) e por cima a cor da variável. O
 * resultado é a mesma cor das células vizinhas, contanto que o contêiner esteja sobre o fundo da
 * página. A separação da parte que rola é uma linha de 1px (`after:`) à direita da última fixa.
 *
 * O contêiner tem `border`, não `inset-ring`: o `inset-ring` é sombra, e o fundo das linhas
 * (hover, seleção, listras) e do cabeçalho fixo pintaria por cima dela nas bordas.
 */

export const dataTableContainerClass =
  'flex flex-col overflow-hidden rounded-4 border border-line-default bg-surface-card font-sans'

/** Faixas da barra e do rodapé: respiro até a borda e uma linha separando da tabela. */
export const dataTableToolbarAreaClass = 'border-b border-line-default px-3 py-2'
export const dataTableFooterAreaClass = 'border-t border-line-default px-3 py-2'

/** A área que rola. Recebe foco quando rola, para quem usa teclado. */
export const dataTableScrollAreaClass = [
  'relative overflow-auto',
  'outline-none focus-visible:outline-solid focus-visible:outline-2',
  'focus-visible:-outline-offset-2 focus-visible:outline-brand',
].join(' ')

export const dataTableClass = 'w-full border-collapse text-2xs text-text-secondary'

export const dataTableCaptionClass = 'px-3 py-2 text-left text-xs font-medium text-text-primary'

export const dataTableHeadVariants = cva('', {
  variants: {
    /** Cabeçalho fixo no topo ao rolar; o fundo é opaco para as linhas não aparecerem por baixo. */
    sticky: {
      true: 'sticky top-0 z-10 bg-background',
      false: '',
    },
  },
  defaultVariants: { sticky: false },
})

export const dataTableRowVariants = cva(
  [
    'border-b border-line-default last:border-b-0',
    'transition-colors duration-100 motion-reduce:transition-none',
    'hover:bg-surface-elevated hover:text-text-primary',
    '[&>td:first-child]:shadow-[inset_2px_0_0_transparent]',
    'hover:[&>td:first-child]:shadow-[inset_2px_0_0_var(--color-brand)]',
    '[&>td:first-child]:transition-shadow [&>td:first-child]:duration-100',
    'motion-reduce:[&>td:first-child]:transition-none',
    'aria-selected:bg-brand-focus aria-selected:text-text-primary',
    // A mesma cor de cada estado, para a célula fixa (ver COLUNA FIXA acima).
    'hover:[--data-table-row-bg:var(--color-surface-elevated)]',
    'aria-selected:[--data-table-row-bg:var(--color-brand-focus)]',
  ],
  {
    variants: {
      striped: {
        true: 'even:bg-surface-code even:[--data-table-row-bg:var(--color-surface-code)]',
        false: '',
      },
    },
    defaultVariants: { striped: false },
  }
)

export const dataTableCellVariants = cva('px-3 align-middle', {
  variants: {
    align: {
      start: 'text-left',
      center: 'text-center',
      end: 'text-right',
    },
    density: {
      comfortable: 'py-2',
      compact: 'py-1',
    },
  },
  defaultVariants: { align: 'start', density: 'comfortable' },
})

/** Checkbox nativo da seleção, na cor da marca. */
export const dataTableCheckboxClass = [
  'block size-4 cursor-pointer accent-brand',
  'outline-none focus-visible:outline-solid focus-visible:outline-2',
  'focus-visible:outline-offset-2 focus-visible:outline-brand',
].join(' ')

/** Faixa das ações em lote, entre a barra e a tabela. */
export const dataTableBulkAreaClass = 'border-b border-line-default'

/** Coluna de controle (seta de expandir, checkbox): largura fixa, para somar o `left` fixo. */
export const dataTableControlCellClass = 'w-[40px]'

/** Coluna das ações da linha no `<colgroup>`, com `resizableColumns`. */
export const dataTableActionsColClass = 'w-[56px]'

/** `left` da célula fixa pela posição dela entre as fixas (cada coluna de controle tem 40px). */
export const dataTableStickyLeftClass = ['left-0', 'left-[40px]', 'left-[80px]'] as const

/** Célula fixa do corpo: o fundo em três camadas descrito em COLUNA FIXA. */
export const dataTableStickyBodyCellClass = [
  'sticky z-[1] bg-background',
  'bg-[linear-gradient(var(--data-table-row-bg,transparent),var(--data-table-row-bg,transparent)),linear-gradient(var(--color-surface-card),var(--color-surface-card))]',
].join(' ')

export const dataTableStickyHeadCellVariants = cva('sticky z-20 bg-background', {
  variants: {
    /**
     * Com o cabeçalho fixo, o `<thead>` já é `bg-background` opaco, e a célula fica igual a ele.
     * Sem ele, o cabeçalho mostra o contêiner (`surface-card`), e a célula pinta essa camada.
     */
    stickyHeader: {
      true: '',
      false: 'bg-[linear-gradient(var(--color-surface-card),var(--color-surface-card))]',
    },
  },
  defaultVariants: { stickyHeader: false },
})

/** Linha à direita da última célula fixa, separando-a da parte que rola. */
export const dataTableStickyEdgeClass =
  'after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-line-default'

/** Botão da seta de expandir: gira 90° aberto. O resto do estilo vem do item da Pagination. */
export const dataTableExpandButtonClass = [
  'size-5 min-w-0 px-0 [&>svg]:size-4',
  '[&>svg]:transition-transform [&>svg]:duration-100 motion-reduce:[&>svg]:transition-none',
  'aria-expanded:[&>svg]:rotate-90',
].join(' ')

/**
 * Linha de detalhe, logo abaixo da expandida: fundo surface-code (branco a 5%) para se ler como
 * parte da linha de cima, sem hover nem barra, porque não é uma linha de dados.
 */
export const dataTableDetailRowClass =
  'border-b border-line-default last:border-b-0 bg-surface-code'
export const dataTableDetailCellClass = 'px-4 py-3 text-text-secondary'

/** Área da tabela e lista de cards com `mobileLayout="cards"`: um some quando o outro aparece. */
export const dataTableCardsContainerClass = '@container'
export const dataTableScrollAreaCardsClass = '@max-[40rem]:hidden'
export const dataTableCardsAreaClass = 'hidden @max-[40rem]:block'
