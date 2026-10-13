/** Envio assíncrono de mensagens WhatsApp pela API do Twilio (via conector). */
const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

export async function enviarWhatsApp(para: string, de: string, texto: string): Promise<void> {
  const lovable = process.env["LOVABLE_API_KEY"];
  const twilio = process.env["TWILIO_API_KEY"];
  if (!lovable || !twilio) throw new Error("Twilio não configurado");
  // WhatsApp aceita até 1600 caracteres por mensagem: divide se precisar.
  const partes: string[] = [];
  let resto = texto;
  while (resto.length > 1500) {
    const corte = resto.lastIndexOf("\n", 1500);
    const pos = corte > 500 ? corte : 1500;
    partes.push(resto.slice(0, pos));
    resto = resto.slice(pos).trimStart();
  }
  partes.push(resto);
  for (const Body of partes) {
    const r = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovable}`,
        "X-Connection-Api-Key": twilio,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: para, From: de, Body }),
    });
    if (!r.ok) throw new Error(`Twilio [${r.status}]: ${await r.text()}`);
  }
}

/** Mantém o trabalho rodando depois da resposta HTTP (Cloudflare waitUntil). */
export async function emSegundoPlano(tarefa: Promise<unknown>): Promise<void> {
  try {
    const modulo = "cloudflare:workers";
    const cf = (await import(/* @vite-ignore */ modulo)) as { waitUntil?: (p: Promise<unknown>) => void };
    if (typeof cf.waitUntil === "function") {
      cf.waitUntil(tarefa);
      return;
    }
  } catch {
    // Fora do Worker (ambiente local): segue sem aguardar.
  }
  void tarefa;
}
