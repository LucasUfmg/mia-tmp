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
      POST: async ({ request }) => {
        const url = new URL(request.url);
        if (!tokenValido(url.searchParams.get("token"))) {
          return new Response("Unauthorized", { status: 401 });
        }

        const form = await request.formData();
        const de = String(form.get("From") ?? "");
        const corpo = String(form.get("Body") ?? "").trim();
        const telefone = normalizarTelefone(de);

        if (!telefone || !corpo) return new Response("ok");
        if (corpo.length > 500) {
          return twiml("Sua pergunta ficou muito longa. Pode resumir em uma frase?");
        }

        const contato = await buscarContato(telefone);
        if (!contato || !contato.ativo) {
          console.warn(
            "[Mia:webhook] número não autorizado:",
            `${telefone.slice(0, 4)}****${telefone.slice(-4)}`,
          );
          return twiml(
            "Olá! Este número ainda não está liberado para consultar os dados da RedeFlex. Peça ao administrador da rede para cadastrar este WhatsApp e tente novamente.",
          );
        }

        const chave = contato.telefone || telefone;
        const usadas = await mensagensHoje(chave);
        if (usadas >= contato.limite_diario) {
          return twiml(
            `Você já usou as ${contato.limite_diario} consultas do dia. Amanhã liberamos novas perguntas.`,
          );
        }

        await registrar(chave, "user", corpo);

        try {
          const comando = atalho(corpo);
          if (comando === "ajuda") return twiml(TEXTO_AJUDA);
          if (comando === "resumo") {
            const resumo = await resumoDoDia({ ibms: contato.ibms ?? [] });
            await registrar(chave, "assistant", resumo);
            return twiml(resumo);
          }
          return twiml(await responderPergunta(contato, corpo));
        } catch (erro) {
          console.error("[Mia:webhook]", erro);
          return twiml(
            "Tive um problema para consultar os dados agora. Tente de novo em alguns instantes.",
          );
        }
      },
    },
  },
});
