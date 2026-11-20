# @devwebdex/tokens

Os valores vêm das Variables do arquivo WEbdEX — Design System. Os tamanhos de fonte (`text.*`) ainda são provisórios: foram lidos do componente, não de Variable.

Como importar e nomear os tokens: [docs/ui/figma-para-tokens.md](../../docs/ui/figma-para-tokens.md).

Uso no app (Tailwind 4):

```css
@import "tailwindcss";
@import "@devwebdex/tokens/theme.css";
@source "../node_modules/@devwebdex/ui";
```

## Modo claro (provisório)

O Figma tem só o modo escuro. O modo claro é proposta para o design validar: [`modes/light.json`](modes/light.json) traz as cores que mudam, e o build gera um bloco `[data-theme="light"]` no `theme.css`. Para ligar, ponha o atributo no `<html>` ou em qualquer contêiner:

```html
<html data-theme="light">
```

As escadas de estado (`-hover`, `-focus`...) e os fundos `-bg` saem da cor base clara sozinhos. Decisão e lacunas: D19 em [docs/gerador-de-projetos.md](../../docs/gerador-de-projetos.md).
