# Atualização da aba Contábil para o dashboard DRE

## Objetivo
Transformar a aba **Contábil** no dashboard do modelo anexado, mantendo a identidade RedeFlex, a barra lateral existente e toda a integração já construída com os dados reais do BI e os lançamentos contábeis.

A entrega terá três visões dentro da própria aba:

1. **Visão Geral**
2. **DRE Gerencial**
3. **Comparativo entre Postos**

A seção “Análise & Decisões” do modelo não será incluída.

## Dados e preenchimento
- Manter **receita bruta/vendas e custo/CMV** vindos automaticamente do BI, atualizados por posto e período, em azul claro e sem permissão de edição.
- Tornar editáveis por posto e mês as rubricas do modelo: descontos/acréscimos, falta/sobra, administrativas, financeiras, não contábeis, trabalhistas, tributárias, outras operacionais, outras receitas não operacionais, bônus de performance, rateios e bônus de contrato.
- Reaproveitar os valores e campos equivalentes já salvos na calculadora de EBITDA, sem apagar dados existentes.
- Acrescentar no banco somente as rubricas ainda ausentes, com validação, leitura e gravação no mesmo fluxo contábil atual.
- Recalcular automaticamente lucro bruto, despesas totais, EBITDA, resultado final, lucro líquido e margens a partir das linhas da DRE.
- Preservar os campos atuais de patrimônio, dívida, caixa, alíquota e WACC para os indicadores ROE e ROIC.

## Interface
### Visão Geral
- Cards principais de receita bruta, lucro bruto, EBITDA, resultado final, margem EBITDA e margem líquida.
- Gráfico de evolução mensal da receita.
- Gráfico de composição das despesas.
- Gráfico do resultado final mensal.
- Ranking das maiores contas de despesa.

### DRE Gerencial
- Tabela hierárquica com as linhas, subtotais e resultados do modelo anexado.
- Seleção de um ou mais meses para comparação lado a lado.
- Análise vertical de cada linha sobre a receita.
- Ao selecionar dois meses, exibir variação nominal e percentual.
- Edição das despesas em uma janela por posto/mês, usando máscara brasileira e estados de carregamento já existentes.

### Comparativo entre Postos
- Ranking configurável por resultado final, EBITDA, receita, despesas ou margem.
- Mapa mensal de margem por posto, com cores positivas e negativas.
- Tabela comparativa ordenável com receita, CMV, despesas, resultado e margem.

## Integração e compatibilidade
- Manter filtros atuais de rede, múltiplos postos, mês e acumulado do ano.
- Manter o lançamento consolidado “Rede” sem dupla contagem quando ele existir.
- Atualizar as consultas da Mia para responder também com as novas rubricas e resultados da DRE.
- Adaptar o visual do anexo aos componentes, cores e tipografia já usados pela RedeFlex, sem criar uma segunda barra lateral ou copiar dados fictícios do arquivo.
- Garantir uso confortável em computador e celular, incluindo tabelas com rolagem horizontal quando necessário.

## Validação
- Conferir as fórmulas com casos positivos, negativos e valores zerados.
- Confirmar que trocar posto, mês ou visão atualiza todos os cards, gráficos e tabelas.
- Confirmar que campos do BI continuam bloqueados e que despesas editadas persistem após recarregar.
- Testar rede consolidada, posto individual, seleção múltipla e comparação entre dois meses.
- Verificar a tela em desktop e celular, sem sobreposição ou cortes, e concluir sem erros de execução.

## Detalhes técnicos
- Evoluir a estrutura contábil existente por migração aditiva, com permissões e políticas equivalentes às tabelas contábeis atuais.
- Centralizar a definição das linhas e fórmulas da DRE para que formulário, tabela, gráficos e Mia usem a mesma regra.
- Reaproveitar React Query, funções do servidor e Recharts já presentes no projeto.
