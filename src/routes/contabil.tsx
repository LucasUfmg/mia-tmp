import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { keepPreviousData, useQueries, useQuery } from "@tanstack/react-query";
import { BookOpen, Calculator, Plus, Sigma } from "lucide-react";
import logoRedeFlex from "@/assets/redeflex-logo.jpg";
import { Sidebar } from "@/components/redeflex/Sidebar";
import { MultiStoreFilter } from "@/components/redeflex/MultiStoreFilter";
import { DreDashboard } from "@/components/redeflex/DreDashboard";
import { LancamentoDialog } from "@/components/redeflex/LancamentoDialog";
import { EbitdaDialog } from "@/components/redeflex/EbitdaDialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { loadLojas } from "@/lib/redeflex-dashboard";
import { listarEbitda, listarLancamentos } from "@/lib/contabil.functions";
import { receitaCustoMes } from "@/lib/redeflex.functions";

/** Limita as consultas ao BI em paralelo (fila na ordem de chamada). */
const LIMITE_BI = 4;
let biAtivas = 0;
const filaBi: (() => void)[] = [];
async function limitarBi<T>(fn: () => Promise<T>): Promise<T> {
  if (biAtivas >= LIMITE_BI) await new Promise<void>((r) => filaBi.push(r));
  biAtivas++;
  try {
    return await fn();
  } finally {
    biAtivas--;
    filaBi.shift()?.();
  }
}
import { fatorDiasDoMes, proporcionalizarDespesas } from "@/lib/ebitda";
import {
  anoDoMes,
  IBM_REDE,
  mesReferencia,
  mesesDoAno,
  rotuloMes,
} from "@/lib/contabil";



const title = "Contábil — ROE, ROIC e Margens | RedeFlex";
const description =
  "Indicadores financeiros da rede de postos: ROE, ROIC, margem líquida e margem EBITDA, com lançamentos contábeis por posto e comparação do ROIC com o WACC.";

export const Route = createFileRoute("/contabil")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Contabil,
});

