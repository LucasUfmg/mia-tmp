# Mia: projeções para qualquer período futuro

## O que muda
A Mia passa a projetar todos os indicadores (contábeis e da Visão Geral) para qualquer período que o usuário pedir — ex.: "próximas 2 horas", "até sexta", "próximos 10 dias", "próximos 2 meses", "até dezembro", "próximo ano". A tela do painel não muda.

## Mesma lógica de hoje, generalizada
- **Média base:** realizado até agora ÷ tempo decorrido (horas no dia, dias no mês) — igual ao atual.
- **Projeção de um período:** média × duração do período pedido.
  - Períodos que terminam hoje/no mês corrente: realizado + média × tempo restante (como já é).
  - Períodos futuros maiores: projeção do fim do mês × (nº de meses), ou média diária × nº de dias quando o período for em dias.
- **Meta:** mesma referência de hoje, proporcional ao período:
  - Contábil: mês anterior fechado ÷ dias desse mês × dias do período (para meses inteiros: mês anterior × nº de meses).
  - Visão Geral: até 1 dia → mesmo dia da semana anterior fechado (proporcional às horas); acima → mês anterior fechado proporcional aos dias.
- Índices (M/LT, LB, TMV, TMC, TMP, EBITDA/litro) continuam derivados dos volumes projetados.
- Resposta sempre com projeção, meta e variação %, citando o período entendido (data/hora inicial e final).

## Detalhes técnicos
- `projecoes_contabeis`: novo parâmetro opcional `ate` (data `YYYY-MM-DD`) ou `dias`/`meses`; sem parâmetro mantém as 3 linhas atuais. `projetarDre` recebe fator em dias.
- `projecao_mes`: aceita `horas`, `dias` ou `ate`; calcula fator a partir da média por minuto/dia e meta proporcional.
- Prompt: instruir a Mia a converter o período falado em `ate`/`dias`/`horas` usando a data atual de São Paulo.
- Fórmulas continuam centralizadas em `src/lib/ebitda.ts` e `src/lib/projecao-visao.ts`.
