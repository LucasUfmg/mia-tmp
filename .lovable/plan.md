# DRE Gerencial fiel ao HTML e comparativo simulado

## Resultado esperado
- Reproduzir na aba **DRE Gerencial** a hierarquia, a ordem das linhas e o tratamento visual do HTML enviado, mantendo a identidade RedeFlex e a barra lateral atual.
- Atualizar **Lançar despesas** para conter todas as rubricas manuais exibidas nessa DRE, sem fazer cálculos nem mostrar Receita, CMV, EBITDA ou totais dentro da janela.
- Preencher **Comparativo entre Postos** com uma simulação consistente para todos os postos, claramente identificada como demonstração e sem gravar dados fictícios no banco.

## DRE Gerencial
A tabela seguirá a estrutura do modelo:

1. **Total Receita**
   - Receita bruta do BI, preservando-a como informação automática e não editável.
   - Descontos e Acréscimos como linhas separadas.
2. **Impostos sobre Faturamento**
3. **Custo**
   - CMV do BI, automático e não editável.
   - Bônus de Performance e Frete.
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
   - Despesas Financeiras
   - Despesas Não Operacionais
   - Bônus de Contrato
8. **IRPJ e CSLL**
   - IRPJ e CSLL
   - Sócios (Retiradas/Pró-labore)
   - Distribuição de Lucros
   - Investimentos
9. **Resultado Empresa**

A tabela terá:
- grupos e subtotais com o mesmo destaque do HTML;
- linhas internas recuadas;
- valores positivos em verde e negativos em vermelho;
- valor e análise vertical para cada mês;
- comparação nominal e percentual quando dois meses forem selecionados;
- totais anuais quando houver meses de mais de um ano;
- rolagem horizontal no celular, sem cortar números.

## Lançar despesas
- Exibir somente as rubricas manuais da DRE acima.
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
- Acrescentar ao banco somente as rubricas ainda ausentes, por migração aditiva, com permissões equivalentes às atuais e sem apagar dados.
- Manter todas as definições de linhas, grupos, sinais, subtotais e fórmulas centralizadas no módulo contábil compartilhado, para painel, formulário e Mia não divergirem.
- Receita e CMV continuam vindo exclusivamente do BI; despesas continuam vindo dos lançamentos do usuário.
- Ajustar a Mia para compreender os novos nomes e agrupamentos sem alterar sua personalidade, memória ou canal do WhatsApp.

## Validação
- Conferir a ordem e a hierarquia linha a linha contra o HTML.
- Confirmar que as novas rubricas salvam e reaparecem no posto/mês correto.
- Testar fórmulas com valores positivos, negativos e zerados.
- Confirmar que a simulação cobre todos os postos e permanece isolada dos dados reais.
- Validar DRE, formulário e comparativo em computador e celular, além de concluir sem erros de execução.

## Detalhes técnicos
- Evoluir `contabil_ebitda` com colunas para as rubricas novas e atualizar validação, leitura e gravação.
- Refatorar a definição da DRE em `src/lib/ebitda.ts` para representar grupos, linhas de detalhe e checkpoints do HTML.
- Adaptar `DreDashboard` e `EbitdaDialog` para consumir a mesma definição central.
- Gerar os valores simulados no frontend a partir de uma semente estável por posto e mês, sem persistência.
