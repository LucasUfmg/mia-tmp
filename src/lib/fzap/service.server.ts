/**
 * FzapService — camada única de comunicação com o FZAP.
 * Todas as chamadas HTTP ao FZAP ficam aqui. Nada disso vai para o frontend.
 *
 * O FZAP é distribuído como imagem Docker (dncarbonell/fzap) e a doc pública
 * documenta a stack e o ADMIN_TOKEN, mas não o formato exato do payload de
 * webhook nem a rota de envio de cada versão. Por isso o parser é tolerante às
 * variações comuns dessa família de API (event.Info.* / data.key.* / message.*)
 * e o envio tenta a rota de texto padrão com fallback. Todo evento recebido é
 * salvo cru em fzap_eventos, então no primeiro webhook real ajustamos os
 * campos em minutos sem mexer no agente.
 */
import type { Contato } from "../mia/store.server";
import { buscarContato, mensagensHoje, normalizarTelefone, registrar } from "../mia/store.server";
import { TEXTO_AJUDA, atalho, responderPergunta, resumoDoDia } from "../mia/agent.server";

export type FzapEvento = {
  instanceId: string | null;
  phone: string | null;
  name: string | null;
  messageId: string | null;
  type: "texto" | "audio" | "imagem" | "documento" | "video" | "desconhecido";
  text: string | null;
  fromMe: boolean;
  raw: unknown;
};

export type WebhookResultado = {
  status: "ignorado" | "processado" | "erro";
  motivo?: string;
  resposta?: string;
};

/* ----------------------------- validação ----------------------------- */

/** Compara o token recebido com o esperado de tamanho fixo (anti timing). */
export function validateWebhook(recebido: string | null): boolean {
  const esperado = process.env["FZAP_WEBHOOK_TOKEN"];
  if (!esperado || !recebido || recebido.length !== esperado.length) return false;
  let diff = 0;
  for (let i = 0; i < esperado.length; i += 1) diff |= esperado.charCodeAt(i) ^ recebido.charCodeAt(i);
  return diff === 0;
}

/* ------------------------------ parser ------------------------------- */

function asBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v.toLowerCase() === "true";
  return Boolean(v);
}

