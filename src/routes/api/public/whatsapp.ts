import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/whatsapp")({
  server: {
    handlers: {
      POST: async () => {
        // Canal Twilio desativado — a Mia agora atende pelo FZAP.
        // Ver integração em /api/public/fzap e tela /integracao-fzap.
        return new Response("Canal Twilio desativado. Use /api/public/fzap.", { status: 410 });
      },
    },
  },
});
