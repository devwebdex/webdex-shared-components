import { cva } from 'class-variance-authority'
import { attentionClass } from './list.js'

/**
 * Gatilho de campo do Select e do Combobox. Fica fora dos componentes, que levam 'use client':
 * assim um Server Component pode chamar `selectTriggerVariants` para estilizar outro elemento.
 *
 * Parte do Button `code` (superfície translúcida com borda fina): no hover a borda esquenta para
 * `brand-soft`, aberto ela fica `brand` e a seta gira. Estados são atributos, não props: aberto é
 * `data-[state=open]`, sem valor é `data-placeholder`.
 *
 * VALORES SEM TOKEN, os mesmos do Button: padding vertical de 6px no medium e ícones de 22, 20
 * e 18px, fora da escala Spacing.
 *
 * Tamanho e entrelinha seguem o Button: o 26px do large não existe na escala do Figma e virou
 * `leading-xs` (24px), então o campo large mede 40px, como o Button large. O `radius` continua
 * dando os mesmos pixels de antes: `radius="3"` é 12px, hoje via `rounded-4` -- os valores da
 * prop são os nomes da escala antiga, e alinhá-los aos do Figma é decisão de API à parte.
 */
export const selectTriggerVariants = cva(
  [
    'relative inline-flex w-full items-center justify-between gap-2',
    'font-sans text-text-primary bg-surface-code inset-ring-1 inset-ring-line-default',
    'cursor-pointer select-none transition-[box-shadow,background-color] duration-150',
    'hover:bg-surface-elevated hover:inset-ring-brand-soft/40 data-[state=open]:inset-ring-brand',
    'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
    'data-placeholder:text-text-secondary',
    'disabled:cursor-not-allowed disabled:bg-surface-code disabled:text-text-disabled',
    'disabled:inset-ring-line-default',
    '[&_svg]:shrink-0',
  ],
  {
    variants: {
      size: {
        large: 'px-4 py-2 text-xs leading-xs [&_svg]:size-[22px]',
        medium: 'px-3 py-[6px] text-2xs leading-xs [&_svg]:size-[20px]',
        small: 'px-2 py-1 text-3xs leading-2xs [&_svg]:size-[18px]',
      },
      radius: {
        '0': 'rounded-0',
        '1': 'rounded-1',
        '2': 'rounded-2',
        '3': 'rounded-4',
        '4': 'rounded-5',
        '5': 'rounded-7',
        full: 'rounded-full',
      },
      /** Halo pulsante para chamar a atenção; some ao abrir e não volta depois de escolhido um valor. */
      attention: {
        true: [attentionClass, 'not-data-placeholder:after:hidden'],
        false: '',
      },
    },
    defaultVariants: { size: 'medium', radius: '2', attention: false },
  }
)
