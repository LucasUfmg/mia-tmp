# Lançar despesas + novas rubricas + CMV e comparativo nos cards

## 1. Botão "Lançar despesas"
- O botão "Calcular EBITDA" passa a se chamar **Lançar despesas** (mesmo lugar, mesmo formulário por posto/mês, com receita e CMV do BI em azul e bloqueados).
- Saem os botões "Salvar cálculo" e "Usar no lançamento contábil". Fica um único botão **Salvar despesas**.
- Ao salvar, as despesas são gravadas e o lançamento contábil do mesmo posto/mês é atualizado na hora com Receita líquida, EBITDA, EBIT e Lucro líquido. Se ainda não houver lançamento para aquele posto/mês, ele é criado automaticamente (PL, dívida, caixa, alíquota e WACC ficam em zero até o usuário preencher em "Lançar dados contábeis").
- Em "Lançar dados contábeis" esses campos continuam em azul e somente leitura.

## 2. Rubricas de despesa
O formulário terá obrigatoriamente estas despesas, nesta ordem:
1. Pessoal (hoje "Despesas trabalhistas" — valores salvos são mantidos)
2. Operação/Administrativas (hoje "Despesas administrativas" — mantidos)
3. Aluguel (nova)
4. Taxas de Cartão (nova)
5. Frete (nova)
6. Tributárias (mantidas)
7. Despesas Financeiras (mantidas)
8. Despesas Não Operacionais (hoje "Despesas não contábeis" — mantidos)
9. IRPJ e CSLL (nova, lançada após o resultado, antes do lucro líquido)

As demais linhas já existentes (descontos/acréscimos, falta/sobra, outras despesas operacionais, outras receitas não operacionais, bônus e rateios) continuam no formulário para não perder dados já lançados.

Fórmula: EBITDA = Lucro bruto − (Pessoal, Operação/Adm., Aluguel, Taxas de Cartão, Frete, Tributárias, outras operacionais). Resultado final = EBITDA − Financeiras − Não operacionais ± receitas/bônus/rateios. Lucro líquido = Resultado final − IRPJ e CSLL. A DRE Gerencial, gráfico de composição, ranking de despesas e a Mia passam a mostrar as novas rubricas.

## 3. Big numbers
- Mantêm todos os cards atuais.
- Novo card **CMV** (custo vindo do BI, com % sobre a receita).
- Cada card mostra a variação contra o **mesmo período do mês anterior** (ex.: 1 a 28/set vs 1 a 28/ago; em "Acumulado do ano", o acumulado até o mês anterior), com seta e cor verde/vermelho.

## Detalhes técnicos
- Migração aditiva em `contabil_ebitda`: `aluguel`, `taxas_cartao`, `frete`, `irpj_csll` (numeric, default 0). Nada é apagado.
- `src/lib/ebitda.ts`: novas linhas, rótulos renomeados (chaves internas mantidas), fórmulas e `totaisApos` atualizados.
- `salvarEbitda`: troca o `update` do lançamento por `upsert` em `ibm,mes` que só escreve os campos derivados (quando cria, os demais ficam no padrão zero).
- `EbitdaDialog`: remove o botão/prop `onUsarNoLancamento`, fica só salvar; invalida as queries de lançamentos e cálculos.
- Comparativo do mês anterior: para receita/CMV do mês corrente usa `getReceitaCusto` do mês anterior cortado no mesmo dia; demais cards comparam com os lançamentos do mês anterior (buscando também o ano anterior quando o mês for janeiro).
- Atualizar `src/lib/mia/contabil.server.ts` com as novas rubricas.
