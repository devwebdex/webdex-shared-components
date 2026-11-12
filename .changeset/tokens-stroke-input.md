---
"@devwebdex/tokens": minor
---

Acrescenta quatro cores que existem nas Variables do Figma e não tinham token: `surface-input` (`Surface Input`, 000000 a 28%) e a família de traço `line-enabled` (22%), `line-hovered` (32%) e `line-pressed` (60%).

São **aditivos**: nenhum componente passa a consumi-los, então nada muda visualmente. Entram para que o valor deixe de ser arbitrário quando alguém for usá-lo — o `hover:border-white/22` do InputField, por exemplo, é exatamente o `line-enabled`, e hoje está escrito à mão com um comentário dizendo "sem token".

O `line-default` ganha `$description` com um aviso: o valor dele (10%) é o da Variable **`Line Disabled`** do Figma, não de um "default". O Figma tem quatro estados de traço; nós tínhamos um, com o nome trocado. Renomear é quebra de API e precisa de decisão do design, então fica registrado em vez de corrigido no escuro.
