# Plano — período visível, EBITDA por litro e fechamento da DRE

## Resultado esperado

- Mostrar no alto do Contábil, em destaque e sem alterar a estrutura geral, a data e o horário inicial e final dos dados exibidos.
- Exibir no cartão EBITDA o indicador **EBITDA por litro vendido** no texto auxiliar.
- Destacar em vermelho, na DRE Gerencial, o **Custo** e o **Total de Despesas**, incluindo seus percentuais com sinal negativo.
- Substituir o grupo “Sócios” por **Resultado líquido** e detalhar abaixo os lançamentos de **Retirada pró-labore** e **Distribuição de lucros**.
- Calcular IRPJ e CSLL automaticamente à alíquota fixa de **34%** sobre o saldo de EBITDA com receitas e despesas não operacionais.

## Alterações

1. **Faixa visível do período dos dados**
   - Adicionar uma faixa superior de destaque, abaixo dos filtros e antes das abas/cartões.
   - Mostrar início e fim completos no horário de São Paulo, por exemplo: `01/10/2026 00:00 → 06/10/2026 17:08`.
   - Para mês corrente, usar o instante real do corte retornado pelo BI; para mês encerrado, mostrar o último dia às 23:59; no acumulado anual, usar o primeiro dia do primeiro mês até o corte do último mês exibido.
   - Manter indicação de carregamento ou indisponibilidade até que o período real seja conhecido.

2. **Cartão EBITDA**
   - Preservar o valor principal e a comparação percentual atuais.
   - Trocar o texto “Result. Operacional Bruto − Despesas totais” por `EBITDA por litro: R$ X,XX/L`.
   - Evitar divisão por zero, mostrando “—” quando não houver litros vendidos.

3. **Custo e despesas em vermelho**
   - Aplicar destaque vermelho às linhas de grupo **Custo** e **Total Despesas**, tanto no valor quanto no rótulo.
   - Apresentar seus valores como negativos na DRE, sem alterar os valores armazenados.
   - Exibir a análise vertical dessas duas linhas com percentual negativo, por exemplo `−85,0%` e `−12,3%`.
   - Manter as fórmulas internas coerentes, evitando inverter o sinal duas vezes nos resultados.

4. **IRPJ/CSLL e fechamento da DRE**
   - Retirar as provisões manuais de IRPJ/CSLL do formulário e da composição do cálculo.
   - Calcular automaticamente: `IRPJ e CSLL = 34% × max(EBITDA + resultado não operacional, 0)`.
   - Não gerar imposto quando a base for negativa.
   - Exibir uma única linha automática de IRPJ e CSLL, com sinal negativo.
   - Calcular **Resultado líquido = EBITDA + resultado não operacional − IRPJ/CSLL**.

5. **Pró-labore e distribuição de lucros**
   - Renomear a faixa “Sócios” para **Resultado líquido**.
   - Abaixo do Resultado líquido, exibir as linhas manuais negativas **Retirada pró-labore** e **Distribuição de lucros**.
   - Manter **Resultado Empresa** como total final após descontar as duas retiradas.
   - Incluir os dois campos no botão “Lançar valores da DRE”, em uma faixa própria e na mesma ordem da tabela.
   - Reaproveitar os campos contábeis existentes sempre que possível, preservando lançamentos anteriores; qualquer ajuste de banco será aditivo e manterá os acessos atuais.

6. **Consistência e validação**
   - Centralizar novas linhas, sinais e fórmulas na definição única da DRE, para o painel, formulário e Mia não divergirem.
   - Confirmar que Receita/CMV e o período continuam vindo apenas do BI e não se tornam editáveis.
   - Conferir salvamento e recarregamento de pró-labore e distribuição de lucros.
   - Validar cartão EBITDA, período superior, sinais/percentuais e sequência final da DRE em desktop e celular.

## Detalhes técnicos

- Ampliar o retorno mensal do BI com os horários efetivos de início e fim, mantendo a consulta curta por posto/mês e a fila limitada já existente.
- Consolidar os intervalos de todos os postos/meses selecionados sem criar uma consulta anual pesada.
- Manter os cinco campos antigos de provisão no armazenamento para compatibilidade histórica, mas ignorá-los no novo cálculo automático e removê-los do formulário.
- Usar o campo existente de distribuição de lucros e mapear o lançamento anterior de “Sócios” para Retirada pró-labore, evitando perda de dados.
