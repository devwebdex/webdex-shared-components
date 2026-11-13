---
"@devwebdex/tokens": minor
"@devwebdex/ui": minor
"@devwebdex/create": patch
---

Adota a escala do Figma em tipografia e raio (QUEBRA)

Até agora, os tamanhos de texto e os raios daqui não eram os do Figma. Vieram de
medir o componente Button, que o próprio código já documentava como off-scale.
Com as 142 Variables em mãos, deu para comparar valor a valor.

**Tamanhos de texto.** Eram `sm` 13px, `base` 14px e `lg` 15px. Desses, só o 14
existe na escala do Figma -- e lá ele se chama `2xs`. Pior, o nome `sm` significa
18px no Figma. A escala passa a ser a de lá, com 12 tamanhos de 12 a 58px:

    text-sm  (13px)  ->  text-3xs (12px)
    text-base (14px) ->  text-2xs (14px)   mesmo pixel
    text-lg  (15px)  ->  text-xs  (16px)

**Raios.** A escala estava deslocada a partir do índice 3: nosso `radius-3` valia
12px, que é o `Radius 4` do Figma. Faltava o 10px, que Button, Alert e InputField
escreviam à mão. Os nomes de classe mudam, os pixels não:

    rounded-3 (12px) ->  rounded-4
    rounded-4 (16px) ->  rounded-5
    rounded-5 (24px) ->  rounded-7
    rounded-[10px]   ->  rounded-3        agora tem token

A prop `radius` de Select, Menu e Combobox continua dando os mesmos pixels:
`radius="3"` ainda é 12px. Os valores da prop são os nomes da escala antiga.

**Novos namespaces.** `--leading-*` (11 valores) e `--tracking-*` (6) não
existiam: os componentes escreviam `leading-[22px]` e `tracking-[0.46px]` à mão.

**O tema padrão do Tailwind sai de texto, entrelinha, tracking, raio e peso.**
Antes, ele convivia com o nosso em silêncio. O Tailwind casa cada tamanho dele
com uma entrelinha (`text-xs` com 1,333, calculada para os 12px dele), e
sobrescrever só o tamanho deixava essa proporção valendo: o título do Card saía
com 21,33px. E nomes que só ele tem -- `text-base`, `rounded-lg`,
`leading-relaxed`, `font-light` -- seguiam funcionando com o valor dele.
**Quem usa um desses no próprio código deixa de ter CSS gerado para ele.** Troque
pelo token da escala.

**O que muda de tamanho:**

- Button, Select, Menu e Combobox `large`: 42px -> 40px. O leading de 26px não
  existe na escala do Figma e virou `leading-xs` (24px).
- InputField: 36px -> 38px. O leading de 18px também não existe lá e virou
  `leading-3xs` (20px). O campo deixa de ter a mesma altura do Button medium, que
  era proposital. Manter os 36px exigiria padding fora da escala Spacing: é
  decisão do design.
- Título do Card: entrelinha de 23,33px -> 24px (`leading-xs`, o mesmo par do
  título do Modal).
- Texto de 12px sem entrelinha declarada (vazio do Combobox, rótulo do
  TextField): 18,57px -> 18px.

**Projetos gerados:** os títulos dos templates usavam `text-2xl` e `text-xl`, que
existem na escala nova com outro valor. Viraram `text-lg leading-md` e
`text-md leading-sm`, que dão exatamente os mesmos 24/32px e 20/28px de antes.
