/**
 * Cache persistente (banco) para totais de períodos já fechados — não mudam,
 * então a meta da Mia lê em ~50 ms em vez de reagregar o MongoDB.
 * Só grava resultados não nulos. Falhas no cache nunca quebram a consulta.
 */
async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function comCachePersistente<T>(chave: string, fn: () => Promise<T | null>): Promise<T | null> {
  try {
    const db = await admin();
    const { data } = await db.from("mia_cache_periodos").select("dados").eq("chave", chave).maybeSingle();
    if (data?.dados) return data.dados as T;
  } catch (e) {
    console.warn("[Mia:cache] leitura falhou", e);
  }
  const valor = await fn();
  if (valor) {
    admin()
      .then((db) => db.from("mia_cache_periodos").upsert({ chave, dados: valor as never }))
      .then(({ error }) => error && console.warn("[Mia:cache] gravação falhou", error.message))
      .catch(() => undefined);
  }
  return valor;
}

/** Verdadeiro quando a data (YYYY-MM-DD) é anterior a hoje em São Paulo. */
export function periodoFechado(fim: string): boolean {
  const hoje = new Date(Date.now() - 3 * 3_600_000).toISOString().slice(0, 10);
  return fim < hoje;
}
