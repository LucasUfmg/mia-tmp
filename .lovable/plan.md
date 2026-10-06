# Contábil: botão atualizar, comparativo anual, linhas do BI em verde e fórmulas das margens

## 1. Botão "Atualizar dados"
- Na faixa "Período dos dados apresentados", à direita, um botão "Atualizar dados" com ícone de recarregar.
- Ao clicar: busca de novo receita/CMV do BI (ignorando o que estava guardado) e as despesas salvas. O ícone gira enquanto carrega e o botão fica desativado.

## 2. "Acumulado do ano" compara com o ano anterior
- Na visão "Acumulado do ano", os percentuais abaixo dos big numbers comparam janeiro até o mês escolhido deste ano com janeiro até o mesmo mês do ano anterior.
- Se o mês escolhido é o mês atual, o ano anterior é cortado no mesmo dia e hora (ex.: 01/01/2025 a 06/10/2025 17:32), e as despesas do mês proporcionais aos dias, igual ao mês atual.
- Texto do comparativo: "vs mesmo período do ano anterior".
- Sem dados no ano anterior: mostra "0% vs mesmo período do ano anterior" (valor zerado), em cinza.
- A visão "Mês" continua comparando com o mês anterior, como hoje.

## 3. Linhas do BI em verde na DRE Gerencial
- Linhas que vêm direto do BI (Litros Vendidos, Abastecimentos Realizados, Margem Produto, Margem Combustível, Venda de Combustível, Venda de Mercadorias, Custo Combustível, Custo Mercadoria) ganham fundo verde claro na linha inteira, com uma pequena legenda acima da tabela: "Verde = dados do BI".
- O texto dos valores mantém a regra atual (vermelho negativo).

## 4. Fórmula das margens
Como é calculado hoje:
- Margem Produto = (Venda de Mercadorias − Custo Mercadoria) ÷ Venda de Mercadorias × 100
- Margem Combustível = (Venda de Combustível − Custo Combustível) ÷ Venda de Combustível × 100
- Venda zero → margem 0%. Na visão acumulada/rede, soma vendas e custos antes de dividir (não é média das margens).

Na DRE, abaixo do nome de cada linha aparece a fórmula em texto pequeno, ex.: "(Venda Mercadorias − Custo Mercadoria) ÷ Venda Mercadorias".

## Detalhes técnicos
- `contabil.tsx`: `onAtualizar` faz `invalidateQueries(["contabil"])` + refetch das consultas BI; passa `atualizando` ao DreDashboard.
- Visão ano: incluir nos pares as consultas de jan..mês do ano anterior (ampliar `limiteInicio`) como prioritárias; para o mês correspondente ao corrente, usar a consulta `mesmoPeriodo` com ano−1 (estender `receitaCustoMes` com opção de corte "mesmo dia/hora do ano anterior") e aplicar `fatorDiasDoMes` às despesas desse mês.
- DreDashboard recebe `comparacaoAnual` (Ebitda[] do ano anterior) e usa no `anterior`; se vazio, variação = 0.
- `linhasDre` em `ebitda.ts`: campo opcional `formula` nas duas métricas; DreRow renderiza; linhas `tipo === "bi"` e métricas recebem classe verde clara (token novo `--bi-soft` em styles.css).