function pickStr(...vals: unknown[]): string | null {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

/**
 * Parser tolerante. Considera dois formatos principais:
 *  A) { event: "message", data: { key: { remoteJid, fromMe, id }, pushName, message: { conversation | extendedTextMessage.text | ... } } }
 *  B) { event: { Info: { Sender, IsFromMe, PushName, ID }, Message: { conversation | extendedTextMessage.text }, ... } }
 * Também aceita payload "achatado" com campos no topo.
 */
export function parseIncomingMessage(payload: unknown): FzapEvento {
  const p = (payload ?? {}) as Record<string, unknown>;
  const data = (p["data"] ?? p["event"] ?? p) as Record<string, unknown>;
  const info = (data["Info"] ?? data["key"] ?? data["info"] ?? {}) as Record<string, unknown>;
  const message = (data["message"] ?? data["Message"] ?? p["message"] ?? {}) as Record<string, unknown>;

  const fromMe = asBool(info["fromMe"] ?? info["IsFromMe"] ?? data["fromMe"] ?? p["fromMe"]);

  // Telefone: remoteJid costuma vir como "5511999999999@s.us"
  const jid = pickStr(info["remoteJid"], info["Sender"], data["remoteJid"], data["from"], p["from"]);
  const phone = jid ? normalizarTelefone((jid.split("@")[0] ?? jid) as string) : null;

  const name = pickStr(info["pushName"], info["PushName"], data["pushName"], data["notifyName"], p["pushName"]);
  const messageId = pickStr(info["id"], info["ID"], data["id"], p["id"], p["messageId"]);

  // Conteúdo de texto — variações comuns
  const text =
    pickStr(
      message["conversation"],
      (message["extendedTextMessage"] as Record<string, unknown>)?.["text"],
      (message["extendedTextMessage"] as Record<string, unknown>)?.["matchedText"],
      message["text"],
      message["Text"],
      data["text"],
      data["body"],
      p["body"],
      p["text"],
    ) ?? null;

  let type: FzapEvento["type"] = "desconhecido";
  if (text != null) type = "texto";
  else if (message["audioMessage"] || message["AudioMessage"]) type = "audio";
  else if (message["imageMessage"] || message["ImageMessage"]) type = "imagem";
  else if (message["documentMessage"] || message["DocumentMessage"]) type = "documento";
  else if (message["videoMessage"] || message["VideoMessage"]) type = "video";

  const instanceId = pickStr(
    data["instanceId"] as string | undefined,
    data["instance"] as string | undefined,
    p["instanceId"] as string | undefined,
    p["instance"] as string | undefined,
    info["instanceId"] as string | undefined,
  );

  return { instanceId, phone, name, messageId, type, text, fromMe, raw: payload };
}

/* --------------------------- persistência ---------------------------- */

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

type EventoRow = {
  event_type: string | null;
  instance_id: string | null;
  phone: string | null;
  message_id: string | null;
  from_me: boolean;
  result: string;
  error: string | null;
  payload: ReturnType<typeof JSON.parse>;
};

/** Salva o evento bruto + resultado. Devolve false se for duplicata (mesmo message_id). */
export async function receiveWebhook(ev: FzapEvento, eventType: string | null): Promise<boolean> {
  const db = await admin();
  const row: EventoRow = {
    event_type: eventType,
    instance_id: ev.instanceId,
    phone: ev.phone,
    message_id: ev.messageId,
    from_me: ev.fromMe,
    result: "received",
    error: null,
    payload: ev.raw,
  };
  const { error } = await db.from("fzap_eventos").insert(row);
  if (error) {
    // 23505 = unique violation (message_id duplicado) -> reenvio do FZAP
    if (error.code === "23505") {
      console.log("[FZAP] Mensagem duplicada ignorada:", ev.messageId);
      return false;
    }
    console.error("[FZAP:receiveWebhook]", error.message);
  }
  return true;
}

async function atualizarResultado(messageId: string | null, result: string, erro?: string) {
  if (!messageId) return;
  const db = await admin();
  await db.from("fzap_eventos").update({ result, error: erro ?? null }).eq("message_id", messageId);
}

/* ------------------------------ envio -------------------------------- */

/** Monta o header de auth: token da instância se houver, senão o admin token. */
function authHeaders(): Record<string, string> {
  const adminToken = process.env["FZAP_ADMIN_TOKEN"];
  const instanceToken = process.env["FZAP_INSTANCE_TOKEN"];
  const token = instanceToken || adminToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function baseUrl(): string | null {
  const url = process.env["FZAP_BASE_URL"];
  if (!url) {
    console.error("[FZAP] FZAP_BASE_URL não configurada");
    return null;
  }
  return url.replace(/\/$/, "");
}

/** Limpa o telefone para o formato que o FZAP espera (dígitos, com DDI). */
function destino(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Envia uma mensagem de texto pelo FZAP. Tenta a rota de envio padrão dessa
 * família de API e, se não existir, tenta variações comuns. Loga o resultado.
 */
export async function sendTextMessage(
  instanceId: string | null,
  phone: string,
  message: string,
): Promise<boolean> {
  const base = baseUrl();
  if (!base) return false;

  const number = destino(phone);
  const rotas = [
    `/chat/send/text/${number}`,
    `/message/sendText`,
    `/send-message`,
    `/chat/send/text`,
  ];
  const headers = { ...authHeaders(), "Content-Type": "application/json" };

  for (const rota of rotas) {
    const url = `${base}${rota}`;
    const body =
      rota.includes(number)
        ? JSON.stringify({ text: message })
        : JSON.stringify({ number, text: message, message });
    console.log("[FZAP] Enviando resposta ->", rota);
    try {
      const res = await fetch(url, { method: "POST", headers, body });
      if (res.ok) {
        console.log("[FZAP] Mensagem enviada [", res.status, "]");
        return true;
      }
      // 404 -> rota não existe, tenta próxima
      if (res.status === 404) continue;
      const corpo = await res.text().catch(() => "");
      console.error(`[FZAP] Envio falhou [${res.status}] em ${rota}: ${corpo.slice(0, 200)}`);
      // outros erros: para de tentar
      return false;
    } catch (err) {
      console.error(`[FZAP] Erro de rede em ${rota}:`, err);
      continue;
    }
  }
  console.error("[FZAP] Nenhuma rota de envio funcionou");
  return false;
}

/* -------------------------- orquestração ----------------------------- */

/** Orquestra o processamento completo de um payload recebido do FZAP. */
export async function handleIncomingMessage(payload: unknown): Promise<WebhookResultado> {
  console.log("[FZAP] Webhook recebido");
  const ev = parseIncomingMessage(payload);
  const p = (payload ?? {}) as Record<string, unknown>;
  const eventType = typeof p["event"] === "string" ? (p["event"] as string) : null;
  console.log("[FZAP] Evento identificado:", eventType ?? "(sem tipo)");

  // Anti-loop: mensagens enviadas pelo próprio sistema
  if (ev.fromMe) {
    console.log("[FZAP] Mensagem fromMe ignorada (anti-loop)");
    await receiveWebhook(ev, eventType).catch(() => {});
    await atualizarResultado(ev.messageId, "ignorado", "fromMe");
    return { status: "ignorado", motivo: "fromMe" };
  }

  // Só processamos texto por enquanto
  if (ev.type !== "texto" || !ev.text) {
    console.log("[FZAP] Evento ignorado (não é texto):", ev.type);
    await receiveWebhook(ev, eventType).catch(() => {});
    await atualizarResultado(ev.messageId, "ignorado", `tipo=${ev.type}`);
    if (ev.phone && ev.type !== "desconhecido") {
      await sendTextMessage(
        ev.instanceId,
        ev.phone,
        "Por enquanto eu só consigo ler mensagens de texto. Pode digitar sua pergunta?",
      ).catch(() => {});
    }
    return { status: "ignorado", motivo: `tipo=${ev.type}` };
  }

  // Deduplicação por message_id
  const unico = await receiveWebhook(ev, eventType).catch(() => true);
  if (!unico) {
    await atualizarResultado(ev.messageId, "ignorado", "duplicado");
    return { status: "ignorado", motivo: "duplicado" };
  }

  if (!ev.phone) {
    await atualizarResultado(ev.messageId, "ignorado", "sem telefone");
    return { status: "ignorado", motivo: "sem telefone" };
  }
  if (ev.text.length > 500) {
    const aviso = "Sua pergunta ficou muito longa. Pode resumir em uma frase?";
    await sendTextMessage(ev.instanceId, ev.phone, aviso).catch(() => {});
    await atualizarResultado(ev.messageId, "ignorado", "muito longa");
    return { status: "ignorado", motivo: "muito longa" };
  }

  console.log("[FZAP] Mensagem recebida de", `${ev.phone.slice(0, 4)}****${ev.phone.slice(-4)}`);

  // Mesmas regras do canal Twilio atual
  const contato = (await buscarContato(ev.phone)) as Contato | null;
  if (!contato || !contato.ativo) {
    console.warn("[FZAP] número não autorizado");
    const recusa =
      "Olá! Este número ainda não está liberado para consultar os dados da RedeFlex. Peça ao administrador da rede para cadastrar este WhatsApp e tente novamente.";
    await sendTextMessage(ev.instanceId, ev.phone, recusa).catch(() => {});
    await atualizarResultado(ev.messageId, "ignorado", "nao autorizado");
    return { status: "ignorado", motivo: "nao autorizado" };
  }

  const chave = contato.telefone || ev.phone;
  const usadas = await mensagensHoje(chave);
  if (usadas >= contato.limite_diario) {
    const aviso = `Você já usou as ${contato.limite_diario} consultas do dia. Amanhã liberamos novas perguntas.`;
    await sendTextMessage(ev.instanceId, ev.phone, aviso).catch(() => {});
    await atualizarResultado(ev.messageId, "ignorado", "limite diario");
    return { status: "ignorado", motivo: "limite diario" };
  }

  await registrar(chave, "user", ev.text);

  try {
    console.log("[AGENT] Processando mensagem");
    const comando = atalho(ev.text);
    let resposta: string;
    if (comando === "ajuda") {
      resposta = TEXTO_AJUDA;
    } else if (comando === "resumo") {
      resposta = await resumoDoDia({ ibms: contato.ibms ?? [] });
      await registrar(chave, "assistant", resposta);
    } else {
      resposta = await responderPergunta(contato, ev.text);
    }
    console.log("[AGENT] Resposta gerada");
    await sendTextMessage(ev.instanceId, ev.phone, resposta);
    await atualizarResultado(ev.messageId, "processado");
    return { status: "processado", resposta };
  } catch (err) {
    console.error("[AGENT] Erro:", err);
    const fallback = "Tive um problema para consultar os dados agora. Tente de novo em alguns instantes.";
    await sendTextMessage(ev.instanceId, ev.phone, fallback).catch(() => {});
    await atualizarResultado(ev.messageId, "erro", String(err));
    return { status: "erro", motivo: String(err) };
  }
}
