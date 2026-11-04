---
"@devwebdex/tokens": minor
"@devwebdex/ui": minor
---

Novo componente `Card`: uma superfície que agrupa mídia (`media`), header (`title`), conteúdo (`children`) e ações (`actions`), nessa ordem. Estreia os tokens `color.surface-card` e `color.surface-elevated`, que existiam nas Variables do Figma sem consumidor, e reusa a `shadow.elevation-2` do Button em repouso.

Os três estados seguem a regra de `docs/ui/criar-componente.md`: `hover` é modificador de classe e `selected` é prop. O hover só aparece com `interactive`, porque um card que levanta ao passar o mouse e não responde ao clique promete uma afordância que não existe.

O hover **não** usa a `shadow.elevation-4` do Button. As elevações `paper/*` são pretas, e preto a 20% sobre o `background` `#0c0611` escurece 2 pontos por canal: não se vê. No Button o hover aparece porque ele também troca de cor; o card só tinha a sombra. Por isso os tokens ganham a **`shadow.glow-brand`** — a mesma sombra na cor da marca —, que o card usa no hover. É token provisório, com a razão na `$description`: não veio do Figma, e se o design quiser outro sinal de hover para superfície, é ali que muda.

O brilho é sombra, então é aditivo: funciona igual com `selected`, que já usa a borda e a superfície.

O slot **`media`** é a mídia sangrada do topo: o Card desfaz o próprio `p-4` com `-mt-4 -mx-4`, arredonda o topo no `radius.3` e recorta o que passar. Quem monta a tela passa só o conteúdo — uma `<img>`, uma faixa com o símbolo do ativo — sem margem negativa nem largura calculada. Uma `<img>` direta ganha `w-full`, porque elemento substituído não estica no flex.

Sem o slot, a mídia teria de entrar em `children`, que vem depois de `title`: a margem negativa não teria o `p-4` para cancelar, comeria o `gap-3` e espremeria a imagem contra o título. E a conta depende do padding e do raio do próprio Card, então, feita de fora, toda tela a repete e todas erram juntas quando o Card mudar.

Atualize o `@devwebdex/tokens` junto com o `@devwebdex/ui`: com tokens antigos o `Card` fica sem hover visível.
