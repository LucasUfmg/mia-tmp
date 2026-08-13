Configurar Twilio WhatsApp Sandbox para testar a Mia sem pagar

Usuário escolheu começar pelo **Twilio Sandbox grátis**. O app e a Mia já estão prontos; falta só conectar o webhook ao Twilio e instruir o número de teste a entrar no sandbox.

## Passos

1. **Criar/entrar na conta Twilio** (trial é suficiente).
2. **Ativar o Twilio Sandbox para WhatsApp** no console:
   - Copiar o "join code" (ex.: `join xxx-yyy`).
   - Copiar o número de telefone do sandbox (um número WhatsApp estrangeiro, geralmente +1...).
3. **Cadastrar o webhook de mensagens recebidas**:
   - Método: `POST`.
   - URL: `https://project--ce6c826b-f1f6-471c-afac-fe3e194fda19.lovable.app/api/public/whatsapp?token=mia-flex-2026` (preview) ou `https://mia-tmp.lovable.app/api/public/whatsapp?token=mia-flex-2026` (produção publicada).
4. **Liberar o número de teste** no sandbox: enviar do celular `+55 31 99293-2316` uma mensagem com o `join code` para o número do sandbox.
5. **Testar a Mia** enviando "ajuda" no WhatsApp.
6. **Avisar limitações do sandbox**:
   - Apenas números que enviaram o `join code` conseguem interagir.
   - Cada sessão de sandbox expira (24h ou 72h) e precisa reenviar o join code.
   - Mensagens no trial podem vir com o prefixo "Sent from your Twilio trial account".
7. **(Opcional) Preparar transição para produção paga**: listar documentos e passos para enviar um número próprio (WhatsApp Business API), mas não executar sem aprovação do usuário.

## Detalhes técnicos

- O webhook usa TwiML para responder dentro da mesma requisição, então não há custo de envio no sandbox além da taxa padrão do WhatsApp (gratuita no sandbox trial).
- O `MIA_WEBHOOK_TOKEN` já está configurado.
- O número `+55 31 99293-2316` já está autorizado na Mia com acesso à rede inteira e limite de 50 perguntas/dia.

## Entregáveis

- Instruções práticas para o usuário configurar sozinho no Twilio.
- Mensagem de boas-vindas e lista de limitações do sandbox para enviar ao investidor/testadores.
