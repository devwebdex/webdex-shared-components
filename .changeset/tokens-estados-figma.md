---
"@devwebdex/tokens": minor
"@devwebdex/ui": patch
---

Escada de alpha de estado do Figma, como tokens

O Figma define uma escada única de estado -- hover 8%, focus 12%, disabled 18%,
pressed 28%, selected 42%, active 56% -- e a aplica a branco, preto, às quatro
cores semânticas e à marca. São 48 Variables; só as quatro cores semânticas base
já existiam aqui.

Sem elas, cada componente inventou o seu: os componentes usam **onze valores de
alpha diferentes** (10, 12, 15, 20, 22, 27, 30, 40, 50, 55 e 60%), e só o 12% é
um estado da escada.

44 tokens novos (`white-hover`, `brand-pressed`, `danger-focus`...), em
`color-estado.json` separado do `color.json`, para PR nova não precisar editar o
arquivo das cores base. Os hex são literais, e o build confere cada um contra a
cor base: se uma base mudar e a escada não, o build para e diz o valor certo.

Religa 24 dos 33 sítios. Os componentes estavam **aproximando** a escada sem
saber que ela existia, então o nome do estado bate em quase todos:

- InputField, três anéis de foco: já estavam a 12%, o `focus` da escada. Sem
  mudança visual.
- Button, oito usos em `disabled:`: 15% -> `white-disabled` (18%).
- InputField, cinco bordas de status: 60% -> `-active` (56%).
- Alert, quatro bordas de variante: 30% -> `-pressed` (28%).
- Pagination, página atual: borda 30% -> `brand-pressed` (28%), fundo 10% ->
  `brand-focus` (12%).
- Select, Menu e Combobox, halo de atenção: 60% -> `brand-active` (56%).
- InputField, borda de hover: `white/22` -> o token de traço `line-enabled`, o
  mesmo 22%.

A mudança visual é de no máximo 4 pontos de alpha, e passa a ser o valor que o
design especificou.

Nove ficam como estão, por não terem correspondente: oito em `brand-soft`, que
não tem escada no Figma (só `brand`), e o `white/50` do Button, que é realce de
borda -- a escada é de preenchimento. O fundo do disabled do Contained também
fica: `#4f4f4f` está fora da paleta.
