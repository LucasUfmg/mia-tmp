# Mia: meta sempre no período imediatamente anterior

## Regra da meta (nova)

| Período pedido | Meta |
|---|---|
| Dia (ou algumas horas) | Mesmo dia da semana anterior (−7 dias) |
| Semana (2 a 7 dias) | Semana anterior (−7 dias) |
| Mês (8 a 31 dias) | Mês anterior (mesmas datas −1 mês) |
| Trimestre, semestre ou 32 a 364 dias | Período imediatamente anterior, de mesma duração |
| Ano (365 dias ou mais) | Ano anterior (−1 ano) |

Exemplos:
- "Projeção de amanhã (quarta 14/10)" → quarta 07/10.
- "Dezembro/2026" → novembro/2026.
- "Próximos 10 dias" → os mesmos 10 dias do mês anterior (proporcional ao mês).
- "Próximo trimestre (jan–mar/2027)" → out–dez/2026.
- "Ano de 2027" → 2026.

## O que não muda
- Projeção = média do realizado até agora × duração do período.
- Períodos fracionados (horas, parte de semana/mês/ano) continuam proporcionais.
- Sem dados no período de comparação: mês anterior fechado, proporcional à duração.
- A resposta da Mia cita a origem da meta (`origemMeta`). Telas do painel não mudam.
- Vale para os indicadores contábeis e os da Visão Geral.

## Detalhes técnicos
- `src/lib/ebitda.ts`: novo helper `periodoDeComparacao(inicio, fim)` que classifica pela duração e devolve o intervalo deslocado + rótulo da regra; novo `deslocarMeses(data, n)` (ajusta fim de mês, ex. 31/03 → 28/02). Para períodos de meses inteiros alinhados (trimestre = 3 meses), desloca por N meses; senão, pela duração em dias.
- `src/lib/mia/contabil.server.ts` (`metaDoPeriodo`): troca o bloco `semanal ? −7 dias : deslocarAnos` pelo helper; rótulo de origem acompanha a regra usada.
- `src/lib/mia/tools.server.ts` (`projecao_mes`): mesma troca no `desloc`; remover a lógica antiga "semanal vs ano"; atualizar descrições das ferramentas.
- `src/lib/mia/prompt.ts`: reescrever a linha "META" com a tabela acima.
- Atualizar o texto `base` retornado por `lerProjecoes`.
