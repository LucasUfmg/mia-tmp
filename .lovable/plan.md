# Projeções e metas simplificadas

## Regras (valem para todos os indicadores: Receita bruta, CMV, Result. Operacional Bruto, Despesas totais, EBITDA, Resultado final e EBITDA por litro)

**Meta**
- Fim do mês: valor do mês anterior (mês fechado).
- Próximos 3 meses: mês anterior × 3.
- Próximos 6 meses: mês anterior × 6.
- Se o mês anterior não tiver dados do BI, a célula mostra "Meta indisponível" (sem médias de outros meses).

**Projeção**
- Fim do mês (total do mês): Realizado até hoje + (Realizado até hoje ÷ dias decorridos) × dias restantes do mês.
- Próximos 3 meses: Projeção fim do mês × 3.
- Próximos 6 meses: Projeção fim do mês × 6.
- Cada indicador é projetado direto pelo seu realizado; sai a projeção do custo pela margem da meta e o uso do horário do BI.
- EBITDA por litro: EBITDA projetado ÷ litros projetados (mesma regra linear); meta = EBITDA do mês anterior ÷ litros do mês anterior.

Cores continuam: verde melhor que a meta, vermelho pior (CMV e Despesas invertidos).

## O que muda na tela e na Mia
- Aba Projeções: mesma tabela, com os novos números e uma nota curta com as fórmulas acima.
- Mia: responde projeção, meta e diferença % com exatamente as mesmas regras; busca só o mês anterior no BI (mais rápido).

## Detalhes técnicos
- `src/lib/ebitda.ts`: substituir `projetarDre`/`metaPorMeses` por funções simples: `projecaoLinear(realizado, mes, agora)` (fator = dias do mês ÷ dias decorridos, com hora atual) e `metaMesAnterior(dadosMesAnterior, n)`; multiplicadores 1/3/6 em `horizontesProjecao`. Indicadores tirados de `calcularEbitda` do realizado (despesas já proporcionais aos dias) e do mês anterior inteiro.
- `DreDashboard.tsx` (`Projecoes`): usar as novas funções; remover lógica de histórico/margem de referência e a prop `fimBi`.
- `src/lib/mia/contabil.server.ts` (`lerProjecoes`): ler apenas o mês anterior; mesma saída (projecao, meta, variacaoPct).
- `src/lib/mia/prompt.ts`: descrição das regras atualizada.
