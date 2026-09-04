import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { getFzapEventos, getFzapStatus, salvarFzapConfig, testFzapEnvio } from "@/lib/fzap/fzap.functions";

export const Route = createFileRoute("/integracao-fzap")({
  head: () => ({
    meta: [
      { title: "Integração FZAP — Mia | RedeFlex" },
      { name: "description", content: "Configuração da integração do agente Mia com o FZAP (WhatsApp)." },
    ],
  }),
  component: IntegracaoFzapPage,
});

function statusBadge(ok: boolean, label: string) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
        ok ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-emerald-400" : "bg-rose-400"}`} />
      {label}
    </span>
  );
}

function IntegracaoFzapPage() {
  const queryClient = useQueryClient();
  const [telefoneTeste, setTelefoneTeste] = useState("");
  const [instanceId, setInstanceId] = useState("");
  const [instanceName, setInstanceName] = useState("");
  const [copiado, setCopiado] = useState(false);

  const statusQuery = useQuery({
    queryKey: ["fzap-status"],
    queryFn: () => getFzapStatus(),
  });
  const eventosQuery = useQuery({
    queryKey: ["fzap-eventos"],
    queryFn: () => getFzapEventos(),
    refetchInterval: 8000,
  });

  const testMutation = useMutation({
    mutationFn: useServerFn(testFzapEnvio),
    onSuccess: (r) => {
      toast(r.ok ? "Mensagem de teste enviada." : "Falha no envio do teste.");
      queryClient.invalidateQueries({ queryKey: ["fzap-status"] });
    },
    onError: (e) => toast.error("Erro no teste: " + String(e)),
  });

  const salvarMutation = useMutation({
    mutationFn: useServerFn(salvarFzapConfig),
    onSuccess: () => {
      toast.success("Configuração salva.");
      queryClient.invalidateQueries({ queryKey: ["fzap-status"] });
    },
    onError: (e) => toast.error("Erro ao salvar: " + String(e)),
  });

  const status = statusQuery.data;
  const webhookUrl = status
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/api/public/fzap?token=•••••`
    : null;

  const copiar = async () => {
    if (!status?.webhookTokenConfigurado) return;
    const token = ""; // token é secreto, não expomos; o usuário copia a URL base
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/api/public/fzap`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
      toast.success("URL do webhook copiada.");
    } catch {
      toast.error("Não foi possível copiar.");
    }
    void token;
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100">
      <div className="mx-auto max-w-4xl px-5 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-amber-400">Integração FZAP</h1>
          <p className="mt-1 text-sm text-slate-400">
            Canal de WhatsApp do agente Mia. A Mia continua igual — mesmo cérebro, prompt e memória; só o canal muda.
          </p>
        </header>

        {/* Status */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-300">Status da integração</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg bg-black/20 px-4 py-3">
              <span className="text-sm text-slate-300">Integração</span>
              {statusBadge(Boolean(status?.configurado), status?.configurado ? "Configurada" : "Pendente")}
            </div>
            <div className="flex items-center justify-between rounded-lg bg-black/20 px-4 py-3">
              <span className="text-sm text-slate-300">Admin Token</span>
              {statusBadge(Boolean(status?.adminTokenConfigurado), status?.adminTokenConfigurado ? "Configurado" : "Faltando")}
            </div>
            <div className="flex items-center justify-between rounded-lg bg-black/20 px-4 py-3">
              <span className="text-sm text-slate-300">Webhook Token</span>
              {statusBadge(Boolean(status?.webhookTokenConfigurado), status?.webhookTokenConfigurado ? "Configurado" : "Faltando")}
            </div>
            <div className="flex items-center justify-between rounded-lg bg-black/20 px-4 py-3">
              <span className="text-sm text-slate-300">Instance Token</span>
              {statusBadge(Boolean(status?.instanceTokenConfigurado), status?.instanceTokenConfigurado ? "Configurado" : "Opcional")}
            </div>
          </div>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-400">FZAP Base URL</dt>
              <dd className="font-mono text-slate-200">{status?.baseUrl ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Instância conectada</dt>
              <dd className="font-mono text-slate-200">
                {status?.config?.instance_name ?? status?.config?.instance_id ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Último webhook</dt>
              <dd className="text-slate-200">
                {status?.ultimoEvento
                  ? `${new Date(status.ultimoEvento.received_at).toLocaleString("pt-BR")} · ${status.ultimoEvento.result}`
                  : "Nenhum ainda"}
              </dd>
            </div>
          </dl>
        </section>

        {/* Webhook URL */}
        <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">URL do Webhook</h2>
          <p className="mb-3 text-sm text-slate-400">
            Cole esta URL no seu painel do FZAP (configuração de webhook). O token de validação vai como parâmetro
            <code className="mx-1 rounded bg-black/30 px-1.5 py-0.5 text-amber-300">?token=...</code> — ele é secreto e
            mostrado apenas no cadastro de secrets do Lovable Cloud.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-black/30 px-3 py-2 font-mono text-sm text-slate-200">
              {webhookUrl ?? "—"}
            </code>
            <button
              type="button"
              onClick={copiar}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-amber-400"
            >
              {copiado ? "Copiado!" : "Copiar URL"}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Ative no FZAP os eventos de <strong>mensagem recebida</strong> (message / receive). Eventos de status e
            entrega são ignorados automaticamente.
          </p>
        </section>

        {/* Configurar instância */}
        <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">Instância</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-slate-300">
              ID da instância
              <input
                value={instanceId}
                onChange={(e) => setInstanceId(e.target.value)}
                placeholder={status?.config?.instance_id ?? "ex.: 1"}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
              />
            </label>
            <label className="text-sm text-slate-300">
              Nome da instância
              <input
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                placeholder={status?.config?.instance_name ?? "ex.: mia-redeflex"}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => salvarMutation.mutate({ data: { instance_id: instanceId, instance_name: instanceName } })}
            disabled={salvarMutation.isPending}
            className="mt-3 rounded-lg border border-amber-500/40 px-4 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-500/10 disabled:opacity-50"
          >
            Salvar instância
          </button>
        </section>

        {/* Testar */}
        <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">Testar integração</h2>
          <p className="mb-3 text-sm text-slate-400">
            Envia uma mensagem de teste da Mia para o número informado (DDI + DDD + número, só dígitos).
          </p>
          <div className="flex items-center gap-2">
            <input
              value={telefoneTeste}
              onChange={(e) => setTelefoneTeste(e.target.value)}
              placeholder="5511999999999"
              className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
            />
            <button
              type="button"
              onClick={() => testMutation.mutate({ data: { telefone: telefoneTeste } })}
              disabled={testMutation.isPending || !telefoneTeste}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-amber-400 disabled:opacity-50"
            >
              {testMutation.isPending ? "Enviando..." : "Testar integração"}
            </button>
          </div>
          {status?.config?.last_test_result && (
            <p className="mt-2 text-xs text-slate-500">
              Último teste: {status.config.last_test_result}
              {status.config.last_test_at && ` · ${new Date(status.config.last_test_at).toLocaleString("pt-BR")}`}
            </p>
          )}
        </section>

        {/* Logs recentes */}
        <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">Eventos recentes</h2>
          {eventosQuery.isLoading ? (
            <p className="text-sm text-slate-500">Carregando...</p>
          ) : eventosQuery.data?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">Data</th>
                    <th className="py-2 pr-4">Evento</th>
                    <th className="py-2 pr-4">Telefone</th>
                    <th className="py-2 pr-4">Resultado</th>
                    <th className="py-2">Erro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {eventosQuery.data.map((ev, i) => (
                    <tr key={i} className="text-slate-300">
                      <td className="py-2 pr-4 whitespace-nowrap text-xs">
                        {new Date(ev.received_at).toLocaleString("pt-BR")}
                      </td>
                      <td className="py-2 pr-4 font-mono text-xs">{ev.event_type ?? "—"}</td>
                      <td className="py-2 pr-4 font-mono text-xs">
                        {ev.phone ? `${ev.phone.slice(0, 4)}****${ev.phone.slice(-4)}` : "—"}
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className={`rounded px-2 py-0.5 text-xs ${
                            ev.result === "processado"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : ev.result === "erro"
                                ? "bg-rose-500/15 text-rose-400"
                                : "bg-slate-500/15 text-slate-400"
                          }`}
                        >
                          {ev.result}
                        </span>
                      </td>
                      <td className="py-2 text-xs text-rose-300/80">{ev.error ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Nenhum webhook recebido ainda.</p>
          )}
          <p className="mt-3 text-xs text-slate-500">
            Logs detalhados com prefixo <code className="text-amber-300">[FZAP]</code> e{" "}
            <code className="text-amber-300">[AGENT]</code> aparecem no painel de logs do backend (Lovable Cloud).
          </p>
        </section>

        {/* Documentação rápida */}
        <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-slate-400">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">Como configurar</h2>
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              Configure os secrets no Lovable Cloud: <code className="text-amber-300">FZAP_BASE_URL</code>,{" "}
              <code className="text-amber-300">FZAP_ADMIN_TOKEN</code>,{" "}
              <code className="text-amber-300">FZAP_WEBHOOK_TOKEN</code> (e{" "}
              <code className="text-amber-300">FZAP_INSTANCE_TOKEN</code> se sua instalação usar token por instância).
            </li>
            <li>
              No painel do FZAP, aponte o webhook para a URL acima com o parâmetro <code>?token=...</code> usando o
              mesmo valor de <code className="text-amber-300">FZAP_WEBHOOK_TOKEN</code>.
            </li>
            <li>Ative o evento de mensagem recebida no FZAP.</li>
            <li>Use o botão "Testar integração" acima para confirmar o envio.</li>
            <li>Mande uma mensagem de teste pelo WhatsApp e acompanhe os eventos recentes aqui.</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
