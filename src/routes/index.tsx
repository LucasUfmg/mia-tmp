import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  Fuel,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  FileText,
} from "lucide-react";
import { Sidebar } from "@/components/redeflex/Sidebar";
import { NetworkCard } from "@/components/redeflex/NetworkCard";
import { DistributionCard } from "@/components/redeflex/DistributionCard";
import { WeeklyOverview } from "@/components/redeflex/WeeklyOverview";
import { NetworkFilter } from "@/components/redeflex/NetworkFilter";
import { LiveStatus } from "@/components/redeflex/LiveStatus";
import { loadDashboardData, loadPostos } from "@/lib/redeflex-dashboard";
import { REDE_ID, formatPostoLabel } from "@/lib/redeflex-transform";
import {
  combustiveis,
  produtos,
  redeCombustiveis,
  redeProdutos,
} from "@/data/redeflex";

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

const kpis = [
  { icon: Fuel, label: "Volume movimentado", value: "2,46 Mi", hint: "litros" },
  { icon: TrendingUp, label: "Rentabilidade da rede", value: "R$ 13.020", hint: "RB médio (combustíveis)" },
  { icon: DollarSign, label: "Margem média (M/LT)", value: "R$ 0,66", hint: "Combustíveis" },
  { icon: ShoppingCart, label: "Ticket médio", value: "R$ 116,16", hint: "TMC por transação" },
];

function Index() {
  const [selecao, setSelecao] = useState<string>(REDE_ID);

  const { data: postos = [] } = useQuery({
    queryKey: ["redeflex", "postos"],
    queryFn: () => loadPostos(),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const { data, isPending, isFetching, isError, dataUpdatedAt, refetch } = useQuery({
    queryKey: ["redeflex", "dashboard", selecao],
    queryFn: () => loadDashboardData(selecao),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const escopo = selecao === REDE_ID ? "Rede" : formatPostoLabel(selecao);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="min-w-0 flex-1 px-5 py-6 md:px-8 md:py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Visão Geral da Rede</h1>
          <div className="flex items-center gap-5 text-sm text-muted-foreground">
            <NetworkFilter value={selecao} onChange={setSelecao} postos={postos} />
            <span className="hidden h-5 w-px bg-border sm:block" />
            <LiveStatus
              atualizadoEm={dataUpdatedAt}
              atualizando={isFetching}
              erro={isError}
              onRefresh={() => void refetch()}
            />
          </div>
        </header>

        <div className="mt-6">
          <WeeklyOverview
            comparativo={data?.comparativo ?? []}
            projecao={data?.projecao ?? { combustivel: 0, produto: 0, referencia: "—" }}
            escopo={escopo}
            carregando={isPending}
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
            rb="R$ 13.020,32"
            metrics={redeCombustiveis.metrics}
            note={redeCombustiveis.note}
          />
          <NetworkCard
            title="Rede Produtos"
            icon={<ShoppingBag className="h-7 w-7" />}
            rb="R$ 561,00"
            metrics={redeProdutos.metrics}
            note={redeProdutos.note}
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <DistributionCard
            title="Distribuição dos Combustíveis"
            data={combustiveis}
            note="Participação por RB — passe o mouse para ver M/LT, LB e RB"
          />
          <DistributionCard
            title="Distribuição dos Produtos"
            data={produtos}
            note="Participação por RB — passe o mouse para ver TMP, LB e RB"
          />
        </div>

        <section className="card-elevated mt-6 flex flex-wrap items-center justify-between gap-4 border-l-4 border-brand px-6 py-5">
          <p className="flex items-center gap-3 text-sm">
            <TrendingUp className="h-5 w-5 shrink-0 text-brand" />
            <span>
              <span className="font-semibold">Insights da rede:&nbsp;</span>
              Óleo Diesel Comum lidera a rentabilidade em combustíveis, enquanto Lubrificantes
              Caminhões/Ônibus/Vans concentram o maior RB entre os produtos.
            </span>
          </p>
          <button className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground transition-opacity hover:opacity-90">
            <FileText className="h-4 w-4" />
            Ver relatório completo
          </button>
        </section>
      </main>
    </div>
  );
}
