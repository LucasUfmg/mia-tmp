import { createFileRoute, ClientOnly, Link } from "@tanstack/react-router";
import { lazy, Suspense, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  Fuel,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  PieChart,
  BookOpen,
} from "lucide-react";
import { Sidebar } from "@/components/redeflex/Sidebar";
import { NetworkCard } from "@/components/redeflex/NetworkCard";
import { DistributionCard } from "@/components/redeflex/DistributionCard";
import { WeeklyOverview } from "@/components/redeflex/WeeklyOverview";
import { MultiStoreFilter } from "@/components/redeflex/MultiStoreFilter";
import { LiveStatus } from "@/components/redeflex/LiveStatus";
import { PeriodTabs } from "@/components/redeflex/PeriodTabs";
import { loadDashboardData, loadLojas } from "@/lib/redeflex-dashboard";
import { loadMapa } from "@/lib/redeflex-mapa";
import { usePersistedQueryCache } from "@/lib/query-persist";
import type { Categoria, Periodo } from "@/lib/redeflex-dashboard";
import type { Slice } from "@/data/redeflex";

const NetworkMap = lazy(() => import("@/components/redeflex/NetworkMap"));

const MapaSkeleton = () => (
  <div className="card-elevated h-[420px] animate-pulse bg-surface-muted" aria-hidden />
);

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
  const [selecao, setSelecao] = useState<string[]>([]);
  const [periodo, setPeriodo] = useState<Periodo>("diario");
  const forcar = useRef(false);

  usePersistedQueryCache();

  const { data: lojas = [] } = useQuery({
    queryKey: ["redeflex", "lojas"],
    queryFn: () => loadLojas(),
    staleTime: 30 * 60_000,
    placeholderData: keepPreviousData,
  });

  const {
    data: postosMapa = [],
    isPending: mapaCarregando,
    error: mapaErro,
  } = useQuery({
    queryKey: ["redeflex", "mapa", periodo],
    queryFn: () => loadMapa(periodo),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchInterval: 5 * 60_000,
    placeholderData: keepPreviousData,
  });

  const { data, isPending, isFetching, error, dataUpdatedAt, refetch } = useQuery({
    queryKey: ["redeflex", "dashboard", [...selecao].sort().join(","), periodo],
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

  const nomePosto = (ibm: string) => lojas.find((l) => l.ibm === ibm)?.nome ?? `Posto ${ibm}`;
  const escopo =
    selecao.length === 0
      ? "Rede"
      : selecao.length <= 2
        ? selecao.map(nomePosto).join(" + ")
        : `${selecao.length} postos`;

  /** Clique em "Ver no painel" no mapa: soma o posto à seleção atual. */
  const selecionarDoMapa = (ibm: string) =>
    setSelecao((atual) => (atual.includes(ibm) ? atual : [...atual, ibm]));

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

      <main className="min-w-0 flex-1 px-4 py-5 sm:px-5 sm:py-6 md:px-8 md:py-8">
        <div className="mb-5 flex items-center gap-3 lg:hidden">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sidebar">
            <PieChart className="h-5 w-5 text-brand" strokeWidth={2.4} />
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-base font-extrabold tracking-tight">
              REDE<span className="text-brand">FLEX</span>
            </span>
            <span className="block truncate text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
              Inteligência em postos de combustíveis
            </span>
          </span>
          <Link
            to="/manual"
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Manual
          </Link>
        </div>

        <header className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
              {diario ? "Painel de Dados Diário" : "Painel de Dados Mensal"}
            </h1>
            <PeriodTabs value={periodo} onChange={setPeriodo} />
          </div>
          <div className="flex min-w-0 flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
            <MultiStoreFilter value={selecao} onChange={setSelecao} lojas={lojas} />
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
          <ClientOnly fallback={<MapaSkeleton />}>
            <Suspense fallback={<MapaSkeleton />}>
              <NetworkMap
                postos={postosMapa}
                carregando={mapaCarregando}
                erro={mapaErro}
                periodoLabel={diario ? `Hoje até ${data?.corte ?? "--:--"}` : "Mês até hoje"}
                onSelecionar={selecionarDoMapa}
              />
            </Suspense>
          </ClientOnly>
        </div>

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
            <div key={label} className="flex items-center gap-4 px-4 py-4 sm:px-6 sm:py-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand sm:h-12 sm:w-12">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {label}
                </p>
                <p className="mt-0.5 break-words text-xl font-extrabold tracking-tight sm:text-2xl">
                  {value}
                </p>
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
