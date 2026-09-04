import { createFileRoute } from "@tanstack/react-router";

import {
  TEXTO_AJUDA,
  atalho,
  responderPergunta,
  resumoDoDia,
} from "@/lib/mia/agent.server";
import { buscarContato, mensagensHoje, normalizarTelefone, registrar } from "@/lib/mia/store.server";

function twiml(texto: string): Response {
  const escapado = texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapado}</Message></Response>`,
    { headers: { "Content-Type": "text/xml; charset=utf-8" } },
  );
}

/** Comparação de tamanho fixo para o token do webhook. */
function tokenValido(recebido: string | null): boolean {
  const esperado = process.env["MIA_WEBHOOK_TOKEN"];
  if (!esperado || !recebido || recebido.length !== esperado.length) return false;
  let diferenca = 0;
  for (let i = 0; i < esperado.length; i += 1) {
    diferenca |= esperado.charCodeAt(i) ^ recebido.charCodeAt(i);
  }
  return diferenca === 0;
}

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
