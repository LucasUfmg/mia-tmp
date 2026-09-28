# Troca de posto rápida em Lançar despesas

## Causa
Ao trocar de posto ou mês, a janela ainda busca Receita e CMV no BI. É uma consulta lenta, feita em segundo plano, e trava os campos com "Carregando…" até a resposta chegar, mesmo sem mostrar esses valores.

## O que muda
- Lançar despesas não busca mais Receita nem CMV, nem ao trocar de posto nem ao salvar. Grava só as despesas digitadas.
- Trocar de posto ou mês fica instantâneo: os campos mostram na hora as despesas já salvas, ou aparecem vazios. Não aparece mais "Carregando…".
- Receita bruta e CMV aparecem apenas no painel da aba Contábil, lidos direto do BI. Lá eles se juntam às despesas salvas para calcular Result. Op. Bruto, EBITDA e Resultado final.

## Detalhes técnicos
- `EbitdaDialog.tsx`: remover a `useQuery` de `getReceitaCusto`, o overlay e os `disabled` ligados a `buscandoPainel`. O mutation envia só as despesas, sem `receitaVendas`/`custo`.
- `salvarEbitda`: gravar só as colunas de despesa, sem sobrescrever `receita_vendas`/`custo`. Remover a sincronização de receita_liquida/ebitda/ebit/lucro_liquido em `contabil_lancamentos`, que dependia de receita/custo.
- `contabil.tsx`: nova query de receita/custo do BI por posto e mês do período (reutilizando `getReceitaCusto`, com cache). Ela é mesclada nos registros de `calculos` antes de chegar ao `DreDashboard`, então as fórmulas continuam em `src/lib/ebitda.ts`.
- `LancamentoDialog.tsx`: os campos azuis Receita líquida/EBITDA/EBIT usam os mesmos registros mesclados.
- Mia (`lerDetalheEbitda`): buscar receita/custo do BI no servidor e mesclar do mesmo modo.
