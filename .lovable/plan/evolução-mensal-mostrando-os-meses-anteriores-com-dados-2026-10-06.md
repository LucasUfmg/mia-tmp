# Evolução mensal mostrando os meses anteriores com dados

## O que muda
- Os gráficos "Evolução da receita" e "Resultado final mensal" passam a mostrar todos os meses até o mês escolhido que tenham dados para o cálculo, ou seja, despesas salvas com Receita e CMV do BI.
- Isso vale nas visões "Mês" e "Acumulado do ano". Hoje, na visão "Mês", os gráficos mostram só o mês escolhido.
- Meses sem dados ficam de fora, para o gráfico não mostrar barras zeradas.
- Os 6 números principais, a DRE Gerencial e o Comparativo continuam usando o período escolhido, como hoje.

## Detalhes técnicos
- `DreDashboard.tsx`: a série dos dois gráficos deixa de usar `meses`. Ela passa a usar a lista ordenada dos meses únicos de `calculos` (ano atual e ano anterior, já carregados) que sejam menores ou iguais a `mesAtual` e tenham registro para a seleção, ou para a rede quando nada estiver selecionado.
- Os dois gráficos ficam limitados aos últimos 12 meses, para continuarem legíveis.
- Se receita bruta e resultado final derem zero ao mesmo tempo, o mês é descartado porque ainda não tem dados do BI.
