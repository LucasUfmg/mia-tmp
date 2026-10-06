# Replicar as despesas de setembro/2026 para todos os meses

## O que muda
- As despesas salvas em setembro/2026 serão copiadas para os outros 11 meses de 2026 (janeiro a dezembro, menos setembro).
- Hoje só há 2 registros em setembro: a Rede (consolidado) e um posto de teste. Os dois serão copiados.
- Só as despesas são copiadas. Receita e CMV continuam vindo do BI de cada mês.
- Nenhum outro mês tem despesas salvas hoje, então nada será sobrescrito.

## Atenção
- Com a regra atual, a aba Contábil só mostra os números de postos e meses que têm despesas salvas. Depois da cópia, a Rede e o posto de teste aparecem em todos os meses. Os demais postos continuam vazios até alguém lançar despesas para eles.

## Detalhes técnicos
- Alteração só nos dados: copiar as linhas de `contabil_ebitda` com `mes = '2026-09-01'` para cada mês de 2026 sem registro, mantendo as colunas de despesa. Isso usa `on conflict (ibm, mes) do nothing`.
- Conferir no final: 24 registros, 12 meses × 2.
