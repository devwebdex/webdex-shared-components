---
"@devwebdex/tokens": minor
---

Adiciona `opacity.overlay` e `--animate-fade-out`.

`opacity.overlay` (72%, provisório: não há Variable de opacidade no Figma) vira
`--opacity-overlay`, que o Tailwind 4 usa como modificador de cor
(`bg-background/overlay`). `motion.css` ganha `--animate-fade-out`, o
fechamento do fundo escurecido do Modal.
