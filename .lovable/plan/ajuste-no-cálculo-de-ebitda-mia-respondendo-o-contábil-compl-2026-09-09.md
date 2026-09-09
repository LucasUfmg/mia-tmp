# "Ajuste" no cálculo de EBITDA + Mia respondendo o contábil completo

## 1. Renomear "Ajuste Energy" para "Ajuste"

No formulário **Calcular EBITDA**, a linha passa a se chamar apenas **Ajuste**, na mesma posição (entre Deduções e Receita operacional líquida) e com o mesmo comportamento. Nada muda no cálculo nem nos valores já salvos.

## 2. Mia responde os dados contábeis no WhatsApp

Hoje a Mia já responde ROE, ROIC, margens, receita líquida, lucro líquido, EBITDA, EBIT, PL, capital investido, NOPAT e WACC a partir dos lançamentos da aba Contábil (mês específico ou acumulado do ano, respeitando os postos autorizados do número).

O que falta e será adicionado: o **detalhamento do cálculo de EBITDA** (as linhas da DRE preenchidas na calculadora). Assim a Mia passa a responder perguntas como:

- "Qual o EBITDA do Posto Central em agosto?"
- "Quanto foi de despesas com pessoal em julho?"
- "Como fecha meu EBITDA? Mostra o detalhamento."
- "Qual a receita líquida e o resultado bruto do mês?"

Comportamento:

- Devolve receita de vendas, deduções, ajuste, custo, ajustes de transporte e gestão, pessoal, administrativas, tributárias, furtos e roubos, apropriação de contratos, participações de empregados e depreciação, mais os totais calculados (receita operacional líquida, resultado operacional bruto, EBITDA, EBIT).
- Mês específico ou acumulado do ano; um posto, vários postos ou a rede (soma dos cálculos do escopo autorizado).
- Se não houver cálculo salvo no período, a Mia diz que o EBITDA daquele período ainda não foi calculado no painel, em vez de estimar.
- A resposta segue curta, em formato WhatsApp, com destaque no EBITDA.

## Detalhes técnicos

- `src/lib/ebitda.ts`: label da linha `ajusteEnergy` passa a `"Ajuste"`. Chave e coluna do banco (`ajuste_energy`) permanecem, evitando migração e perda de dados.
- `src/lib/mia/contabil.server.ts`: novo `lerDetalheEbitda({ periodo, mes, ibms })` lendo `contabil_ebitda` pelo cliente já existente (`clienteContabil`), filtrando por meses e escopo (mesma regra de `filtrarEscopo`), somando as linhas e aplicando `calcularEbitda` de `src/lib/ebitda.ts` sobre os totais (sem duplicar fórmulas). Retorna `semCalculo: true` quando não há registro.
- `src/lib/mia/tools.server.ts`: nova ferramenta `detalhe_ebitda` com entrada `{ periodo: "mes" | "ano", mes?: "YYYY-MM", postos?: string[] }`, resolvendo postos com o `resolverIbms` atual.
- `src/lib/mia/prompt.ts`: uma linha indicando quando usar `detalhe_ebitda` (composição/linhas do EBITDA) versus `indicadores_contabeis` (índices), e a regra de avisar quando não há cálculo lançado.
- Somente leitura: nenhuma mudança de banco, de gravação, do agente/personalidade ou da tela `/contabil`.
