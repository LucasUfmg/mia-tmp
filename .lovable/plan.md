# Projeções mais realistas e Mia respondendo com a meta

## Por que a projeção de EBITDA e Resultado final fica tão alta

A projeção pega o realizado do mês até agora e multiplica pelos dias do mês. Para Receita e CMV isso é razoável, mas o EBITDA é uma "sobra" pequena (Receita − CMV − Despesas). Qualquer desvio pequeno vira uma diferença enorme no EBITDA:

- **Margem do início do mês distorcida:** nos primeiros dias o CMV do BI costuma estar menor que o normal (custos lançados com atraso, preço de compra antigo). Se a margem bruta sai 1 ponto acima do normal numa receita de R$ 68 mi, o EBITDA projetado sobe cerca de R$ 680 mil — algo muito acima da meta.
- **Receita do mês com dia parcial:** o dia de hoje é contado pela hora (ex.: 10:20 conta como 0,43 dia). Se o BI ainda não recebeu as vendas da manhã, a média diária fica errada.
- **Efeito alavanca:** com EBITDA de poucos % da receita, +6% de receita e margem um pouco maior viram +50% ou mais no EBITDA e no Resultado final.

O primeiro passo é confirmar com os números reais qual desses fatores pesa mais (comparar a margem bruta do mês atual com a do mês anterior e a última hora com dados no BI).

## O que vai mudar

1. **Projeção do custo pela margem histórica:** o CMV projetado passa a ser a Receita projetada × percentual de CMV da meta (mês anterior / média dos meses fechados), em vez de esticar o CMV parcial do mês. Assim a margem projetada fica coerente com a realidade e o EBITDA perto da meta, variando só pelo volume de vendas.
2. **Dia corrente pelo último dado do BI:** a média diária usa o horário final real dos dados do BI (o mesmo do "Período dos dados apresentados"), não o relógio.
3. **Nota na aba Projeções** explicando que o custo é projetado pela margem histórica.
4. **Mia responde com a meta:** a ferramenta de projeções da Mia passa a devolver, para cada horizonte, projeção, meta (mesma regra da tela: mês anterior; média dos últimos 3 e 6 meses × 3 e 6; meses disponíveis se faltar histórico) e a diferença em %, dizendo se está acima ou abaixo da meta (para CMV e Despesas, acima = ruim).

## Detalhes técnicos

- `src/lib/ebitda.ts`: `projetarDre` recebe percentual de CMV de referência (custo combustível/receita combustível e custo mercadoria/receita mercadoria separados) e o instante final do BI; fallback para o comportamento atual se não houver histórico.
- `DreDashboard.tsx` (`Projecoes`): calcula a referência a partir de `metaPorMeses(historico, 1, mes)` e passa `periodoDados.fimEm`.
- `src/lib/mia/contabil.server.ts` (`lerProjecoes`): busca meses fechados do BI (fila curta por mês, como a tela), chama `metaPorMeses` e a nova `projetarDre`; retorna `metas` e `variacao` por horizonte.
- `src/lib/mia/prompt.ts`: instrução para sempre citar a meta e a diferença ao falar de projeções.
- Validar no preview a Rede em outubro: EBITDA e Resultado final projetados próximos à meta.
