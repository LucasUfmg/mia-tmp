import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Status da integração FZAP para a tela de configuração. */
export type FzapStatus = {
  configurado: boolean;
  baseUrl: string | null;
  webhookUrl: string | null;
  webhookTokenConfigurado: boolean;
  adminTokenConfigurado: boolean;
  instanceTokenConfigurado: boolean;
  config: {
    instance_id: string | null;
    instance_name: string | null;
    last_test_at: string | null;
    last_test_result: string | null;
  } | null;
  ultimoEvento: {
    received_at: string;
    result: string;
    phone: string | null;
    error: string | null;
  } | null;
};

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function originDoRequest(): string | null {
  // Em SSR/server route não há window; usamos a URL publicada estável quando
  // disponível. A tela usa window.location.origin no frontend para mostrar.
  return null;
}

export const getFzapStatus = createServerFn({ method: "GET" }).handler(async () => {
  const baseUrl = process.env["FZAP_BASE_URL"] ?? null;
  const webhookToken = process.env["FZAP_WEBHOOK_TOKEN"] ?? null;

  const db = await admin();
  const [{ data: configRow }, { data: ultimo }] = await Promise.all([
    db.from("fzap_config").select("instance_id, instance_name, last_test_at, last_test_result").limit(1).maybeSingle(),
    db
      .from("fzap_eventos")
      .select("received_at, result, phone, error")
      .order("received_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const status: FzapStatus = {
    configurado: Boolean(baseUrl && process.env["FZAP_ADMIN_TOKEN"]),
    baseUrl,
    // A URL pública é montada no frontend com window.location.origin.
    webhookUrl: originDoRequest(),
    webhookTokenConfigurado: Boolean(webhookToken),
    adminTokenConfigurado: Boolean(process.env["FZAP_ADMIN_TOKEN"]),
    instanceTokenConfigurado: Boolean(process.env["FZAP_INSTANCE_TOKEN"]),
    config: (configRow as FzapStatus["config"]) ?? null,
    ultimoEvento: (ultimo as FzapStatus["ultimoEvento"]) ?? null,
  };
  return status;
});

export type FzapEventoRecente = {
  received_at: string;
  event_type: string | null;
  phone: string | null;
  result: string;
  error: string | null;
};

export const getFzapEventos = createServerFn({ method: "GET" }).handler(async () => {
  const db = await admin();
  const { data, error } = await db
    .from("fzap_eventos")
    .select("received_at, event_type, phone, result, error")
    .order("received_at", { ascending: false })
    .limit(20);
  if (error) {
    console.error("[FZAP:getEventos]", error.message);
    return [] as FzapEventoRecente[];
  }
  return (data ?? []) as FzapEventoRecente[];
});

const testSchema = z.object({ telefone: z.string().min(8) });

/** Envia uma mensagem de teste para o número informado via FZAP. */
export const testFzapEnvio = createServerFn({ method: "POST" })
  .inputValidator((data) => testSchema.parse(data))
  .handler(async ({ data }) => {
    const { sendTextMessage } = await import("@/lib/fzap/service.server");
    const db = await admin();
    const ok = await sendTextMessage(null, data.telefone, "✅ Teste de integração FZAP — a Mia está online!");
    const resultado = ok ? "ok" : "falhou";
    await db
      .from("fzap_config")
      .upsert(
        { id: "00000000-0000-0000-0000-000000000000", last_test_at: new Date().toISOString(), last_test_result: resultado },
        { onConflict: "id" },
      )
      .eq("id", "00000000-0000-0000-0000-000000000000");
    return { ok, resultado };
  });

const salvarConfigSchema = z.object({
  instance_id: z.string().optional(),
  instance_name: z.string().optional(),
});

export const salvarFzapConfig = createServerFn({ method: "POST" })
  .inputValidator((data) => salvarConfigSchema.parse(data))
  .handler(async ({ data }) => {
    const db = await admin();
    await db
      .from("fzap_config")
      .upsert(
        {
          id: "00000000-0000-0000-0000-000000000000",
          instance_id: data.instance_id ?? null,
          instance_name: data.instance_name ?? null,
        },
        { onConflict: "id" },
      );
    return { ok: true };
  });
