# Menu de navegação + Calculadora de EBITDA na aba Contábil

Três entregas: o menu lateral passa a aparecer também em telas menores, a aba Contábil ganha um botão **Calcular EBITDA** com o detalhamento da DRE da planilha, e o resultado calculado entra já preenchido no formulário **Lançar dados contábeis**.

## 1. Navegação visível em qualquer tela

O menu lateral (Visão Geral, Contábil, Manual) hoje só aparece em telas grandes. Em telas menores entra um botão de menu no topo da página que abre o mesmo menu em painel deslizante, com os mesmos itens e o mesmo destaque dourado do item ativo. Vale para a Visão Geral e para a Contábil.

## 2. Botão "Calcular EBITDA"

Novo botão ao lado de **Lançar dados contábeis**. Abre um formulário de **um posto e um mês** (ou Rede consolidado) com as linhas da primeira aba da planilha (BASE DRE), na mesma ordem:

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
- Valores negativos podem ser digitados com sinal ou sem — as linhas marcadas com (-) são tratadas como redutoras.
- Um cálculo por posto/mês: reabrir o mesmo posto/mês traz os valores já digitados para ajuste.
- Botão **Usar no lançamento contábil**: salva o detalhamento e abre o formulário de lançamento com Receita líquida, EBITDA e EBIT já preenchidos.

## 3. Resultado no "Lançar dados contábeis"

Quando o posto/mês selecionado no formulário de lançamento tiver um cálculo de EBITDA salvo, os campos **Receita líquida**, **EBITDA** e **EBIT** aparecem preenchidos a partir do cálculo, com um aviso "vindo do cálculo de EBITDA" e a opção de editar manualmente. Os demais campos (lucro líquido, alíquota, PL, dívida, caixa, WACC) continuam sendo digitados como hoje, e ROE/ROIC/margens seguem usando os valores do lançamento.

## Detalhes técnicos

- Nova tabela `contabil_ebitda` no Lovable Cloud: `ibm`, `mes` (dia 1), as linhas da DRE acima como numéricos com default 0, timestamps, chave única (`ibm`, `mes`), GRANTs e políticas abertas para `anon` no mesmo padrão de `contabil_lancamentos`.
- `src/lib/ebitda.ts`: definição das linhas (chave, rótulo, sinal, se é total) e função pura `calcularEbitda` retornando receita líquida, resultado bruto, EBITDA e EBIT.
- `src/lib/contabil.functions.ts`: `listarEbitda(ano)` e `salvarEbitda(...)` seguindo o padrão atual (`clienteContabil`, upsert por `ibm,mes`).
- `src/components/redeflex/EbitdaDialog.tsx`: formulário com totais reativos; `LancamentoDialog` recebe `ebitda` (lista do ano) e pré-preenche `receitaLiquida`/`ebitda`/`ebit` quando existir registro do posto/mês.
- `src/components/redeflex/Sidebar.tsx`: extrai a lista de itens para reuso e ganha uma variante em `Sheet` (shadcn) acionada por botão no topo; `src/routes/contabil.tsx` e `src/routes/index.tsx` passam a renderizar o gatilho no cabeçalho móvel.
