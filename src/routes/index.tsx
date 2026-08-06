import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Fuel, ShoppingBag, DollarSign, TrendingUp, ShoppingCart } from "lucide-react";
import { Sidebar } from "@/components/redeflex/Sidebar";
import { NetworkCard } from "@/components/redeflex/NetworkCard";
import { DistributionCard } from "@/components/redeflex/DistributionCard";
import { WeeklyOverview } from "@/components/redeflex/WeeklyOverview";
import { NetworkFilter } from "@/components/redeflex/NetworkFilter";
import { LiveStatus } from "@/components/redeflex/LiveStatus";
import { PeriodTabs } from "@/components/redeflex/PeriodTabs";
import { loadDashboardData, loadLojas } from "@/lib/redeflex-dashboard";
import { usePersistedQueryCache } from "@/lib/query-persist";
import { REDE_ID } from "@/lib/redeflex-transform";
import type { Categoria, Periodo } from "@/lib/redeflex-dashboard";
import type { Slice } from "@/data/redeflex";

const title = "RedeFlex — Visão Geral da Rede de Postos";
const description =
  "Painel executivo RedeFlex: rentabilidade, margem por litro, ticket médio e distribuição de combustíveis e produtos em toda a rede de postos.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Index,
});

const litros0 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const litros2 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brl0 = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});
const pct = (v: number) => `${litros2.format(v)}%`;

function toSlices(
  categorias: Categoria[] | undefined,
  indiceLabel: string,
  formatIndice: (v: number) => string,
  mostrarLucro: boolean,
): Slice[] {
  return (categorias ?? []).map((c) => ({
    name: c.nome,
    value: Math.max(c.receita, 0),
    primaryLabel: indiceLabel,
    primaryValue: formatIndice(c.indice),
    lb: mostrarLucro ? pct(c.lb) : null,
    rb: mostrarLucro ? brl0.format(c.lucroBruto) : null,
  }));
}

function Index() {
  const [selecao, setSelecao] = useState<string>(REDE_ID);
  const [periodo, setPeriodo] = useState<Periodo>("diario");
  const forcar = useRef(false);

  usePersistedQueryCache();

  const { data: lojas = [] } = useQuery({
    queryKey: ["redeflex", "lojas"],
    queryFn: () => loadLojas(),
    staleTime: 30 * 60_000,
    placeholderData: keepPreviousData,
  });

  const { data, isPending, isFetching, error, dataUpdatedAt, refetch } = useQuery({
    queryKey: ["redeflex", "dashboard", selecao, periodo],
    queryFn: () => {
      const fresh = forcar.current;
      forcar.current = false;
      return loadDashboardData(selecao, periodo, undefined, fresh);
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    placeholderData: keepPreviousData,
  });

  const escopo =
    selecao === REDE_ID
      ? "Rede"
      : (lojas.find((l) => l.ibm === selecao)?.nome ?? `Posto ${selecao}`);

  const ind = data?.indicadores;
  const diario = periodo === "diario";
  const sufixo = diario ? "hoje" : "no mês até hoje";
  const kpis = [
    {
      icon: Fuel,
      label: "Volume vendido",
      value: ind ? `${litros0.format(ind.combustivel.litros)} L` : "—",
      hint: `litros ${sufixo}`,
    },
    {
      icon: TrendingUp,
      label: "Resultado Bruto",
      value: ind ? brl0.format(ind.combustivel.lucroBruto) : "—",
      hint: ind ? `LB ${pct(ind.combustivel.lb)}` : "—",
    },
    {
      icon: DollarSign,
      label: "Margem média (M/LT)",
      value: ind ? brl.format(ind.combustivel.mlt) : "—",
      hint: "por litro vendido",
    },
    {
      icon: ShoppingCart,
      label: "Ticket médio (TMC)",
      value: ind ? brl.format(ind.combustivel.tmc) : "—",
      hint: ind ? `${litros2.format(ind.combustivel.tmv)} L por atendimento (TMV)` : "—",
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="min-w-0 flex-1 px-5 py-6 md:px-8 md:py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {diario ? "Painel de Dados Diário" : "Painel de Dados Mensal"}
            </h1>
            <PeriodTabs value={periodo} onChange={setPeriodo} />
          </div>
          <div className="flex items-center gap-5 text-sm text-muted-foreground">
            <NetworkFilter value={selecao} onChange={setSelecao} lojas={lojas} />
            <span className="hidden h-5 w-px bg-border sm:block" />
            <LiveStatus
              atualizadoEm={dataUpdatedAt}
              atualizando={isFetching}
              erro={error}
              onRefresh={() => {
                forcar.current = true;
                void refetch();
              }}
            />
          </div>
        </header>

        <div className="mt-6">
          <WeeklyOverview
            comparativo={data?.comparativo ?? []}
            projecao={data?.projecao ?? { combustivel: 0, produto: 0, referencia: "—" }}
            escopo={escopo}
            carregando={isPending}
            corte={data?.corte ?? "--:--"}
            periodo={periodo}
          />
        </div>

        <section className="card-elevated mt-6 grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
          {kpis.map(({ icon: Icon, label, value, hint }) => (
            <div key={label} className="flex items-center gap-4 px-6 py-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {label}
                </p>
                <p className="mt-0.5 text-2xl font-extrabold tracking-tight">{value}</p>
                <p className="text-xs text-muted-foreground">{hint}</p>
              </div>
            </div>
          ))}
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <NetworkCard
            title="Rede Combustíveis"
            icon={<Fuel className="h-7 w-7" />}
            rb={ind ? brl0.format(ind.combustivel.receita) : "—"}
            rbLabel="Faturamento combustíveis"
            metrics={[
              { label: "M/LT", value: ind ? brl.format(ind.combustivel.mlt) : "—" },
              { label: "LB", value: ind ? pct(ind.combustivel.lb) : "—" },
              { label: "TMV", value: ind ? `${litros2.format(ind.combustivel.tmv)} L` : "—" },
              { label: "TMC", value: ind ? brl.format(ind.combustivel.tmc) : "—" },
            ]}
            note={`${escopo} · abastecimentos ${diario ? `de hoje até ${data?.corte ?? "--:--"}` : "do mês"}${
              ind ? ` · ${litros0.format(ind.combustivel.atendimentos)} atendimentos` : ""
            }`}
          />
          <NetworkCard
            title="Rede Produtos"
            icon={<ShoppingBag className="h-7 w-7" />}
            rb={ind ? brl0.format(ind.produto.receita) : "—"}
            rbLabel="Faturamento produtos"
            metrics={[
              { label: "TMP", value: ind ? brl.format(ind.produto.tmp) : "—" },
              { label: "Cupons", value: ind ? litros0.format(ind.produto.cupons) : "—" },
            ]}
            note={`${escopo} · vendas de produto ${diario ? `de hoje até ${data?.corte ?? "--:--"}` : "do mês"}`}
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <DistributionCard
            title="Distribuição dos Combustíveis"
            data={toSlices(data?.categorias.combustiveis, "M/LT", (v) => brl.format(v), true)}
            note="Participação por faturamento — passe o mouse para ver M/LT, LB e RB"
          />
          <DistributionCard
            title="Distribuição dos Produtos"
            data={toSlices(data?.categorias.produtos, "TMP", (v) => brl.format(v), false)}
            note="Participação por faturamento — passe o mouse para ver TMP"
          />
        </div>
      </main>
    </div>
  );
}
