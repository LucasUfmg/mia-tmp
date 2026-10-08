# Projeção e meta na Visão Geral (Diária e Mensal)

## Regras

**Aba Diária**
- Projeção fim do dia = valor até agora + (valor até agora ÷ horas decorridas) × horas restantes do dia (hora atual com minutos, ex.: 19:17 = 19,28 h).
- Meta = valor fechado (dia inteiro, 00:00–23:59) do mesmo dia da semana anterior.

**Aba Mensal**
- Projeção fim do mês = valor até agora + (valor até agora ÷ dias decorridos) × dias restantes do mês (dias contam a hora atual).
- Meta = valor fechado do mês anterior inteiro.

**Indicadores projetados:** Galonagem (L), Produto (R$), M/LT, LB, TMV, TMC, TMP e Cupons.
- Volumes (litros, faturamento, lucro bruto, atendimentos, cupons) seguem a fórmula acima.
- Índices (M/LT, LB, TMV, TMC, TMP) são recalculados a partir dos volumes projetados (ex.: M/LT = lucro bruto projetado ÷ litros projetados). Como a projeção é linear, o índice projetado fica igual ao atual; a comparação com a meta mostra se o ritmo está melhor ou pior que o período de referência.
- Cores: verde acima da meta, vermelho abaixo.

## O que muda na tela
- O cartão "Projeção do dia / Projeção mensal" vira uma tabela simples: Indicador | Realizado até agora | Projeção | Meta | Diferença %.
- Nota curta abaixo com a fórmula e a data de referência da meta (ex.: "Meta: quinta 01/10 fechada").
- Resto da Visão Geral sem alteração.

## Mia
- Nova ferramenta "projeção da visão geral" (diária ou mensal, posto opcional) com as mesmas regras e mesma função da tela; devolve realizado, projeção, meta e diferença % de cada indicador.
- A ferramenta antiga `projecao_mes` passa a usar essa lógica; prompt atualizado.

## Detalhes técnicos
- Novo módulo compartilhado `src/lib/projecao-visao.ts`: `projetarVolumes(atual, fator)`, `indicesDe(volumes)` e `fatorDia(minutos)` / `fatorMes(mes, agora)`; usado pelo painel e pela Mia (sem divergência).
- `redeflex-dashboard.ts`: buscar meta com `getIndicators` — diário: data −7 dias com corte 23:59; mensal: `desde` dia 1 do mês anterior até o último dia, corte 23:59. `DashboardData.projecao` ganha `itens[]` com realizado/projeção/meta/variação.
- `WeeklyOverview.tsx`: renderizar a tabela.
- `src/lib/mia/tools.server.ts` + `prompt.ts`: ferramenta nova reutilizando o módulo.
- Risco: a consulta do mês anterior inteiro é mais pesada; usar cache longo (mês fechado não muda) para não deixar a aba lenta.
