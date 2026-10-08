# Mia igual ao painel + aba Projeções

## 1. Mia com os mesmos números do painel
Hoje a Mia soma as despesas do mês inteiro contra a receita de poucos dias (o painel divide as despesas pelos dias do mês), e uma das consultas dela ainda lê valores antigos gravados. Por isso o EBITDA sai negativo.

- A Mia passa a usar exatamente a mesma conta do painel: receita e CMV do BI até agora, despesas do mês atual proporcionais aos dias (meses fechados com o valor cheio), IRPJ/CSLL 34% e a mesma sequência até o Resultado final.
- Se o BI não responder, a Mia avisa que não conseguiu buscar, em vez de usar valores velhos.
- Os seis números (Receita bruta, CMV, Result. Operacional Bruto, Despesas totais, EBITDA, Resultado final) vêm da mesma função do painel.

## 2. Nova aba "Projeções"
Ao lado de "DRE Gerencial". Tabela simples:

```text
Indicador              | Realizado até hoje | Projeção fim do mês | Próximos 3 meses | Próximos 6 meses
Receita bruta          | ...                | ...                 | ...              | ...
CMV                    | ...
Result. Op. Bruto      | ...
Despesas totais        | ...
EBITDA                 | ...
Resultado final        | ...
```

- Base: média diária do mês atual (realizado ÷ dias decorridos, contando a hora atual).
- Fim do mês = média diária × dias do mês.
- Próximos 3 e 6 meses = média diária × total de dias dos próximos 3 e 6 meses, a partir do mês atual.
- Despesas projetadas pelo valor mensal lançado (proporcional aos dias), mantendo coerência com EBITDA e Resultado final, que são recalculados com as fórmulas da DRE (não projetados isoladamente).
- Respeita o posto escolhido; mostra uma nota curta explicando a base do cálculo.

## 3. Mia responde projeções
Nova ferramenta "projeções contábeis": "Qual a projeção de EBITDA do mês?", "Resultado do trimestre?" — devolve os mesmos valores da aba.

## Detalhes técnicos
- `src/lib/ebitda.ts`: nova função `projetarDre(realizado, despesasMes, diasDecorridos, diasHorizonte)` usada pelo painel e pela Mia.
- `src/lib/mia/contabil.server.ts`: `lerDetalheEbitda` aplica `fatorDiasDoMes` + `proporcionalizarDespesas` ao mês corrente, corta o BI até agora, e nunca cai em receita/custo salvos; `lerContabil` (contabil_lancamentos antigo) deixa de ser usado para EBITDA. Nova `lerProjecoes`.
- `src/lib/mia/tools.server.ts`: ferramenta `projecoes_contabeis`; prompt atualizado.
- `DreDashboard.tsx`: nova aba "Projeções" com a tabela.
