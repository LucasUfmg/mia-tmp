# Comparação dos big numbers no mesmo acumulado de dia e hora

## O que muda

- O texto pequeno abaixo de cada big number ("▲ x% vs mês anterior") passa a comparar o mês atual (parcial, até agora) com o mês anterior cortado no mesmo dia e hora. Ex.: hoje 6/10 às 15:40 compara com 1/09 a 6/09 às 15:40.
- Receita bruta, CMV e Result. Operacional Bruto usam o valor cortado do mês anterior.
- Despesas totais continuam comparando mês inteiro com mês inteiro (despesas são fixas).
- EBITDA e Resultado final: receita/CMV cortados do mês anterior menos as despesas do mês inteiro, igual ao que o mês atual já mostra.
- O texto passa a dizer "vs mesmo período do mês anterior" quando o corte estiver em uso.
- Se o mês selecionado já estiver fechado (mês passado), ou na visão "Acumulado do ano", a comparação continua como hoje (mês fechado), para não comparar um mês inteiro com um pedaço.
- Os valores grandes dos cards, a DRE e o "Resultado final mensal" não mudam.

## Detalhes técnicos

- `src/components/redeflex/DreDashboard.tsx`: `anterior` passa a usar `calculosMesmoPeriodo` (já carregado para a Evolução da receita) quando `meses.length === 1`, o mês selecionado é o mês corrente e o dado existe; senão mantém `calculos`. Card recebe rótulo de comparação dinâmico.
- Sem mudanças no servidor: a consulta `mesmoPeriodo` já cobre os meses anteriores com despesas salvas. Garantir que o mês anterior entre nos pares (já entra via ano anterior/ano atual).
- Validar com typecheck e conferir os cards no preview.
