# Mia: meta = mesmo período dos anos anteriores

## Regra nova da meta
Para qualquer projeção pedida (dia, semana, mês, trimestre, semestre, ano ou período livre), a meta é a **média do mesmo período do calendário nos anos anteriores** que existirem na base.

Exemplos:
- "Faturamento de dezembro/2026" → meta = média de dez/2025, dez/2024, ... (os que tiverem dados).
- "Próximos 10 dias" (14/10 a 23/10/2026) → meta = média de 14/10–23/10 de 2025, 2024, ...
- "1º trimestre de 2027" → meta = média de jan–mar de 2026, 2025, ...
- "Amanhã" (14/10/2026) → meta = média de 14/10 dos anos anteriores.
- "Ano de 2027" → meta = média dos anos fechados anteriores.

**Se não houver nenhum ano anterior com dados para esse período:** usa o mês anterior ao período vigente (mês fechado mais recente), proporcional à duração do período pedido (dias do período ÷ dias daquele mês).

## O que não muda
- A projeção continua igual: média do realizado até agora × duração do período.
- Índices (M/LT, LB, TMV, TMC, TMP, EBITDA/litro) seguem derivados dos volumes.
- Vale para os indicadores contábeis e da Visão Geral da Mia.
- A resposta passa a citar de onde veio a meta (ex.: "meta = média de dez/2024 e dez/2025" ou "sem histórico: mês anterior proporcional").
- As telas do painel não mudam (só a Mia).

## Detalhes técnicos
- Nova função central de "períodos equivalentes" (mesmas datas início/fim deslocadas −1, −2, ... anos), limitada a anos com dados, em `src/lib/ebitda.ts` (contábil) e `src/lib/projecao-visao.ts` (Visão Geral).
- `projecoes_contabeis`: aceita também `de`/`ate` para períodos futuros que não começam hoje (ex.: dezembro); busca meses equivalentes dos anos anteriores via `lerDetalheEbitda` (fila curta, mesmo padrão atual); períodos parciais de mês usam proporcional aos dias.
- `projecao_mes` (Visão Geral): meta busca o mesmo intervalo de datas/horas dos anos anteriores no BI; sem dados, cai no mês anterior fechado proporcional.
- Prompt da Mia: explicar a nova regra e pedir que cite a origem da meta.
