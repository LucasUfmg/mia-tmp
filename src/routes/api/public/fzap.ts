import { createFileRoute } from "@tanstack/react-router";

import { handleIncomingMessage, validateWebhook } from "@/lib/fzap/service.server";

export const Route = createFileRoute("/api/public/fzap")({
  server: {
    handlers: {
      // FZAP costuma chamar HEAD/GET para validar o webhook antes de ativar
      GET: async ({ request }) => {
        const url = new URL(request.url);
        if (!validateWebhook(url.searchParams.get("token"))) {
          return new Response("Unauthorized", { status: 401 });
        }
        return new Response("ok", { status: 200 });
      },
      POST: async ({ request }) => {
        const url = new URL(request.url);
        if (!validateWebhook(url.searchParams.get("token"))) {
          return new Response("Unauthorized", { status: 401 });
        }

        let payload: unknown;
        const ct = request.headers.get("content-type") ?? "";
        try {
          if (ct.includes("application/json")) {
            payload = await request.json();
          } else {
            const form = await request.formData();
            payload = Object.fromEntries(form.entries());
          }
        } catch (err) {
          console.error("[FZAP] Payload inválido:", err);
          return new Response("bad request", { status: 400 });
        }

        // Responde 200 imediatamente e processa em background para não estourar
        // o timeout do FZAP. O agente pode demorar (LLM + consultas ao banco).
        handleIncomingMessage(payload).catch((err) => {
          console.error("[FZAP] Falha no processamento assíncrono:", err);
        });
        return new Response("ok", { status: 200 });
      },
    },
  },
});
