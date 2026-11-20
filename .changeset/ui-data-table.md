---
"@devwebdex/ui": minor
---

Adiciona a `DataTable`.

- Ações por linha (`rowActions`): botão "…" que abre o `Menu` com as ações daquela linha.
- Botão na barra que muda o alinhamento do texto das linhas (esquerda, centro, direita); coluna com `align` próprio não muda.
- Paginação integrada no rodapé: resumo ("1–10 de 45"), linhas por página e a `Pagination`.
- Hover destaca a linha (fundo e barra brand à esquerda); linha selecionada em tom brand.
- Ordenação por coluna (`sortable`, `aria-sort`), seleção com checkbox e "selecionar a página", menu de colunas visíveis, densidade `comfortable`/`compact`, listrada, cabeçalho fixo com `maxHeight`, estados carregando (`Skeleton`, `aria-busy`) e vazio (`emptyState`), e `toolbarStart` para busca.
- Busca global (`searchable`), filtro por coluna (`filterOptions`), ações em lote (`bulkActions`), linha expansível (`renderExpanded`), exportar CSV (`exportable`, `toCsv`, `downloadCsv`), modo servidor (`manual`, `rowCount`), primeira coluna fixa (`stickyFirstColumn`), colunas redimensionáveis (`resizableColumns`), botão de copiar (`DataTableCopyButton`) e cards em contêiner estreito (`mobileLayout="cards"`).
- `excelExportable`: botão "Exportar Excel" que gera um .xlsx com a marca WEbdEX (logo, cabeçalho magenta congelado com filtro, linhas alternadas, números e datas formatados). `toXlsx` e `downloadBlob` também são exportados. O pacote passa a depender do ExcelJS, carregado só no clique.
- Toda prop de estado tem versão controlada e não controlada; a lógica está exportada como `useDataTable`.
