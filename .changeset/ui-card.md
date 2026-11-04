---
"@devwebdex/tokens": minor
"@devwebdex/ui": minor
---

Novo componente `Card`: uma superfície que agrupa header (`title`), conteúdo (`children`) e ações (`actions`). Estreia os tokens `color.surface-card` e `color.surface-elevated`, que existiam nas Variables do Figma sem consumidor, e reusa a `shadow.elevation-2` do Button em repouso.

Os três estados seguem a regra de `docs/ui/criar-componente.md`: `hover` é modificador de classe e `selected` é prop. O hover só aparece com `interactive`, porque um card que levanta ao passar o mouse e não responde ao clique promete uma afordância que não existe.

O hover **não** usa a `shadow.elevation-4` do Button. As elevações `paper/*` são pretas, e preto a 20% sobre o `background` `#0c0611` escurece 2 pontos por canal: não se vê. No Button o hover aparece porque ele também troca de cor; o card só tinha a sombra. Por isso os tokens ganham a **`shadow.glow-brand`** — a mesma sombra na cor da marca —, que o card usa no hover. É token provisório, com a razão na `$description`: não veio do Figma, e se o design quiser outro sinal de hover para superfície, é ali que muda.

O brilho é sombra, então é aditivo: funciona igual com `selected`, que já usa a borda e a superfície.

Atualize o `@devwebdex/tokens` junto com o `@devwebdex/ui`: com tokens antigos o `Card` fica sem hover visível.
