# RedeFlex: apenas visão diária (mensal comentada)

Objetivo: eliminar as consultas mensais — que são as mais pesadas e derrubam o carregamento em produção — e entregar o dashboard funcionando só com dados do dia, preservando o código mensal comentado para retomar depois.

## O que muda na tela

- A aba "Mensal" sai do topo; fica apenas a visão diária (sem seletor de período visível).
- Todos os cartões, KPIs, comparativo semanal (mesmo dia da semana, on-time) e gráficos de pizza passam a refletir só o dia atual até o horário atual.
- "Projeção do dia" continua (extrapolação 24h). A "Projeção mensal" sai junto com a visão mensal.
- Filtro Rede/posto, atualização automática, botão Atualizar e cache continuam funcionando.

## O que é comentado (não apagado)

- `src/lib/redeflex-dashboard.ts`: bloco de meses (`monthRanges`, `mesesCompletos`, `mesesParciais`), as quatro chamadas de séries mensais, o cálculo de `comparativoMensal`, o uso de `getMonthToDate` e o ramo mensal da projeção. `periodo` passa a ter default `"diario"`.
- `src/lib/redeflex.functions.ts`: `getMonthToDate` comentado (e o import correspondente).
- `src/lib/redeflex-mongo.server.ts`: `calcFuelMonthToDate` / `calcProductMonthToDate` comentados.
- `src/routes/index.tsx`: `PeriodTabs` e o estado `periodo` comentados, com `diario` fixo em `true`; textos e chave de query ajustados.
- `src/components/redeflex/PeriodTabs.tsx`: arquivo mantido, sem uso.
- `src/components/redeflex/WeeklyOverview.tsx`: ramo mensal de títulos mantido comentado, default diário.

Cada bloco recebe um marcador `// [MENSAL DESATIVADO]` para localizar e reativar rapidamente.

## Validação

Build/typecheck limpos, e teste do build de produção simulado abrindo o dashboard: confirmar que os seis blocos de dados retornam números reais (sem "falha ao carregar"), medindo o tempo de resposta das consultas diárias.
