---
"@devwebdex/ui": minor
---

Adiciona o InputField e o TextField.

**InputField**: o `<input>` sozinho, com um eixo `status` (default, error,
success). `error` liga o `aria-invalid`. Hover, focus e disabled não são props:
são pseudo-classes (`hover:`, `focus-visible:`, `disabled:`).

**TextField**: rótulo, InputField, helper text e contador de caracteres
(`counter`, que com `maxLength` exibe `atual/máximo`). O helper text e o
contador ficam ligados ao input por `aria-describedby`. `className` vai para o
contêiner; para estilizar o input, use `inputClassName`.
