/** Persistência da Mia: contatos autorizados, histórico e limite diário. */
export type Contato = {
  telefone: string;
  nome: string | null;
  ibms: string[];
  ativo: boolean;
  limite_diario: number;
};

export type Historico = { papel: "user" | "assistant"; texto: string };

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Normaliza para dígitos (aceita `whatsapp:+55...`). */
export function normalizarTelefone(bruto: string): string {
  return bruto.replace(/\D/g, "");
}

/**
 * Variantes de um celular brasileiro: com e sem o 9º dígito depois do DDD.
 * O WhatsApp/Twilio às vezes entrega o número sem o 9.
 */
export function variantesTelefone(telefone: string): string[] {
  const variantes = new Set<string>([telefone]);
  const br = /^55(\d{2})(\d{8,9})$/.exec(telefone);
  if (br) {
    const [, ddd, resto] = br;
    if (resto.length === 8) variantes.add(`55${ddd}9${resto}`);
    if (resto.length === 9 && resto.startsWith("9")) variantes.add(`55${ddd}${resto.slice(1)}`);
  }
  return [...variantes];
}

export async function buscarContato(telefone: string): Promise<Contato | null> {
  const db = await admin();
  const { data, error } = await db
    .from("mia_contatos")
    .select("telefone, nome, ibms, ativo, limite_diario")
    .in("telefone", variantesTelefone(telefone))
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[Mia:buscarContato]", error.message);
    return null;
  }
  return (data as Contato | null) ?? null;
}

/** Mensagens enviadas pelo contato nas últimas 24h (controle de custo). */
export async function mensagensHoje(telefone: string): Promise<number> {
  const db = await admin();
  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await db
    .from("mia_mensagens")
    .select("id", { count: "exact", head: true })
    .eq("telefone", telefone)
    .eq("papel", "user")
    .gte("created_at", desde);
  if (error) {
    console.error("[Mia:mensagensHoje]", error.message);
    return 0;
  }
  return count ?? 0;
}

/** Últimas mensagens em ordem cronológica (histórico curto de propósito). */
export async function historico(telefone: string, limite = 6): Promise<Historico[]> {
  const db = await admin();
  const { data, error } = await db
    .from("mia_mensagens")
    .select("papel, texto")
    .eq("telefone", telefone)
    .order("created_at", { ascending: false })
    .limit(limite);
  if (error) {
    console.error("[Mia:historico]", error.message);
    return [];
  }
  return ((data ?? []) as Historico[]).reverse();
}

export async function registrar(telefone: string, papel: "user" | "assistant", texto: string) {
  const db = await admin();
  const { error } = await db.from("mia_mensagens").insert({ telefone, papel, texto });
  if (error) console.error("[Mia:registrar]", error.message);
}
