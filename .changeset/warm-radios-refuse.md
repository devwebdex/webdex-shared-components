---
"@devwebdex/tokens": minor
"@devwebdex/ui": minor
---

Importa as Variables do Figma como tokens DTCG e adiciona o Button.

**Tokens**: as 5 coleções do arquivo WEbdEX — Design System viram 7 arquivos DTCG
(40 cores, 8 espaçamentos, 7 raios, famílias, pesos, tamanhos e elevações). Os
valores provisórios da 0.1.0 saem, e com eles os tokens `color.primary`,
`color.on-primary`, `color.surface`, `color.on-surface`, `radius.md` e
`spacing.md`, que não existem mais. Os tamanhos de fonte (`text.sm`, `.base`,
`.lg`) são provisórios: foram lidos do componente, não de Variable.

**Button**: três eixos espelhando as component properties do Figma — `size`
(large, medium, small), `color` (brand, code) e `variant` (contained, outlined,
text) — com ícones como slots. Hovered, Pressed, Disabled e Focused não são
props: são pseudo-classes (`hover:`, `active:`, `disabled:`, `focus-visible:`).
