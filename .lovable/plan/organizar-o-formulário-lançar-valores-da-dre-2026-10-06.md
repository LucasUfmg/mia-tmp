# Organizar o formulário “Lançar valores da DRE”

## Objetivo
Reorganizar os campos manuais na mesma sequência visual da DRE Gerencial, facilitando o preenchimento por grupo contábil sem alterar valores, fórmulas ou salvamento.

## Alterações
- Dividir o formulário em faixas visuais com título e identificação clara:
  1. **Receitas e ajustes** — Venda de Serviços, Descontos e Acréscimos.
  2. **Impostos sobre Faturamento** — Postos, Distribuidora, Satélites, Patrimonial e Logística.
  3. **Complementos de Custo** — Receita Líquida Distribuidora, Bônus de Performance e Frete.
  4. **Total Despesas** — Pessoal, Operação/Administrativas, Taxas de Cartão, Rateios, Tributárias, Aluguel, Gestão, Distribuidora e Over Aluguel.
  5. **Receitas e Despesas Não Operacionais** — receitas e despesas financeiras, diversas, distribuidora e Bônus de Contrato.
  6. **IRPJ e CSLL** — provisões de Postos, Distribuidora, Gestão, Patrimonial e Logística.
  7. **Sócios** — Retiradas / Pró-labore.
- Manter os sinais contábeis `(+)` e `(−)` em cada campo.
- Usar cabeçalhos de faixa visualmente distintos, seguindo a hierarquia já usada na tabela da DRE.
- Manter os campos em duas colunas no desktop e uma coluna no celular, com leitura e preenchimento confortáveis.
- Preservar a troca rápida de posto e mês, os valores existentes, o botão de limpar e o salvamento atual.

## Regras preservadas
- O formulário continuará mostrando somente campos manuais.
- Nenhum total ou resultado será calculado ou exibido dentro do formulário.
- Totais, EBITDA e Resultado Empresa continuarão automáticos e visíveis somente no BI/DRE.
- Receita, CMV e demais dados do BI não serão trazidos para o formulário.

## Validação
- Conferir que todas as rubricas manuais da DRE aparecem uma única vez e no grupo correto.
- Testar abertura, troca de posto/mês, preenchimento, limpeza e salvamento.
- Validar a organização em desktop e celular e confirmar que o projeto permanece sem erros.
