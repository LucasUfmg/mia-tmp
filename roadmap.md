# Roadmap

## Mia no WhatsApp via FZAP (substituindo Twilio)
- [x] Migração: tabelas fzap_eventos + fzap_config (RLS + grants)
- [x] FzapService (src/lib/fzap/service.server.ts): validate/parse/send/handle/receive
- [x] Webhook público /api/public/fzap (GET + POST, anti-loop, dedup)
- [x] Secrets: FZAP_WEBHOOK_TOKEN gerado; faltam FZAP_BASE_URL, FZAP_ADMIN_TOKEN (e FZAP_INSTANCE_TOKEN opcional) — informados pelo usuário
- [x] Tela /integracao-fzap (status, URL webhook, testar, eventos recentes)
- [ ] Desativar rota Twilio /api/public/whatsapp (410)
- [ ] Validar build/preview
