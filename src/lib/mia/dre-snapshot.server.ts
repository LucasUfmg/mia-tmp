/**
 * Consolidado da DRE Gerencial gravado no banco: a Mia lê em ~50 ms em vez de
 * reagregar o BI. Mês corrente é regravado quando passa de VALIDADE_MS.
 */
import { lerDetalheEbitda } from "./contabil.server";

const VALIDADE_MS = 30 * 60_000;
type Opcoes = { periodo: "mes" | "ano"; mes?: string; ibms?: string[] };
type Dados = Record<string, unknown>;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function mesSp() {
  return new Date(Date.now() - 3 * 3_600_000).toISOString().slice(0, 7);
}

export function chaveSnapshot(o: Opcoes) {
  const mes = o.mes ?? mesSp();
  const ibms = o.ibms?.length ? [...o.ibms].sort().join(",") : "REDE";
  return `${o.periodo}|${mes}|${ibms}`;
}

/** Recalcula pelo mesmo cálculo da aba Contábil e grava. */
export async function gravarSnapshot(o: Opcoes): Promise<Dados> {
  const { _somas: _, ...d } = (await lerDetalheEbitda(o)) as Dados;
  if (!d["semCalculo"] && !d["avisoBiIndisponivel"]) {
    const db = await admin();
    const { error } = await db
      .from("dre_snapshots")
      .upsert({ chave: chaveSnapshot(o), dados: d as never, atualizado_em: new Date().toISOString() });
    if (error) console.warn("[Mia:snapshot] gravação falhou", error.message);
  }
  return d;
}

/** Lê o consolidado gravado; recalcula só se não existir ou estiver vencido (mês corrente). */
export async function lerSnapshot(o: Opcoes): Promise<Dados & { atualizadoEm?: string }> {
  try {
    const db = await admin();
    const { data } = await db.from("dre_snapshots").select("dados, atualizado_em").eq("chave", chaveSnapshot(o)).maybeSingle();
    if (data?.dados) {
      const mes = o.mes ?? mesSp();
      const corrente = mes >= mesSp();
      const idade = Date.now() - new Date(data.atualizado_em).getTime();
      if (!corrente || idade < VALIDADE_MS) return { ...(data.dados as Dados), atualizadoEm: data.atualizado_em };
      // Vencido: responde já com o gravado e atualiza em segundo plano.
      void gravarSnapshot(o).catch(() => undefined);
      return { ...(data.dados as Dados), atualizadoEm: data.atualizado_em };
    }
  } catch (e) {
    console.warn("[Mia:snapshot] leitura falhou", e);
  }
  return gravarSnapshot(o);
}
