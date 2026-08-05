# Acumulado do mês direto no banco + limpeza da tela

## O que muda

1. **Galonagem e produto do mês passam a ser um único acumulado no banco.** Hoje o dashboard pede dia a dia (uma faixa por data do mês) e soma no navegador. Vou trocar por novas funções que consultam uma única faixa contínua — do dia 1 do mês às 00:00 até o momento atual — e devolvem o total já somado pelo banco. Resultado: menos consultas, mais rápido, e o valor do mês é exatamente o acumulado do primeiro dia até agora.
2. **Sidebar:** fica somente "Visão Geral". Removo os blocos "Análises" e "Gestão".
3. **Insights (Rede):** o cartão de insights no fim da página sai (junto com o botão "Ver relatório completo" que vive nele).

## Detalhes técnicos

**Camada Mongo (`src/lib/redeflex-mongo.server.ts`)**
- Novo helper `limitesMesAteAgora(referencia)`: `$gte` no primeiro dia do mês 00:00 e `$lt` no instante atual, ambos com o offset de -3h de São Paulo já aplicado (mesma convenção de `limites()`).
- `calcFuelMonthToDate(referencia, ibm?)`: agrega `GasMonitor.Abastecimentos` (`ori in ["0","1"]`) nessa faixa e retorna `{ litros, receita, lucroBruto, atendimentos }`.
- `calcProductMonthToDate(referencia, ibm?)`: agrega `SalesMonitor.Vendas` com `$unwind` em items e `iTip = "0"` na mesma faixa e retorna `{ receita, lucroBruto, cupons }`.
- Os dois aceitam `ibm` opcional para o filtro por posto.

**Server functions (`src/lib/redeflex.functions.ts`)**
- Nova `getMonthToDate` (POST, validada por Zod: `referencia` no formato `YYYY-MM-DD`, `ibm` opcional) chamando as duas agregações em paralelo.

**Coordenação (`src/lib/redeflex-dashboard.ts`)**
- No modo mensal, a projeção e os totais do mês passam a usar `getMonthToDate` em vez de somar `getFuelSeries`/`getProductSeries` por dia.
- As séries por dia continuam sendo usadas apenas para o comparativo semanal on-time (que precisa de valores por data) e para a lista de postos.
- `projectMonth` continua projetando o fechamento do mês a partir desse acumulado.

**UI**
- `src/components/redeflex/Sidebar.tsx`: remover as listas `analises` e `gestao`, os títulos de seção, o divisor e os ícones não usados.
- `src/routes/index.tsx`: remover a `<section>` de Insights e os imports que ficarem sem uso.

Abas Diária e Mensal, filtro de posto, KPIs, cards da rede e as pizzas continuam funcionando como estão.
