# Comparativo on-time + índices (M/LT, TMC, TMV, TMP) por posto

## O que encontrei no backend anexado

O `rede-flex-back-end-main` **não calcula** os índices a partir da base: ele apenas **armazena e edita metas** (`gas_station_MLT_modal`, `TMC_modal`, `TMVOL_modal`, `TMP_modal`, além de `use_mlt/use_tmc/use_tmvol/use_tmp` no nível de usuário/rede e `region_station_*` no regional), configuradas manualmente no `VariableController`. Também guarda margens por combustível/grupo de produto em `ibm_info` (`ibm_margin_GC`, `ibm_margin_DIESEL_GROUP`, `ibm_margin_TOTAL_PRODUCT`, ...) e a relação IBM → nome fantasia na tabela `ibm_info` (Postgres, que não veio no zip).

Boa notícia: essa relação e todos os insumos de cálculo existem no MongoDB que já está conectado:
- `LBCBi.Lojas` → `ibm`, `nomeFantasia`, `razaoSocial`, `rede` (é daqui que sai o nome do posto).
- `GasMonitor.Abastecimentos` → `vol` (litros), `val` (R$), `cus` (custo/litro), `ppl` (preço/litro), `ven` (cupom), `sig` (combustível).
- `SalesMonitor.Vendas` → `items[]` com `tot`, `qd`, `pC` (custo) e `iTip` (`0` = produto).

## 1. Comparativo semanal on-time de verdade

Hoje as semanas anteriores são somadas em dia fechado (24h) e só o dia atual é parcial — a comparação fica injusta. Vou aplicar o **mesmo corte de horário** (hora:minuto de agora, fuso São Paulo) em **todos** os dias comparados: hoje 11:53 → o mesmo dia da semana anterior também acumula só até 11:53. Assim a seta de variação compara realizado contra realizado no mesmo ponto do dia.

Vale para galonagem e para produto. Na projeção mensal o dia corrente segue parcial e os anteriores completos.

## 2. Índices calculados da base

Calculados por seleção (REDE ou IBM), no mesmo recorte de período do painel:

| Índice | Cálculo |
|---|---|
| M/LT | (Σ `val` − Σ `cus`×`vol`) ÷ Σ `vol` — margem bruta por litro, em R$ |
| TMV | Σ `vol` ÷ nº de atendimentos de combustível — litros por atendimento |
| TMC | Σ `val` ÷ nº de atendimentos de combustível — R$ por atendimento |
| TMP | Σ `items.tot` (iTip=0) ÷ nº de cupons com produto — R$ por cupom |
| LB % combustível | (Σ `val` − Σ custo) ÷ Σ `val` |
| LB % produto | (Σ `tot` − Σ `pC`×`qd`) ÷ Σ `tot` |

Os cards "Rede Combustíveis" e "Rede Produtos" e os tooltips dos gráficos de pizza passam a usar esses valores reais em vez dos números da planilha.

## 3. Filtro por posto com nome

O Select do topo passa a mostrar "REDE (todos os postos)" e depois `NOME FANTASIA — IBM` (ex.: `POSTO AEROPORTO — 00000000003101`), ordenado por nome, vindo de `LBCBi.Lojas`.

## Detalhes técnicos

- `src/lib/mongo.server.ts`: adicionar a base `LBCBi` reaproveitando a mesma connection string / singleton.
- `src/lib/redeflex-mongo.server.ts`: trocar `limites()` por corte on-time por hora/minuto (parâmetro `cutoffMinutes`); novas agregações `getIndicadores(dates, ibm?)` (combustível: somas de vol/val/custo + contagem de atendimentos distintos por cupom; produto: somas de tot/custo + contagem de cupons distintos) e `listarLojas()`.
- `src/lib/redeflex.functions.ts`: novas server functions `getIndicators` e `getLojas`, mesmo padrão de import dinâmico dentro do handler.
- `src/lib/redeflex-dashboard.ts`: propagar o cutoff, incluir os índices no `DashboardData` e devolver `postos` como `{ ibm, nome }`.
- `NetworkFilter.tsx` recebe a lista com nome; `NetworkCard.tsx`, `DistributionCard.tsx` e `WeeklyOverview.tsx` passam a consumir os índices calculados; formatação mantida (LB em %, TMV em litros, TMP/TMC/M-LT em R$).
- Refetch de 60s e indicador "ao vivo" seguem como estão.