# Mia no WhatsApp pelo FZAP (substituindo o Twilio)

A Mia continua exatamente como está: mesmo prompt, mesmas ferramentas de dados, mesmo histórico por telefone, mesmas regras de números liberados e limite diário. Muda apenas o canal: o WhatsApp passa a chegar e sair pelo FZAP.

## Fluxo

```text
WhatsApp -> FZAP -> POST /api/public/fzap  (token na URL)
   -> ignora eventos irrelevantes e mensagens enviadas pelo próprio sistema
   -> identifica o contato pelo número (mesma sessão/memória de sempre)
   -> agente atual (responderPergunta / resumo / ajuda)
   -> FzapService.sendTextMessage -> FZAP -> WhatsApp
```

## O que será feito

1. **Camada única de integração** `FzapService` (`src/lib/fzap/service.server.ts`), com `validateWebhook`, `parseIncomingMessage`, `handleIncomingMessage`, `sendTextMessage` e `receiveWebhook`. Nenhuma chamada HTTP ao FZAP fora desse arquivo.
2. **Webhook público** em `src/routes/api/public/fzap.ts`: valida o token, grava o evento bruto para debug, responde 200 rápido e processa a mensagem. Filtra o que não é mensagem de texto recebida.
3. **Anti-loop**: descarta qualquer evento com `fromMe`/`IsFromMe` verdadeiro, eventos de status/entrega, e mensagens cujo `ID` já foi processado (tabela de deduplicação) — reenvio do FZAP não gera resposta dobrada.
4. **Contexto por número**: o telefone normalizado (somente dígitos, com as variantes de 9º dígito que já existem) continua sendo a chave de `mia_contatos` e `mia_mensagens`. Nada de sessão nova por mensagem.
5. **Mesmas regras atuais**: número não cadastrado ou inativo recebe a recusa educada; acima do limite diário recebe o aviso de cota; "ajuda"/"resumo" seguem como atalhos sem custo de IA.
6. **Twilio desativado**: a rota `/api/public/whatsapp` deixa de responder (retorna 410 com aviso) e `whatsapp.server.ts` sai do caminho de envio. O agente não é tocado.
7. **Mídias**: texto agora; o parser já devolve `tipo` (audio/imagem/documento/video) e o serviço responde "por enquanto só entendo texto" nesses casos, deixando o ponto de extensão pronto.
8. **Logs** com os prefixos pedidos (`[FZAP] Webhook recebido`, `[FZAP] Evento identificado`, `[FZAP] Mensagem recebida`, `[AGENT] Processando mensagem`, `[AGENT] Resposta gerada`, `[FZAP] Enviando resposta`, `[FZAP] Mensagem enviada`) mais gravação em banco para a tela de configuração.
9. **Tela de configuração** em `/integracao-fzap`: status da integração, base URL, instância, URL do webhook com botão copiar, último webhook recebido, botão "Testar integração" (envia uma mensagem de teste para um número) e os últimos eventos/erros.

## Banco (Lovable Cloud)

- `fzap_eventos`: payload bruto, tipo de evento, telefone, id da mensagem, resultado (processado/ignorado/erro), mensagem de erro, data. Serve para debug, deduplicação e para a tela de status.
- `fzap_config`: base URL exibida, id/nome da instância e último teste. Sem credenciais.
- Ambas com RLS e GRANTs; leitura apenas pela tela de configuração; escrita só pelo backend.

## Secrets

- `FZAP_BASE_URL` — URL da sua instalação do FZAP (ex.: `https://api.seudominio.com.br`).
- `FZAP_ADMIN_TOKEN` — o `ADMIN_TOKEN` da stack do FZAP.
- `FZAP_INSTANCE_TOKEN` — token da instância que envia (se a sua instalação usa token por instância; se não usar, fica vazio e usamos o admin).
- `FZAP_WEBHOOK_TOKEN` — segredo gerado por nós, exigido na URL do webhook.

Tudo lido apenas dentro dos handlers no servidor; nada vai para o frontend.

## Detalhe técnico honesto

O FZAP é distribuído como imagem Docker (`dncarbonell/fzap`) e a página de instalação documenta a stack e o `ADMIN_TOKEN`, mas não o formato exato do payload de webhook nem a rota de envio da sua versão. Então o parser será tolerante às variações comuns dessa família de API (`event.Info.Sender`/`IsFromMe`/`PushName`/`ID`, ou `data.key.remoteJid`/`fromMe`/`pushName`, texto em `conversation` / `extendedTextMessage.text` / `message.text`), e o envio tenta a rota de texto padrão com fallback. Todo evento recebido fica salvo cru em `fzap_eventos`, então no primeiro webhook real eu confirmo os campos e ajusto o parser em minutos, sem mexer no agente.

## Documentação entregue no final

URL do webhook para colar no FZAP, quais eventos ativar, secrets necessários, como testar envio e recebimento e onde ver os logs — no fim da implementação e resumido na própria tela `/integracao-fzap`.
