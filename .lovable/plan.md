# Calculadora de EBITDA na aba Contábil

Duas entregas: a aba Contábil ganha um botão **Calcular EBITDA** com o detalhamento da DRE da planilha (primeira aba, BASE DRE), por posto e por mês, e o resultado calculado entra já preenchido no formulário **Lançar dados contábeis**.

## Botão "Calcular EBITDA"

Novo botão ao lado de **Lançar dados contábeis**. Abre um formulário de **um posto e um mês** (ou Rede consolidado) com as linhas da planilha, na mesma ordem:

- (+) Receita de vendas
- (-) Deduções da receita bruta
- Ajuste Energy
- **= Receita operacional líquida** (calculado)
- (-) Custo
- **= Resultado operacional bruto** (calculado)
- Ajuste transporte
- Ajuste gestão
- (-) Despesas com pessoal
- (-) Administrativas
- (-) Despesas tributárias
- (-) Furtos e roubos
- (+) Apropriação de contratos
- (-) Participações de empregados
- **= EBITDA** (calculado)
- (-) Depreciação/amortização
- **= EBIT** (calculado)

Comportamento:

- Os totais recalculam a cada digitação, com destaque para o EBITDA e sinalização de resultado negativo.
- Valores podem ser digitados com ou sem sinal — as linhas marcadas com (-) são tratadas como redutoras.
- Um cálculo por posto/mês: reabrir o mesmo posto/mês traz os valores já digitados para ajuste.
- Botão **Usar no lançamento contábil**: salva o detalhamento e abre o formulário de lançamento com Receita líquida, EBITDA e EBIT já preenchidos.

## Resultado no "Lançar dados contábeis"

Quando o posto/mês selecionado no formulário de lançamento tiver um cálculo de EBITDA salvo, os campos **Receita líquida**, **EBITDA** e **EBIT** aparecem preenchidos a partir do cálculo, com um aviso "vindo do cálculo de EBITDA" e a opção de editar manualmente. Os demais campos (lucro líquido, alíquota, PL, dívida, caixa, WACC) continuam sendo digitados como hoje, e ROE/ROIC/margens seguem usando os valores do lançamento.

## Detalhes técnicos

- Nova tabela `contabil_ebitda` no Lovable Cloud: `ibm`, `mes` (dia 1), as linhas da DRE acima como numéricos com default 0, timestamps, chave única (`ibm`, `mes`), GRANTs e políticas abertas para `anon` no mesmo padrão de `contabil_lancamentos`.
- `src/lib/ebitda.ts`: definição das linhas (chave, rótulo, sinal, se é total) e função pura `calcularEbitda` retornando receita líquida, resultado bruto, EBITDA e EBIT.
- `src/lib/contabil.functions.ts`: `listarEbitda(ano)` e `salvarEbitda(...)` seguindo o padrão atual (`clienteContabil`, upsert por `ibm,mes`).
- `src/components/redeflex/EbitdaDialog.tsx`: formulário com totais reativos; `LancamentoDialog` recebe a lista de cálculos do ano e pré-preenche `receitaLiquida`/`ebitda`/`ebit` quando existir registro do posto/mês.
- `src/routes/contabil.tsx`: novo botão no cabeçalho, estado do diálogo e query dos cálculos.
