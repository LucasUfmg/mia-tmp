# Voltar a Mia para o Twilio e deixar o FZAP em espera

O canal ativo volta a ser o Twilio, exatamente como estava antes: mesmos números liberados, mesma memória por telefone, mesmo limite diário. O trabalho do FZAP fica guardado no projeto, desligado e comentado, pronto para ser religado quando você quiser.

## O que será feito

1. **Reativar o webhook do Twilio** em `/api/public/whatsapp`: restaurar a versão anterior do endpoint (validação do token na URL, resposta em TwiML, checagem de número liberado, limite diário, atalhos "ajuda"/"resumo" e o agente atual). Nada do agente, prompt ou memória é alterado.
2. **Números de WhatsApp**: os cadastros em `mia_contatos` nunca foram removidos (seu número e o do Ramon, com as variantes de 9º dígito). Nada a recriar — só voltam a ser usados pelo canal Twilio.
3. **FZAP desligado, porém preservado**:
   - o endpoint `/api/public/fzap` passa a responder 410 com um aviso de "canal em espera", e o corpo original fica comentado dentro do arquivo;
   - `src/lib/fzap/service.server.ts` e `src/lib/fzap/fzap.functions.ts` continuam no projeto, com o código comentado no topo explicando como religar;
   - a tela `/integracao-fzap` continua existindo, mas exibindo um aviso de que a integração está em espera (sem chamar o FZAP).
   - as tabelas `fzap_eventos` / `fzap_config` e os secrets do FZAP ficam como estão — não custam nada paradas.
4. **Roadmap** atualizado marcando o FZAP como pausado.

## Como validar

- Enviar "ajuda" pelo WhatsApp da Mia (Twilio): deve voltar o menu.
- Enviar "resumo": deve voltar os indicadores do dia.

## Detalhes técnicos

- `src/routes/api/public/whatsapp.ts`: restaurado a partir da versão em `HEAD~1` (token `MIA_WEBHOOK_TOKEN`, `twiml()`, `buscarContato`/`mensagensHoje`/`registrar`, `atalho`/`TEXTO_AJUDA`/`resumoDoDia`/`responderPergunta`).
- `src/routes/api/public/fzap.ts`: handlers GET/POST retornam 410; lógica anterior mantida em bloco comentado.
- `src/routes/integracao-fzap.tsx`: renderiza aviso estático de "em espera"; chamadas de dados comentadas para não bater no FZAP.
- Nenhuma migração e nenhuma alteração em `src/lib/mia/*`.
