# Despesas proporcionais aos dias do mês

## O que muda

- Todas as despesas e valores digitados em "Lançar valores da DRE" passam a ser divididos pelo número de dias do mês e somados do dia 1 até o dia de hoje antes de aparecer no painel.
  - Ex.: outubro tem 31 dias, hoje é dia 6 → cada despesa mostra 6/31 do valor digitado.
- Vale para o mês corrente nos 6 números principais, na DRE Gerencial e nos gráficos.
- Meses já fechados continuam com 100% do valor (o mês inteiro já passou).
- Na comparação dos números principais com o "mesmo período do mês anterior", as despesas do mês anterior também ficam proporcionais (6/30 de setembro), deixando EBITDA, Despesas totais e Resultado final comparáveis.
- O gráfico "Resultado final mensal" mostra os meses fechados inteiros; só a barra do mês atual fica proporcional.
- O valor salvo não muda: o formulário continua mostrando e salvando o valor do mês inteiro. A proporção é aplicada só na exibição.
- A Mia no WhatsApp continua com o valor do mês inteiro (posso alinhar depois, se quiser).

## Detalhes técnicos

- `src/lib/ebitda.ts`: nova função `proporcionalizarDespesas(c, fator)` que multiplica todos os campos `origem: "manual"` de `linhasEbitda` pelo fator, mantendo a fórmula centralizada.
- `src/routes/contabil.tsx`: na mesclagem com o BI, aplica o fator `diaHoje / diasDoMes` (horário de São Paulo) aos registros do mês corrente; em `calculosMesmoPeriodo`, aplica `min(diaHoje, diasDoMes)/diasDoMes` aos meses anteriores e o mesmo fator do mês corrente.
- `DreDashboard.tsx`: comparação de Despesas totais passa a usar `calculosMesmoPeriodo` também (já usa `anterior`), sem outras mudanças.
- Os formulários continuam recebendo `calculos` sem proporção.
- Validar com typecheck e conferir no preview.
