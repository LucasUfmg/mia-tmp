# Plano — DRE com indicadores no topo, sinais e lançamento manual

## Resultado esperado

- Exibir no topo da DRE Gerencial, antes das linhas financeiras:
  - Litros vendidos
  - Abastecimentos realizados
  - Margem de produto
  - Margem de combustível
- Identificar visualmente cada linha que entra no cálculo com **(+)** ou **(−)**, seguindo o sentido contábil do HTML de referência.
- Manter como automáticos os dados vindos do BI e todos os subtotais/resultados calculados.
- Permitir lançamento manual para todas as demais rubricas da DRE.

## Alterações

1. **Organizar a estrutura da DRE**
   - Mover os quatro indicadores operacionais para o início da tabela.
   - Preservar vendas e custos desmembrados vindos do BI.
   - Manter subtotais, EBITDA e Resultado Empresa calculados automaticamente.

2. **Aplicar os sinais contábeis**
   - Mostrar **(+)** nas receitas e acréscimos.
   - Mostrar **(−)** nos custos, impostos, despesas, provisões e retiradas.
   - Exibir os sinais tanto na DRE quanto no formulário, usando a mesma definição central para evitar divergências.

3. **Completar o lançamento manual**
   - Fazer o botão “Lançar despesas” listar toda rubrica manual presente na DRE, inclusive receitas, impostos, custos complementares, despesas e provisões.
   - Não liberar edição para métricas do BI nem para totais calculados.
   - Manter a troca rápida de posto/mês e o salvamento dos valores já existentes.

4. **Validar o fluxo**
   - Conferir que os quatro indicadores aparecem no topo e usam seus formatos corretos: litros, quantidade e percentuais.
   - Verificar correspondência integral entre linhas manuais da DRE e campos do formulário.
   - Testar salvamento, recarregamento e cálculos em desktop e celular.

## Detalhes técnicos

- A origem, sinal, ordem e fórmula de cada linha continuarão centralizados na definição única da DRE.
- Nenhum valor automático do BI será gravado pelo formulário manual.
- A alteração será aditiva e preservará os lançamentos contábeis existentes.
