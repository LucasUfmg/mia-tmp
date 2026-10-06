# DRE Gerencial fiel ao HTML e comparativo simulado

## Resultado esperado
- Reproduzir na aba **DRE Gerencial** a hierarquia, a ordem das linhas e o tratamento visual do HTML enviado, mantendo a identidade RedeFlex e a barra lateral atual.
- Atualizar **Lançar despesas** para conter todas as rubricas manuais exibidas nessa DRE, sem fazer cálculos nem mostrar Receita, CMV, EBITDA ou totais dentro da janela.
- Preencher **Comparativo entre Postos** com uma simulação consistente para todos os postos, claramente identificada como demonstração e sem gravar dados fictícios no banco.

## DRE Gerencial
A tabela seguirá a estrutura do modelo:

1. **Total Receita**
   - Venda de Combustível, Venda de Mercadorias e Venda de Serviços como linhas separadas.
   - Venda de Combustível e Venda de Mercadorias virão desmembradas do BI; Venda de Serviços será mantida como linha mapeada e usará a fonte disponível no banco, ou zero quando não houver origem identificável.
   - Descontos e Acréscimos como linhas separadas.
2. **Impostos sobre Faturamento**
   - Impostos sobre Faturamento Postos
   - Impostos sobre Faturamento Distribuidora
   - Impostos sobre Faturamento Satélites
   - Impostos sobre Faturamento Patrimonial
   - Impostos sobre Faturamento Logística
3. **Custo**
   - Custo Combustível e Custo Mercadoria virão desmembrados do BI, automáticos e não editáveis.
   - Receita Líquida Distribuidora
   - Bônus de Performance
   - Frete
4. **Resultado Operacional Bruto**
5. **Total Despesas**
   - Pessoal
   - Operação/Administrativas
   - Taxas de Cartão
   - Rateios (Gestão Central)
   - Tributárias
   - Aluguel
   - Despesas de Gestão
   - Despesa de Distribuidora
   - Over Aluguel
6. **EBITDA**
7. **Receitas e Despesas Não Operacionais**
   - Receitas Financeiras
   - Receitas Diversas
   - Receita Financeira Distribuidora
   - Despesas Financeiras
   - Despesas Não Operacionais
   - Despesa Financeira Distribuidora
   - Bônus de Contrato
8. **IRPJ e CSLL**
   - Provisão IRPJ e CSLL Postos
   - Provisão IRPJ e CSLL Distribuidora
   - Provisão IRPJ e CSLL Gestão
   - Provisão IRPJ e CSLL Patrimonial
   - Provisão IRPJ e CSLL Logística
   - Sócios (Retiradas/Pró-labore)
   - Distribuição de Lucros
   - Investimentos
9. **Resultado Empresa**

Também serão preservadas as linhas operacionais do HTML **Litros Vendidos**, **Abastecimentos Realizados**, **Margem Produto** e **Margem Combustível**, alimentadas pelo BI e exibidas como métricas, não como despesas editáveis.

A tabela terá:
- grupos e subtotais com o mesmo destaque do HTML;
- linhas internas recuadas;
- valores positivos em verde e negativos em vermelho;
- valor e análise vertical para cada mês;
- comparação nominal e percentual quando dois meses forem selecionados;
- totais anuais quando houver meses de mais de um ano;
- rolagem horizontal no celular, sem cortar números.

## Lançar despesas
- Exibir somente todas as rubricas manuais mapeadas no HTML; linhas automáticas do BI e checkpoints não entram no formulário.
- Separar os campos nos mesmos grupos da DRE para facilitar o preenchimento.
- Manter troca rápida entre posto e mês.
- Não buscar nem mostrar Receita ou CMV.
- Não calcular nem mostrar Resultado Operacional Bruto, EBITDA ou Resultado Empresa.
- Salvar apenas os valores preenchidos pelo usuário, com máscara monetária brasileira.
- Preservar os lançamentos existentes, mapeando as rubricas atuais para a nova estrutura e iniciando novas rubricas em zero.

## Comparativo entre Postos
- Mostrar todos os postos cadastrados, mesmo os que ainda não possuem despesas lançadas.
- Criar uma simulação determinística e estável por posto e período para Receita, CMV, Despesas, EBITDA, Resultado Empresa e Margem.
- Usar os mesmos valores simulados no ranking, no mapa de margem e na tabela, evitando divergências entre os três componentes.
- Manter seleção de métrica, ordenação e cores positivas/negativas.
- Exibir um aviso discreto de **Dados simulados para demonstração**.
- Não salvar a simulação no banco e não misturá-la com os números reais da Visão Geral ou da DRE Gerencial.

## Dados e fórmulas
- Acrescentar ao banco somente as rubricas manuais ainda ausentes, por migração aditiva, com permissões equivalentes às atuais e sem apagar dados. As linhas automáticas do BI não serão persistidas na tabela de despesas.
- Manter todas as definições de linhas, grupos, sinais, subtotais e fórmulas centralizadas no módulo contábil compartilhado, para painel, formulário e Mia não divergirem.
- Vendas e custos de combustível e mercadorias continuam vindo exclusivamente do BI, agora desmembrados; despesas e demais rubricas manuais continuam vindo dos lançamentos do usuário.
- Ajustar a Mia para compreender os novos nomes e agrupamentos sem alterar sua personalidade, memória ou canal do WhatsApp.

## Validação
- Conferir a ordem e a hierarquia linha a linha contra o HTML.
- Confirmar que as novas rubricas salvam e reaparecem no posto/mês correto.
- Testar fórmulas com valores positivos, negativos e zerados.
- Confirmar que a simulação cobre todos os postos e permanece isolada dos dados reais.
- Validar DRE, formulário e comparativo em computador e celular, além de concluir sem erros de execução.

## Detalhes técnicos
- Evoluir `contabil_ebitda` com colunas para todas as rubricas manuais novas e atualizar validação, leitura e gravação.
- Ampliar a consulta existente do BI, que hoje já calcula combustível e produtos separadamente, para retornar: venda de combustível, custo de combustível, venda de mercadorias, custo de mercadorias, litros e abastecimentos por posto/mês.
- Manter Venda de Serviços visível como no HTML, mas sem inventar dados: a consulta atual exclui outros tipos de item e não há um mapeamento confirmado de serviços; a linha ficará zerada até existir uma origem verificável.
- Refatorar a definição da DRE em `src/lib/ebitda.ts` para representar grupos, linhas de detalhe e checkpoints do HTML.
- Adaptar `DreDashboard` e `EbitdaDialog` para consumir a mesma definição central.
- Gerar os valores simulados no frontend a partir de uma semente estável por posto e mês, sem persistência.
