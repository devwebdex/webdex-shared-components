# @devwebdex/tokens

Os valores em `src/tokens.json` são **provisórios**: servem só para o build funcionar até o time de design exportar as Variables do Figma.

Como gerar e nomear os tokens: [docs/ui/figma-para-componentes.md](../../docs/ui/figma-para-componentes.md).

Uso no app (Tailwind 4):

```css
@import "tailwindcss";
@import "@devwebdex/tokens/theme.css";
@source "../node_modules/@devwebdex/ui";
```
