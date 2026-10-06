# Evolução da receita comparando o mesmo acumulado de dia e hora

## O que muda

Hoje o gráfico "Evolução da receita" mostra, para meses anteriores, o mês inteiro fechado. Passa a valer o seguinte:

- Cada mês do gráfico mostra o acumulado do dia 1 até o mesmo dia e a mesma hora de agora. Exemplo: se agora é 6 de outubro às 15:10, setembro mostra de 1º de setembro até 6 de setembro às 15:10, agosto até 6 de agosto às 15:10, e assim por diante.
- Todos os pontos do gráfico representam o mesmo período de vendas, e a comparação fica justa.
- O subtítulo do gráfico mostra o corte (ex.: "acumulado até dia 6, 15:10, de cada mês").
- Se o mês tiver menos dias que o dia atual (ex.: dia 31 em fevereiro), o corte vai até o fim do mês.
- Vale apenas para o gráfico "Evolução da receita". Os 6 números principais, a DRE Gerencial e o gráfico "Resultado final mensal" continuam como estão, porque as despesas são lançadas por mês inteiro.

## Detalhes técnicos

- `src/lib/receita-custo.server.ts`: `receitaCustoDoBi` ganha a opção `corte` ({ dia, minutos }). Quando informada, meses anteriores consultam do dia 1 até o dia do corte (limitado ao último dia do mês), aplicando `cutoffMinutes` no último dia, mesmo mecanismo já usado no mês corrente.
- `src/lib/redeflex.functions.ts`: `listarReceitaCusto` aceita `mesmoPeriodo: true`; o corte é calculado no servidor no horário de São Paulo e entra na chave de cache.
- `src/routes/contabil.tsx`: uma segunda consulta com `mesmoPeriodo`, só para os meses do gráfico de evolução, repassada ao dashboard como prop separada.
- `src/components/redeflex/DreDashboard.tsx`: a série "Evolução da receita" usa essa série; o restante continua com os valores atuais.
- Validar com typecheck e conferir o gráfico no preview.
