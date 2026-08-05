# Comparativo mensal (mesmo período) + renomes nos indicadores

## 1. Aba Mensal: comparativo entre meses no mesmo período

Hoje a aba Mensal reaproveita a tabela "Comparativo semanal — mesmo dia". Na aba Mensal
ela passa a ser **"Comparativo mensal — mesmo período"**:

- Período de referência: dia 1 até o dia atual (ex.: 01–05/08), com o dia atual cortado
  no horário de agora (on-time) e os dias anteriores completos.
- Para os 3 meses anteriores, busca o mesmo intervalo de dias (01–05/07, 01–05/06,
  01–05/05), com o mesmo corte on-time aplicado somente ao último dia do intervalo.
  Quando o mês anterior é mais curto que o dia atual, o intervalo para no último dia do mês.
- Linhas: `08/2026`, `07/2026`, `06/2026`, `05/2026` com galonagem acumulada (L),
  receita de produto acumulada (R$) e a variação percentual em relação ao mês anterior
  da lista (mesmas setas de subida/descida já usadas).
- A aba Diária continua exatamente como está (comparativo semanal, mesmo dia da semana).
- A projeção mensal e os demais blocos não mudam.

## 2. Renomes na terceira seção (KPIs) e no card de produtos

- "Volume movimentado" → **Volume vendido**
- "Lucro bruto combustível" → **Resultado Bruto**
- Card REDE PRODUTOS: métrica "Lucro bruto" → **Resultado Bruto**

Somente rótulos; valores e cálculos permanecem os mesmos.

## Detalhes técnicos

- `src/lib/redeflex-transform.ts`: novo helper `monthRanges(referencia, count)` que devolve,
  por mês, `{ label, diasCompletos: string[], diaParcial: string }` para o intervalo
  dia 1 → mesmo dia do mês (limitado ao último dia do mês).
- `src/lib/redeflex-dashboard.ts`: no modo `mensal`, em vez do comparativo semanal, monta o
  comparativo mensal com `getFuelSeries` / `getProductSeries` — uma chamada com todas as
  datas completas (sem corte) e outra com os dias parciais (com `cutoffMinutes`) —, soma por
  mês e calcula `variacao` entre meses consecutivos. Reaproveita `groupByDate` e o filtro por
  posto. O tipo `LinhaComparativo` continua o mesmo (campo `dia` recebe `MM/AAAA`).
- `src/components/redeflex/WeeklyOverview.tsx`: título, subtítulo, cabeçalho da coluna
  ("Dia" → "Mês") e a linha de resumo do rodapé passam a depender de `periodo`.
- `src/routes/index.tsx`: apenas os textos dos KPIs e da métrica do card de produtos.
- Nenhuma alteração de schema, agregações novas no MongoDB ou mudança nos secrets.
