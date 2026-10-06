# Evolução da receita comparando o mesmo acumulado de dias

## O que muda

Hoje o gráfico "Evolução da receita" mostra, para meses anteriores, o mês inteiro fechado. Passa a valer o seguinte:

- Cada mês do gráfico mostra o acumulado do dia 1 até o mesmo dia do mês em que estamos. Exemplo: se hoje é 6 de outubro, setembro mostra 1–6 de setembro, agosto mostra 1–6 de agosto, e assim por diante.
- A comparação fica justa: todos os pontos do gráfico representam a mesma quantidade de dias de vendas.
- O subtítulo do gráfico indica o recorte (ex.: "acumulado até o dia 6 de cada mês").
- Vale apenas para o gráfico "Evolução da receita". Os 6 números principais, a DRE Gerencial e o gráfico "Resultado final mensal" continuam como estão (mês cheio para meses fechados), porque as despesas são lançadas por mês inteiro e misturar receita parcial com despesa cheia distorceria o resultado.

## Detalhes técnicos

- `src/lib/receita-custo.server.ts`: `receitaCustoDoBi` ganha opção `ateDia` (dia do mês). Quando informada, meses anteriores são consultados do dia 1 até `ateDia` (limitado ao último dia do mês), em vez do mês fechado. O mês corrente continua parcial até agora, como já é.
- `src/lib/redeflex.functions.ts`: `listarReceitaCusto` aceita `ateDia` e repassa para cada par posto/mês; a chave de cache inclui o dia para não misturar com as consultas de mês cheio.
- `src/routes/contabil.tsx`: busca uma segunda série do BI com `ateDia` = dia de hoje, só para os meses do gráfico de evolução (últimos 12 com dados), e repassa ao dashboard como prop separada.
- `src/components/redeflex/DreDashboard.tsx`: a série do gráfico "Evolução da receita" usa essa série parcial; o restante do painel continua usando os valores de mês cheio.
- Validar com typecheck e conferir o gráfico no preview.
