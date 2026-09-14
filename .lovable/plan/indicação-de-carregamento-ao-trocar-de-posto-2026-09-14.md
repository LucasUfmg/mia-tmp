# Indicação de carregamento ao trocar de posto

Hoje, ao trocar o posto (ou o mês) dentro de "Calcular EBITDA", só os campos de receita e custo mostram um textinho "carregando…" — o resto da tela fica parecendo pronta com valores antigos. Em "Lançar dados contábeis" não há nenhum aviso enquanto os dados do posto ainda não chegaram.

## Como vai ficar

Nos dois formulários:

- Ao escolher outro posto ou outro mês, a área dos campos entra em estado de carregamento: os campos ficam esmaecidos e sem interação, com um indicador giratório e o texto "Carregando dados do posto…".
- Os seletores de posto e mês continuam ativos durante o carregamento, para o usuário poder trocar de novo.
- Assim que os dados chegam, os campos voltam ao normal já preenchidos (painel, planilha ou valores salvos).
- Os botões de salvar ficam desabilitados enquanto carrega, para não gravar valores incompletos.
- Em "Calcular EBITDA", os totais (Receita líquida, Resultado bruto, EBITDA, EBIT) também aparecem em estado de carregamento em vez de mostrar números intermediários.

## Detalhes técnicos

- `EbitdaDialog.tsx`: derivar `carregando` de `isFetching` da query `["contabil","ebitda-bi", ibm, mes]` (não só `isPending`, para cobrir a troca de posto com `keepPreviousData`). Envolver o bloco de linhas em um contêiner com `opacity`/`pointer-events-none` e sobrepor um `Loader2` animado com o texto; desabilitar "Salvar cálculo" e "Usar no lançamento contábil" enquanto `carregando`.
- `LancamentoDialog.tsx`: receber dos pais os estados de carregamento das queries de `lancamentos` e `calculos` (novas props opcionais `carregando?: boolean`) e aplicar o mesmo tratamento visual + botão desabilitado. Em `contabil.tsx`, passar `isFetching` das duas queries (`listarLancamentos` e `listarEbitda`) combinado por `||`.
- Nenhuma mudança em cálculo, banco, server functions ou no preenchimento pela BASE DRE.
