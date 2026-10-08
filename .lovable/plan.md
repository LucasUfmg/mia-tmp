# Nova regra da meta na aba Projeções

## O que muda para o usuário
A meta de cada coluna da tabela passa a usar o histórico recente, em vez da média de toda a série:

| Coluna | Meta |
|---|---|
| Projeção fim do mês | Valor atingido no mês fechado anterior (mês inteiro) |
| Próximos 3 meses | Média mensal dos últimos 3 meses fechados x 3 |
| Próximos 6 meses | Média mensal dos últimos 6 meses fechados x 6 |

Sem histórico suficiente: usa a média dos meses fechados disponíveis (com dados do BI). Exemplos:
- Mês anterior sem dados do BI: a meta de fim do mês vira a média mensal dos meses fechados disponíveis.
- Só 2 meses fechados disponíveis: a meta de 3 meses é a média desses 2 meses x 3; a de 6 meses, a média x 6.
- Nenhum mês fechado: células mostram "Meta indisponível", sem cor.

Receita bruta da meta continua incluindo a Venda de Serviços lançada. Cores e legenda não mudam (verde melhor, vermelho pior; CMV e Despesas invertidos). A nota explicativa passa a descrever a regra de cada coluna e quais meses entraram (ex.: "Meta 3 meses = média de jul/2026 a set/2026 x 3"), indicando quando faltou histórico e foram usados menos meses.

## Detalhes técnicos
- `src/lib/ebitda.ts`: substituir `metaHistorica(historico, horizonteDias)` por `metaPorMeses(historico, meses)`. Pega os últimos `meses` itens (ordenados) do histórico de meses fechados com BI; se `meses` = 1 e o mês imediatamente anterior ao corrente existe no histórico, usa só ele; senão usa a média de todos os disponíveis (até `meses`, ou todos quando não há o mês anterior). Calcula rubrica a rubrica: média mensal x `meses` (mês inteiro, sem proporcionalização, BI + lançamentos + Venda de Serviços), recalcula totais com `calcularEbitda` (IRPJ/CSLL 34% etc.) e devolve o mesmo formato de `projetarDre`, mais a lista de meses usados para a nota.
- `src/components/redeflex/DreDashboard.tsx` (`Projecoes`): usar `horizontesProjecao[i].meses` para chamar `metaPorMeses` por coluna; ajustar o texto da nota por coluna e mostrar os meses usados. Sem novas consultas ao BI.
- A Mia não é alterada nesta etapa.
- Validação: `npx tsgo --noEmit` e conferência no preview das três metas (fim do mês = valores de setembro; 3 e 6 meses com médias dos meses disponíveis).
