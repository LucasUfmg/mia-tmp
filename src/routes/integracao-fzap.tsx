import { createFileRoute } from "@tanstack/react-router";

/**
 * Tela do FZAP EM ESPERA.
 *
 * O canal ativo é o Twilio (/api/public/whatsapp). A versão completa desta
 * tela (status, URL do webhook, teste de envio, eventos recentes) está
 * preservada em src/lib/fzap/integracao-fzap.page.disabled.txt — basta
 * colar de volta aqui para religar a integração.
 */

export const Route = createFileRoute("/integracao-fzap")({
  head: () => ({
    meta: [
      { title: "Integração FZAP em espera — Mia | RedeFlex" },
      {
        name: "description",
        content:
          "A integração da Mia com o FZAP está pausada. O atendimento no WhatsApp segue pelo Twilio.",
      },
      { property: "og:title", content: "Integração FZAP em espera — Mia" },
      {
        property: "og:description",
        content: "Canal FZAP pausado; a Mia atende pelo WhatsApp via Twilio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IntegracaoFzapPage,
});

function IntegracaoFzapPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6 py-16">
      <h1 className="text-2xl font-semibold text-foreground">Integração FZAP em espera</h1>
      <p className="text-muted-foreground">
        A Mia voltou a atender pelo WhatsApp através do Twilio, com os mesmos números liberados,
        a mesma memória de conversa e o mesmo limite diário de perguntas.
      </p>
      <p className="text-muted-foreground">
        Toda a preparação do FZAP continua guardada no projeto e pode ser reativada quando você
        quiser, sem precisar refazer nada.
      </p>
    </main>
  );
}
