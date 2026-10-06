# Receita e CMV do BI sempre visíveis na aba Contábil

## Causa (confirmada)
- Hoje o painel só busca Receita e CMV no BI para os postos e meses que já têm despesas salvas.
- No banco existem só 2 registros de despesas, ambos de setembro/2026 (Rede e um posto de teste). Outubro, mês aberto por padrão, não tem nenhum, então o painel fica vazio, mesmo com vendas no BI.
- Antes, Receita e CMV eram gravados junto com as despesas. Por isso o problema só apareceu depois que Lançar despesas parou de buscar esses valores.

## O que muda
- Receita bruta, CMV e Result. Operacional Bruto aparecem sempre, direto do BI, para cada posto e mês do período, com ou sem despesas salvas.
- Sem despesas lançadas, as despesas contam como zero. EBITDA e Resultado final aparecem e são atualizados quando você salvar despesas.
- Vale para Visão Geral, DRE Gerencial, Comparativo entre Postos e para os campos azuis de Lançar dados contábeis.

## Detalhes técnicos
- `contabil.tsx`: montar `pares` a partir de todos os postos (`lojas`) e de REDE × meses do escopo (mais o mês anterior, usado na comparação), e não só de `calculos`. Criar um registro de Ebitda zerado para pares sem despesas e mesclar receita/custo do BI.
- `listarReceitaCusto`: manter os lotes e o cache. Revisar o limite de 400 pares (no acumulado do ano, até cerca de 28 × 13). Se precisar, buscar só a rede e os postos selecionados.
- Mia (`lerDetalheEbitda`): usar o mesmo fallback, ou seja, BI com despesas zeradas quando não houver registro.
- Validar no preview: em outubro, sem despesas, os 6 cards precisam mostrar Receita e CMV.
