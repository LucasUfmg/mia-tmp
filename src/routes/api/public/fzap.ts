import { createFileRoute } from "@tanstack/react-router";

/**
 * Canal FZAP EM ESPERA (desligado).
 *
 * O canal ativo da Mia voltou a ser o Twilio (/api/public/whatsapp).
 * Todo o código do FZAP continua no projeto:
 *   - src/lib/fzap/service.server.ts  (validate/parse/send/handle/receive)
 *   - src/lib/fzap/fzap.functions.ts  (status, eventos, teste de envio)
 *   - tela /integracao-fzap
 *
 * Para religar: descomente o bloco abaixo, remova os handlers 410,
 * confirme os secrets FZAP_BASE_URL / FZAP_ADMIN_TOKEN / FZAP_WEBHOOK_TOKEN
 * e aponte o webhook do FZAP para /api/public/fzap?token=<FZAP_WEBHOOK_TOKEN>.
 */

// import { handleIncomingMessage, validateWebhook } from "@/lib/fzap/service.server";
//
// GET: async ({ request }) => {
//   const url = new URL(request.url);
//   if (!validateWebhook(url.searchParams.get("token"))) {
//     return new Response("Unauthorized", { status: 401 });
//   }
//   return new Response("ok", { status: 200 });
// },
// POST: async ({ request }) => {
//   const url = new URL(request.url);
//   if (!validateWebhook(url.searchParams.get("token"))) {
//     return new Response("Unauthorized", { status: 401 });
//   }
//
//   let payload: unknown;
//   const ct = request.headers.get("content-type") ?? "";
//   try {
//     if (ct.includes("application/json")) {
//       payload = await request.json();
//     } else {
//       const form = await request.formData();
//       payload = Object.fromEntries(form.entries());
//     }
//   } catch (err) {
//     console.error("[FZAP] Payload inválido:", err);
//     return new Response("bad request", { status: 400 });
//   }
//
//   // Responde 200 imediatamente e processa em background.
//   handleIncomingMessage(payload).catch((err) => {
//     console.error("[FZAP] Falha no processamento assíncrono:", err);
//   });
//   return new Response("ok", { status: 200 });
// },

const EM_ESPERA = "Canal FZAP em espera. A Mia atende pelo Twilio em /api/public/whatsapp.";

export const Route = createFileRoute("/api/public/fzap")({
  server: {
    handlers: {
      GET: async () => new Response(EM_ESPERA, { status: 410 }),
      POST: async () => new Response(EM_ESPERA, { status: 410 }),
    },
  },
});
