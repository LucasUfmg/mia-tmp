# Lançar despesas: só lançamento, sem dados pré-preenchidos nem cálculo

## O que muda para o usuário
- Ao abrir "Lançar despesas" e escolher posto/mês, os campos de despesa aparecem **vazios** (ou com o que o próprio usuário já salvou antes para aquele posto/mês). Nada vem mais da planilha base.
- Receita de vendas e CMV **saem do formulário** (não são despesas; continuam vindo do BI automaticamente).
- Somem da tela as linhas de total ("= Result. Operacional Bruto", "= EBITDA", "= Resultado final", "= Lucro líquido") e qualquer resumo calculado.
- Ao clicar em "Salvar despesas", só os valores digitados são gravados.
- O cálculo (Result. Op. Bruto, EBITDA, Resultado final, Lucro líquido) é feito depois, na aba Contábil (Visão Geral, DRE Gerencial, Comparativo), juntando as despesas salvas com Receita e CMV do BI.

## Pergunta implícita resolvida
- "Lançar dados contábeis" continua mostrando Receita líquida/EBITDA/EBIT em azul, mas agora calculados na hora a partir das despesas salvas + BI, em vez de copiados no momento do salvamento.

## Detalhes técnicos
- `EbitdaDialog.tsx`: remover `baseDrePorPosto`/`baseDreRedeConsolidada`/`paraFormDaPlanilha`, a query `getReceitaCusto`, `calcularEbitda`, `totaisApos` e as linhas travadas; listar só as linhas de despesa/ajuste editáveis; loading apenas ao ler o salvo do posto/mês.
- `salvarEbitda` (`contabil.functions.ts`): gravar só as despesas; parar de copiar receita_liquida/ebitda/ebit/lucro_liquido para `contabil_lancamentos`.
- `contabil.tsx`/`DreDashboard.tsx`: montar os totais com `calcularEbitda` usando receita/custo do BI (`getReceitaCusto` por posto/mês) + despesas salvas; fórmulas continuam só em `src/lib/ebitda.ts`.
- Mia (`lerDetalheEbitda`): mesma composição BI + despesas, para não divergir.
- `src/data/dre-base.ts` deixa de ser usado (pode ser removido).
