# Atualizar o manual, remover páginas antigas e corrigir o mapa

## Objetivo
Deixar o Manual da Plataforma alinhado à versão atual do RedeFlex, remover totalmente as páginas públicas **Agente** e **Integração FZAP**, e restaurar o fundo cartográfico do mapa sem exigir chave de API.

## Alterações

### 1. Manual completo da plataforma
- Reestruturar o manual para cobrir as duas áreas atuais da navegação: **Visão Geral** e **Contábil**.
- Manter e revisar a explicação da Visão Geral: diário e mensal, comparação no mesmo horário/período, projeções, indicadores, combustíveis, produtos, gráficos, filtro de postos, mapa e atualização automática.
- Adicionar uma seção completa da aba Contábil, incluindo:
  - filtros por posto/rede, mês, ano e acumulado do ano;
  - abas **Visão Geral**, **DRE Gerencial** e **Comparativo entre Postos**;
  - os seis números principais: Receita bruta, CMV, Resultado Operacional Bruto, Despesas totais, EBITDA e Resultado final;
  - gráficos de evolução da receita, composição das despesas e resultado mensal;
  - leitura da DRE, análise vertical e cores para valores positivos/negativos;
  - ranking e comparação entre postos;
  - fluxo **Lançar despesas**, explicando que Receita e CMV vêm automaticamente do BI e não podem ser editados;
  - categorias de despesas e salvamento automático dos resultados no lançamento contábil;
  - fluxo **Lançar dados contábeis**, campos derivados do cálculo e campos preenchidos pelo usuário.
- Atualizar título e descrição da página do manual para mencionar também a área Contábil.
- Preservar o botão de baixar/imprimir o manual e adaptar a organização para leitura em tela e PDF.

### 2. Remover Agente e Integração FZAP
- Excluir as páginas `/agente` e `/integracao-fzap`, conforme escolhido, para que esses endereços deixem de existir.
- Remover os arquivos visuais e conteúdos usados exclusivamente por essas páginas, após conferir que não são compartilhados pelo painel.
- Manter intactos o atendimento atual da Mia pelo WhatsApp, sua personalidade, memória, ferramentas contábeis e a rota ativa do Twilio.
- Manter o código de integração FZAP já pausado no backend, pois ele não é uma aba visível e sua remoção não foi solicitada; apenas a página pública será eliminada.
- Deixar a navegação somente com **Visão Geral**, **Contábil** e **Manual da plataforma**, como já aparece hoje.

### 3. Corrigir “API required” no mapa
- Substituir o fundo CARTO atual, que foi confirmado retornando uma imagem de bloqueio “API required”, por blocos públicos do OpenStreetMap que não exigem chave.
- Manter o MapLibre, os marcadores, cores por M/LT, balões, enquadramento da rede e seleção de posto exatamente como estão.
- Atualizar a atribuição visível do mapa para o novo provedor.
- Melhorar a mensagem de falha para não exibir texto técnico bruto do provedor ao usuário.

## Validação
- Conferir que `/agente` e `/integracao-fzap` não existem mais e que nenhuma navegação aponta para elas.
- Abrir o manual em desktop e celular, validar todos os conteúdos e testar a impressão/download em PDF.
- Abrir a Visão Geral e confirmar que o mapa mostra ruas e bairros, sem “API required”, mantendo marcadores e interações.
- Validar a aba Contábil e seus dois formulários para garantir que a documentação corresponde ao comportamento real.
- Confirmar que a aplicação continua sem erros após a remoção das páginas.
