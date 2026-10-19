# DRE com vários meses comparando o mesmo período

## O que muda
- Quando o mês atual (ainda aberto) estiver entre os meses escolhidos, todos os meses da DRE passam a ser mostrados até o mesmo dia e horário de hoje. Exemplo: hoje é 19/10 às 18:27, então setembro mostra de 01/09 até 19/09 às 18:27.
- Isso vale para receita, custos e despesas. As despesas dos meses anteriores também são divididas pelos dias, como já acontece no mês atual.
- Se todos os meses escolhidos já estiverem fechados, cada coluna continua mostrando o mês inteiro.
- O título de cada coluna é o nome do mês (ex.: "Set/2026", "Out/2026"). A última coluna, "Total", soma os meses mostrados.
- Acima da tabela aparece um aviso: "Comparação no mesmo período: até dia 19, 18:27 de cada mês".
- Enquanto os valores cortados no mesmo período ainda não chegaram, a DRE mostra o aviso de carregamento.

## Detalhes técnicos
- `src/components/redeflex/DreDashboard.tsx`: em `colunasDre`, quando `meses.length > 1` e `meses` inclui `mesCorrenteSp`, montar cada coluna com `consolidarEbitda(calculosMesmoPeriodo, selecao, [m])`, e o total com os mesmos dados. Sem `calculosMesmoPeriodo`, mostrar carregando no lugar da tabela. Cabeçalho com `rotuloMes(m)` e "Total". Aviso usando `rotuloCorte()`.
- A tela já carrega o mesmo período dos meses escolhidos, porque eles têm prioridade na fila. Não há mudança no servidor nem na Mia.
