---
"@devwebdex/tokens": minor
---

Acrescenta quatro cores que existem nas Variables do Figma e não tinham token: `surface-input` (`Surface Input`, 000000 a 28%) e a família de traço `line-enabled` (22%), `line-hovered` (32%) e `line-pressed` (60%).

São **aditivos**. Só o `line-enabled` ganha consumidor: a borda de hover do InputField, que era o mesmo branco a 22% escrito à mão, então nada muda visualmente. Os outros três esperam quem os use.

O `line-default` ganha `$description` com um aviso: o valor dele (10%) é o da Variable **`Line Disabled`** do Figma, não de um "default". O Figma tem quatro estados de traço; nós tínhamos um, com o nome trocado. Renomear é quebra de API e precisa de decisão do design, então fica registrado em vez de corrigido no escuro.
