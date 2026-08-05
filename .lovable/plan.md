# Exibir o erro completo no dashboard

## Objetivo
Substituir a mensagem genérica “Falha ao atualizar — tentando novamente” pelo erro real recebido durante a atualização dos dados em produção, sem tentar corrigir a causa.

## Alterações
- Capturar o objeto `error` já disponibilizado pela consulta principal do React Query em `src/routes/index.tsx`.
- Repassar esse erro ao componente `LiveStatus`.
- Exibir no dashboard os detalhes disponíveis do erro, incluindo nome, mensagem e stack trace quando existirem.
- Manter a mensagem em uma área legível e quebrável, adequada para copiar o diagnóstico completo.
- Preservar consultas, cache, MongoDB, atualização automática e toda a lógica atual sem alterações.

## Validação
- Simular uma falha de consulta apenas durante a verificação local e confirmar que o conteúdo completo aparece na interface.
- Confirmar que, sem erro, o status e o botão de atualização continuam iguais ao comportamento atual.

## Limite explícito
Nenhuma tentativa de diagnosticar ou resolver a falha de produção fará parte desta implementação.