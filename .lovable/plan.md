# Mia: meta simplificada por tipo de período

## Regra da meta
A meta é sempre o período equivalente imediatamente anterior, conforme o tamanho do período pedido:

| Período pedido | Meta |
|---|---|
| Dia (ou horas dentro do dia) | Mesmo dia da semana anterior (−7 dias) |
| Semana (até 7 dias) | Semana anterior (mesmas datas −7 dias) |
| Mês (8 dias até 1 mês) | Mesmo mês do ano anterior |
| Trimestre, semestre, ano (acima de 1 mês) | Mesmo período do ano anterior |

Exemplos:
- "Projeção de amanhã (quarta 14/10)" → meta = quarta 07/10.
- "Próximas 3 horas" → meta = as mesmas 3 horas do mesmo dia da semana anterior (proporcional: 3/24 do dia).
- "Próximos 5 dias" → meta = os mesmos 5 dias da semana anterior.
- "Dezembro/2026" → meta = dezembro/2025.
- "Próximos 10 dias" → meta = os mesmos 10 dias de 2025 (proporcional ao mês).
- "Ano de 2027" → meta = 2026.

## Proporcionalidade
Períodos fracionados (algumas horas, parte de uma semana, parte de um mês ou de um ano) usam a fração correspondente do período de comparação.

## Sem dados no período de comparação
Usa o mês anterior fechado, proporcional à duração do período (mesma regra de reserva de hoje).

## O que não muda
- A projeção continua: média do realizado até agora × duração do período.
- Vale para os indicadores contábeis e da Visão Geral da Mia; a resposta cita a origem da meta.
- As telas do painel não mudam.

## Detalhes técnicos
- Troca a média de até 3 anos por um único deslocamento: período de até 7 dias → −7 dias; acima → −1 ano (`deslocarAnos(…, 1)`).
- Contábil (dados mensais): para período de até 7 dias, a meta usa o mês que contém as datas deslocadas, proporcional aos dias (fração do mês); acima de 7 dias, os meses do ano anterior com as frações de `mesesDoIntervalo`.
- Visão Geral: busca no BI exatamente o intervalo deslocado; horas dentro do dia usam fração horas/24.
- Atualizar descrições das ferramentas e o prompt da Mia.
