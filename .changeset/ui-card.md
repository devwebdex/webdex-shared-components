---
"@devwebdex/ui": minor
---

Novo componente `Card`: uma superfície que agrupa header (`title`), conteúdo (`children`) e ações (`actions`). Estreia os tokens `color.surface-card` e `color.surface-elevated`, que existiam nas Variables do Figma sem consumidor, e reusa as elevações do Button (`shadow.elevation-2` em repouso, `-4` no hover).

Os três estados seguem a regra de `docs/ui/criar-componente.md`: `hover` é modificador de classe e `selected` é prop. O hover só aparece com `interactive`, porque um card que levanta ao passar o mouse e não responde ao clique promete uma afordância que não existe.
