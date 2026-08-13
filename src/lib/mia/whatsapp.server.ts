/** Envio de mensagens pelo WhatsApp via conector Twilio (gateway Lovable). */
const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

export async function enviarWhatsapp(para: string, texto: string): Promise<void> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const twilioKey = process.env["TWILIO_API_KEY"];
  const de = process.env["MIA_WHATSAPP_FROM"];

  if (!lovableKey || !twilioKey || !de) {
    console.error("[Mia:enviarWhatsapp] canal não configurado", {
      lovable: Boolean(lovableKey),
      twilio: Boolean(twilioKey),
      from: Boolean(de),
    });
    return;
  }

  const resposta = await fetch(`${GATEWAY_URL}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": twilioKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      To: para.startsWith("whatsapp:") ? para : `whatsapp:${para}`,
      From: de.startsWith("whatsapp:") ? de : `whatsapp:${de}`,
      Body: texto,
    }),
  });

  if (!resposta.ok) {
    const corpo = await resposta.text();
    console.error(`[Mia:enviarWhatsapp] falhou [${resposta.status}]: ${corpo}`);
  }
}
