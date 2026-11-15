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
  ],
  {
    variants: {
      striped: {
        true: 'even:bg-surface-code',
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
