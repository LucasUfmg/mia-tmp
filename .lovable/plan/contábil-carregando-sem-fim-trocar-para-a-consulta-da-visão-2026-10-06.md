# Contábil carregando sem fim — trocar para a consulta da Visão Geral

## O que foi encontrado

- O registro do servidor mostra as consultas do Contábil sendo **canceladas** ("operation was aborted"). Por isso a tela fica em "carregando…" e os números ficam zerados.
- Hoje o Contábil pede, de uma só vez, o **ano inteiro** de abastecimentos e vendas da Rede, mês a mês, e faz isso **duas vezes em paralelo** (mês cheio e "mesmo período"). Também pede meses futuros (novembro, dezembro) e o ano anterior. A consulta passa do tempo limite e cai.
- A Visão Geral usa outro formato: **um mês por vez**, num intervalo contínuo de datas (dia 1 até agora). Esse formato responde rápido e traz os valores certos.

## O que muda

1. **Cards e DRE usam a consulta da Visão Geral**: para o mês escolhido, uma consulta curta por posto (ou Rede), do dia 1 até agora. O mês anterior, para a comparação dos cards, usa a mesma consulta com corte no mesmo dia e hora.
2. **Só os meses necessários**: nada de meses futuros. No modo "Acumulado do ano", busca de janeiro até o mês atual, um mês por vez.
3. **Gráficos carregam à parte**: "Evolução da receita" e "Resultado final mensal" buscam os meses um a um, sem travar os cards. Cada mês aparece assim que chega.
4. **Guardar meses fechados**: meses já encerrados não mudam, então ficam guardados por mais tempo e abrem na hora nas próximas vezes. O mês atual atualiza a cada poucos minutos.
5. **Erros visíveis**: se um mês falhar, só ele mostra "Tentar novamente"; os demais aparecem normalmente.
6. Conferir na tela: a Receita bruta da Rede em outubro deve bater com o faturamento acumulado do mês da Visão Geral (combustível + mercadorias), e os cards devem carregar em poucos segundos.

As fórmulas, as despesas proporcionais aos dias e o formulário de lançamento não mudam.

## Detalhes técnicos

- `src/lib/receita-custo.server.ts`: `receitaCustoDoBi` (já baseado em `getIndicadores` com `desde` + intervalo contínuo, igual à Visão Geral) passa a ser a fonte do Contábil. Cache por `ibm|mes|corte`: TTL longo para meses fechados, curto para o mês corrente. `receitaCustoPorMes`/`getIndicadoresPorMes` (agrupamento anual com `$expr` em `$dayOfMonth`) deixa de ser usado pelo painel.
- `src/lib/redeflex.functions.ts`: nova `receitaCustoMes({ ibm, mes, mesmoPeriodo? })` — uma chamada por posto/mês, resposta pequena. `listarReceitaCusto` fica só para a Mia ou é removido se não houver outro uso.
- `src/routes/contabil.tsx`: trocar a query única de pares por `useQueries`, uma por par `ibm|mes`, filtrando `mes <= mês corrente`; ano anterior só para dezembro quando o mês escolhido for janeiro. Cards/DRE dependem apenas das queries do período selecionado (+ mês anterior); gráficos usam as demais sem bloquear. Estado de carregamento/erro por mês repassado ao `DreDashboard`.
- Mesmo período: `receitaCustoDoBi` com `corte` (dia/minutos) — já faz `ate = ano-mes-dia` + `cutoffMinutes` em intervalo contínuo, sem `$expr`.
- Validar com `tsgo`, conferir no log do servidor que não há mais cancelamentos e conferir os valores no preview com Playwright.
