# Abas Diária e Mensal na Visão Geral

Sim, é possível — e a base de dados já suporta, porque todas as funções de servidor
(`getIndicators`, `getCategorias`, séries de galonagem/produto) recebem uma lista de
datas e um horário de corte. Basta trocar o período consultado.

## O que muda na tela

Duas abas no topo, ao lado do filtro de posto:

- **Diária** — tudo referente a hoje, com corte on-time (acumulado até o horário atual):
  - KPIs (volume, lucro bruto, M/LT, TMC/TMV) calculados só do dia
  - Cards Rede Combustíveis / Rede Produtos com faturamento e índices do dia
  - Pizzas de distribuição de combustíveis e produtos do dia
  - Comparativo semanal (mesmo dia da semana, mesmo horário) — como já é hoje
  - No lugar da projeção mensal: projeção de fechamento do dia (extrapolação do
    acumulado até agora para as 24h)
- **Mensal** — tudo referente ao mês corrente (dia 1 até hoje, dias fechados):
  - Mesmos KPIs, cards e pizzas, agora acumulados no mês
  - Projeção mensal de combustível e produto (como já existe)
  - Comparativo semanal permanece igual (é, por natureza, diário/on-time)

O filtro REDE / posto e o status de atualização automática continuam valendo para
as duas abas.

## Detalhes técnicos

- `loadDashboardData(selecao, periodo)` passa a receber `"diario" | "mensal"`:
  - `diario`: `dates = [hoje]` + `cutoffMinutes` do horário de São Paulo em
    indicadores e categorias
  - `mensal`: `dates = monthToDateDates(hoje)` sem corte (comportamento atual)
  - o bloco do comparativo semanal segue sendo carregado igual nas duas abas
- Projeção: reaproveita o acumulado já buscado; no modo diário usa
  `acumulado / minutosDecorridos * 1440`, exposto no mesmo formato de
  `projecao` para o `WeeklyOverview` (rótulos passam a "hoje" no modo diário).
- `queryKey` inclui o período, então cada aba tem cache próprio e o
  `refetchInterval` de 60s continua funcionando.
- Novo componente `PeriodTabs.tsx` (controle segmentado simples com tokens do
  design system) em `src/components/redeflex/`; estado de período fica em
  `src/routes/index.tsx`.
- Nenhuma alteração no MongoDB nem nas agregações existentes.