function Contabil() {
  const mesAtual = mesReferencia();
  const [selecao, setSelecao] = useState<string[]>([]);
  const [mes, setMes] = useState(mesAtual);
  const [visao, setVisao] = useState<"mes" | "ano">("mes");
  const [dialogo, setDialogo] = useState(false);
  const [dialogoEbitda, setDialogoEbitda] = useState(false);
  const [edicao, setEdicao] = useState<{ ibm: string; mes: string } | null>(null);


  const ano = anoDoMes(mes);

  const { data: lojas = [] } = useQuery({
    queryKey: ["redeflex", "lojas"],
    queryFn: () => loadLojas(),
    staleTime: 30 * 60_000,
    placeholderData: keepPreviousData,
  });

  const {
    data: lancamentos = [],
    isPending,
    isFetching: buscandoLancamentos,
  } = useQuery({
    queryKey: ["contabil", "lancamentos", ano],
    queryFn: () => listarLancamentos({ data: { ano } }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const { data: calculosBrutos = [], isFetching: buscandoCalculos } = useQuery({
    queryKey: ["contabil", "ebitda", ano],
    queryFn: () => listarEbitda({ data: { ano } }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });



  const anoAnterior = String(Number(ano) - 1);
  const { data: calculosAnt = [] } = useQuery({
    queryKey: ["contabil", "ebitda", anoAnterior],
    queryFn: () => listarEbitda({ data: { ano: anoAnterior } }),
    staleTime: 60_000,
  });
  // Receita e CMV vêm do BI (uma consulta curta por posto/mês, igual à Visão
  // Geral) e são mesclados às despesas salvas. Meses futuros não são pedidos.
  const mesCorrente = `${new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" }).format(new Date())}-01`;
  const mesesPrioritarios = useMemo(() => {
    const escopo = visao === "mes" ? [mes] : mesesDoAno(ano).filter((m) => m <= mes);
    const primeiro = escopo[0] ?? mes;
    const [a, m] = primeiro.split("-").map(Number) as [number, number];
    const anterior = new Date(Date.UTC(a, m - 2, 1)).toISOString().slice(0, 10);
    return new Set([...escopo, anterior]);
  }, [visao, mes, ano]);
  const pares = useMemo(() => {
    const [a, m] = mes.split("-").map(Number) as [number, number];
    const limiteInicio = new Date(Date.UTC(a, m - 13, 1)).toISOString().slice(0, 10);
    const vistos = new Set<string>();
    const lista = [...calculosAnt, ...calculosBrutos]
      .filter((c) => c.mes <= mesCorrente && c.mes >= limiteInicio)
      .filter((c) => {
        const k = `${c.ibm}|${c.mes}`;
        if (vistos.has(k)) return false;
        vistos.add(k);
        return true;
      })
      .map((c) => ({ ibm: c.ibm, mes: c.mes, prioridade: mesesPrioritarios.has(c.mes) }));
    // Prioritários primeiro (cards/DRE); o restante alimenta os gráficos.
    return lista.sort((x, y) => Number(y.prioridade) - Number(x.prioridade) || y.mes.localeCompare(x.mes));
  }, [calculosAnt, calculosBrutos, mesCorrente, mes, mesesPrioritarios]);

  const consultasBi = useQueries({
    queries: pares.map((p) => ({
      queryKey: ["contabil", "bi-mes", p.ibm, p.mes],
      queryFn: () => limitarBi(() => receitaCustoMes({ data: { ibm: p.ibm, mes: p.mes } })),
      staleTime: p.mes < mesCorrente ? 12 * 60 * 60_000 : 5 * 60_000,
      retry: 1,
    })),
  });
  const consultasMesmoPeriodo = useQueries({
    queries: pares.map((p) => ({
      queryKey: ["contabil", "bi-mes-mesmo-periodo", p.ibm, p.mes],
      queryFn: () => limitarBi(() => receitaCustoMes({ data: { ibm: p.ibm, mes: p.mes, mesmoPeriodo: true } })),
      staleTime: 5 * 60_000,
      retry: 1,
    })),
  });
  const doBi = useMemo(
    () => pares.flatMap((p, i) => { const d = consultasBi[i]?.data; return d ? [{ ...p, ...d }] : []; }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pares, consultasBi.map((q) => q.dataUpdatedAt).join(",")],
  );
  const doBiMesmoPeriodo = useMemo(
    () => pares.flatMap((p, i) => { const d = consultasMesmoPeriodo[i]?.data; return d ? [{ ...p, ...d }] : []; }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pares, consultasMesmoPeriodo.map((q) => q.dataUpdatedAt).join(",")],
  );
  // Cards/DRE esperam só os meses escolhidos; comparação e gráficos chegam depois.
  const prioritarias = pares
    .map((p, i) => ({ p, q: consultasBi[i] }))
    .filter((x) => (visao === "mes" ? x.p.mes === mes : x.p.mes.slice(0, 4) === ano && x.p.mes <= mes));
  const carregandoBi = prioritarias.some((x) => x.q?.isPending);
  const erroBi = !carregandoBi && prioritarias.some((x) => x.q?.isError);
  const recarregarBi = () => {
    consultasBi.forEach((q) => q.isError && void q.refetch());
    consultasMesmoPeriodo.forEach((q) => q.isError && void q.refetch());
  };
  const mesclar = useMemo(() => {
    const mapa = new Map(doBi.map((b) => [`${b.ibm}|${b.mes}`, b]));
    return (c: (typeof calculosBrutos)[number]) => {
      const b = mapa.get(`${c.ibm}|${c.mes}`);
       return b ? {
         ...c,
         receitaVendas: b.receita,
         custo: b.custo,
         vendaCombustivel: b.vendaCombustivel,
         vendaMercadorias: b.vendaMercadorias,
         vendaServicos: b.vendaServicos,
         custoCombustivel: b.custoCombustivel,
         custoMercadoria: b.custoMercadoria,
         litrosVendidos: b.litrosVendidos,
         abastecimentosRealizados: b.abastecimentosRealizados,
         margemProduto: b.margemProduto,
         margemCombustivel: b.margemCombustivel,
       } : c;
    };
  }, [doBi]);
  const calculos = useMemo(() => calculosBrutos.map(mesclar), [calculosBrutos, mesclar]);
  // Painel: despesas do mês corrente proporcionais aos dias decorridos.
  const calculosComAnterior = useMemo(
    () =>
      [...calculosAnt.map(mesclar), ...calculos].map((c) =>
        c.mes === mesCorrente ? proporcionalizarDespesas(c, fatorDiasDoMes(c.mes)) : c,
      ),
    [calculosAnt, calculos, mesclar, mesCorrente],
  );

  // Evolução da receita: cada mês cortado no mesmo dia e hora de agora.
  const calculosMesmoPeriodo = useMemo(() => {
    if (doBiMesmoPeriodo.length === 0) return undefined;
    const mapa = new Map(doBiMesmoPeriodo.map((b) => [`${b.ibm}|${b.mes}`, b]));
    return calculosComAnterior.map((c) => {
      const b = mapa.get(`${c.ibm}|${c.mes}`);
      // Meses anteriores: despesas proporcionais ao mesmo dia do mês.
      const base = c.mes < mesCorrente ? proporcionalizarDespesas(c, fatorDiasDoMes(c.mes)) : c;
      return b
        ? { ...base, receitaVendas: b.receita, custo: b.custo, vendaCombustivel: b.vendaCombustivel, vendaMercadorias: b.vendaMercadorias, custoCombustivel: b.custoCombustivel, custoMercadoria: b.custoMercadoria }
        : base;
    });
  }, [doBiMesmoPeriodo, calculosComAnterior, mesCorrente]);

  const mesesAno = useMemo(() => mesesDoAno(ano), [ano]);
  const mesesEscopo = visao === "mes" ? [mes] : mesesAno.filter((m) => m <= mes);

  const nomePosto = (ibm: string) =>
    ibm === IBM_REDE ? "Rede (consolidado)" : (lojas.find((l) => l.ibm === ibm)?.nome ?? `Posto ${ibm}`);
  const escopo =
    selecao.length === 0
      ? "Rede"
      : selecao.length <= 2
        ? selecao.map(nomePosto).join(" + ")
        : `${selecao.length} postos`;

  const anos = useMemo(() => {
    const atual = Number(anoDoMes(mesAtual));
    return [atual + 1, atual, atual - 1, atual - 2].map(String);
  }, [mesAtual]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="min-w-0 flex-1 px-4 py-5 sm:px-5 sm:py-6 md:px-8 md:py-8">
        <div className="mb-5 flex items-center gap-3 lg:hidden">
          <img
            src={logoRedeFlex}
            alt="RedeFlex — rede de postos"
            className="h-9 w-auto shrink-0 rounded-md"
          />
          <span className="min-w-0 flex-1 truncate text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            Indicadores financeiros
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
            <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
              <Calculator className="h-6 w-6 text-gold" />
              Indicadores Financeiros
            </h1>
            <div className="inline-flex rounded-full bg-surface-muted p-1 text-xs font-bold">
              {(
                [
                  ["mes", "Mês"],
                  ["ano", "Acumulado do ano"],
                ] as const
              ).map(([valor, rotulo]) => (
                <button
                  key={valor}
                  onClick={() => setVisao(valor)}
                  className={`rounded-full px-3 py-1.5 transition-colors ${
                    visao === valor
                      ? "bg-gold text-gold-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {rotulo}
                </button>
              ))}
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-3 text-sm text-muted-foreground">
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setEdicao(null);
                  setDialogoEbitda(true);
                }}
              >
                <Sigma className="mr-1.5 h-4 w-4 text-gold" />
                Lançar valores da DRE
              </Button>
              <Button
                onClick={() => {
                  setEdicao(null);
                  setDialogo(true);
                }}
                className="bg-gold text-gold-foreground hover:bg-gold/90"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Lançar dados contábeis
              </Button>
            </div>

            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <MultiStoreFilter value={selecao} onChange={setSelecao} lojas={lojas} />
              <div className="flex items-center gap-2">
                <Select value={ano} onValueChange={(v) => setMes(`${v}-${mes.slice(5, 7)}-01`)}>
                  <SelectTrigger className="w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {anos.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={mes} onValueChange={setMes}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mesesAno.map((m) => (
                      <SelectItem key={m} value={m}>
                        {rotuloMes(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

        </header>

        <p className="mt-3 text-xs text-muted-foreground">
          {escopo} ·{" "}
          {visao === "mes"
            ? rotuloMes(mes)
            : `acumulado de ${rotuloMes(mesesEscopo[0] ?? mes)} a ${rotuloMes(mes)}`}
          {isPending ? " · carregando lançamentos…" : ""}
        </p>

        <DreDashboard
          calculos={calculosComAnterior}
          {...(calculosMesmoPeriodo ? { calculosMesmoPeriodo } : {})}
          selecao={selecao}
          biStatus={pares.length === 0 ? "ok" : carregandoBi ? "carregando" : erroBi ? "erro" : "ok"}
          onRecarregarBi={recarregarBi}
          meses={mesesEscopo}
          mesAtual={mes}
          lojas={lojas}
        />
      </main>

      <LancamentoDialog
        aberto={dialogo}
        onAberto={setDialogo}
        lojas={lojas}
        lancamentos={lancamentos}
        calculos={calculos}
        carregando={buscandoLancamentos || buscandoCalculos}
        ano={ano}
        mesInicial={edicao?.mes ?? mes}
        {...(edicao
          ? { ibmInicial: edicao.ibm }
          : selecao.length === 1
            ? { ibmInicial: selecao[0] }
            : {})}
      />

      <EbitdaDialog
        aberto={dialogoEbitda}
        onAberto={setDialogoEbitda}
        lojas={lojas}
        calculos={calculos}
        ano={ano}
        mesInicial={mes}
        {...(selecao.length === 1 ? { ibmInicial: selecao[0] } : {})}
      />

    </div>
  );
}
