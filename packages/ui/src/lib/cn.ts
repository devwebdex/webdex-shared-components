import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge, validators } from 'tailwind-merge'

/**
 * O tailwind-merge só reconhece como conflitantes as classes que ele sabe ler. Sem isto, ele
 * não entende a escala do Figma: `rounded-4` (raio numérico) e `leading-xs` (entrelinha em
 * tamanho de camiseta) não são escalas do tema padrão do Tailwind. As duas classes ficavam no
 * elemento e vencia a ordem do CSS -- um `<Button className="rounded-full">` deixava de
 * funcionar de forma confiável.
 *
 * Validadores, e não lista de nomes: raio é sempre inteiro (`0` a `7`, `100`) e entrelinha é
 * sempre tamanho de camiseta (`4xs` a `4xl`). Token novo dentro desse formato funciona sem
 * mexer aqui. Tamanho de texto (`text-3xs`) e tracking (`tracking-wide`) o tailwind-merge já lia.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: [validators.isInteger],
      leading: [validators.isTshirtSize],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
