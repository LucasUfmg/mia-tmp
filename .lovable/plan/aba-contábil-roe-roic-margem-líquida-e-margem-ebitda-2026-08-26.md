# Aba Contábil — ROE, ROIC, Margem Líquida e Margem EBITDA

Nova tela `/contabil` no BI, com os mesmos filtros de postos já usados no painel, exibindo os quatro indicadores financeiros do documento. Os dados contábeis não existem no banco dos postos, então são lançados manualmente por posto e por mês, e a tela consolida conforme a seleção.

## O que a tela mostra

Cabeçalho com o filtro múltiplo de postos (igual ao painel), seletor de mês e alternância **Mês** / **Acumulado do ano (YTD)**.

Big numbers no padrão atual (card elevado, ícone dourado):

- **ROE** = Lucro Líquido ÷ PL Médio × 100, com PL Médio = (PL inicial + PL final) ÷ 2
- **ROIC** = NOPAT ÷ Capital Investido Médio × 100, com NOPAT = EBIT × (1 − alíquota efetiva) e Capital Investido = PL + Dívida Financeira − Caixa
- **Margem Líquida** = Lucro Líquido ÷ Receita Líquida × 100
- **Margem EBITDA** = EBITDA ÷ Receita Líquida × 100

Cada card mostra o valor, os componentes usados (ex.: "R$ 2,0 mi ÷ R$ 20,0 mi") e a interpretação executiva em uma linha. Abaixo dos cards:

- **ROIC vs WACC**: comparação com o WACC informado, sinalizando criação de valor (ROIC > WACC), equilíbrio ou destruição de valor.
- **Tabela mensal do ano**: uma linha por mês com receita, lucro líquido, EBITDA, EBIT e os quatro indicadores, mais a linha de total/acumulado.
- **Evolução**: gráfico de linha com ROE, ROIC e as duas margens ao longo dos meses.

## Lançamento dos dados

Botão **Lançar dados contábeis** abre um formulário (posto + mês) com os campos:

Receita Líquida, Lucro Líquido, EBITDA, EBIT, Alíquota efetiva de impostos (%), Patrimônio Líquido inicial, Patrimônio Líquido final, Dívida Financeira, Caixa e Equivalentes, WACC (%).

Comportamento:

- Um registro por posto/mês; salvar de novo no mesmo posto/mês atualiza o lançamento.
- Ao selecionar um posto e mês já lançados, o formulário abre preenchido para edição.
- Campos vazios contam como zero e a tela indica quando um posto selecionado não tem lançamento no mês, para o número não parecer completo.
- Importação/edição rápida em lote fica de fora desta primeira versão.

## Consolidação com os filtros

- Somatórios (receita, lucro, EBITDA, EBIT, PL, dívida, caixa) somam os postos selecionados; rede inteira quando nada é selecionado.
- Alíquota e WACC entram como média ponderada pela receita dos postos selecionados.
- ROE, ROIC e margens são recalculados sobre os totais consolidados — nunca média de percentuais.
- No modo **YTD**, PL médio usa o PL inicial do primeiro mês lançado do ano e o PL final do último; os fluxos (receita, lucro, EBITDA, EBIT) são somados.

## Detalhes técnicos

- Nova tabela `contabil_lancamentos` no Lovable Cloud: `ibm`, `mes` (date, dia 1), receita_liquida, lucro_liquido, ebitda, ebit, aliquota_efetiva, pl_inicial, pl_final, divida_financeira, caixa, wacc, timestamps; chave única (`ibm`, `mes`). Sem login por enquanto: políticas de leitura e escrita abertas para `anon`, com os GRANTs correspondentes. Aviso: qualquer visitante do painel poderá editar esses valores; quando quiser, adiciono login depois e fecho a escrita.
- Server functions em `src/lib/contabil.functions.ts` (`listarLancamentos`, `salvarLancamento`) usando o cliente do Cloud; nenhuma alteração no banco dos postos.
- Cálculo puro em `src/lib/contabil.ts` (consolidação + fórmulas), testável e reutilizável.
- UI: `src/routes/contabil.tsx` + `src/components/redeflex/ContabilCards.tsx`, `ContabilTabela.tsx`, `LancamentoDialog.tsx`, reaproveitando `MultiStoreFilter`, tokens semânticos atuais e o padrão de cards do painel.
- Sidebar ganha o item **Contábil**; leitura via TanStack Query e invalidação após salvar.
- `head()` próprio da rota com título e descrição de indicadores financeiros.
