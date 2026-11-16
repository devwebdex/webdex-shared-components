---
"@devwebdex/ui": minor
---

Adiciona LineChart, AreaChart, BarChart e PieChart, sobre o ECharts.

As cores, a fonte, os espaçamentos e o raio vêm dos tokens, lidos do elemento e
relidos quando o tema muda. Tooltip com os tokens; legenda em botões que
mostram e escondem cada série pelo teclado; `loading` com o Skeleton e estado
vazio com `emptyMessage`. O gráfico recebe foco e as setas percorrem os valores,
com o tooltip acompanhando e uma região viva anunciando; uma tabela escondida
repete os dados para leitor de tela.

AreaChart e BarChart empilham com `stacked`; BarChart deita com
`orientation="horizontal"`; PieChart abre o meio com `donut` e mostra o total.
