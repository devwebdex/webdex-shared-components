/**
 * Item da Pagination: os números de página e as setas de anterior e próximo.
 *
 * Fica fora do pagination.tsx, que tem 'use client', como o selectTriggerVariants: assim a classe
 * pode ser usada num Server Component, por exemplo num link de página (`<a href="?page=3">`).
 * Num link, o `disabled:` não se aplica, porque link não desabilita.
 *
 * O design system em HTML não desenha paginação. Como ela é navegação, os estados vêm do item
 * de navegação do próprio HTML, o menu lateral (`nav a`), já nos tokens:
 *
 *   normal     texto secundário, sem fundo               nav a
 *   hover      texto primário, fundo surface-code        nav a:hover (o --glass é o mesmo branco a 5%)
 *   ativo      texto brand-soft, fundo e borda da brand  nav a.on (10% e 30%)
 *   disabled   texto desabilitado, sem fundo             o mesmo token dos itens de lista
 *
 * Ativo é a página atual: vem de `aria-current="page"`, que o leitor de tela anuncia e o CSS lê
 * (`aria-[current=page]:`). Hover e disabled são pseudo-classes, não props (criar-componente.md).
 * Como `aria-*` sai depois de `hover:` e `disabled:` no CSS, a página atual não muda com o hover.
 *
 * MEDIDAS, todas na escala:
 *
 *   altura e largura mínima   32px  spacing.6 (o item do menu do HTML tem 38px, fora da escala)
 *   padding horizontal        4px   spacing.1: número de vários dígitos cresce, e a seta (16px)
 *                                   cabe nos 32px sem alargar o item
 *   espaço entre itens        4px   spacing.1
 *   raio                      8px   radius.2, o mesmo do item do menu
 *   fonte                     14px  text.base (13,5px no HTML)
 *   seta                      16px  spacing.4
 *
 * O foco usa o mesmo anel provisório do Button (o definitivo é o SCRUM-141), com uma classe a
 * mais: `focus-visible:outline-solid`. No Tailwind 4, o `outline-none` põe `none` na variável
 * `--tw-outline-style`, e o `outline-2` lê essa variável; sem a classe a mais, o anel fica
 * invisível. O Button tem o mesmo problema hoje (ver o PR).
 */
export const paginationItemClass = [
  'inline-flex h-6 min-w-6 items-center justify-center px-1',
  'rounded-2 border border-transparent',
  'font-sans text-base tabular-nums text-text-secondary select-none',
  'cursor-pointer transition-colors duration-100 motion-reduce:transition-none',
  'outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2',
  'focus-visible:outline-brand',
  'hover:bg-surface-code hover:text-text-primary',
  'aria-[current=page]:border-brand/30 aria-[current=page]:bg-brand/10',
  'aria-[current=page]:text-brand-soft',
  'disabled:cursor-not-allowed disabled:bg-transparent disabled:text-text-disabled',
  '[&_svg]:size-4 [&_svg]:shrink-0',
].join(' ')
