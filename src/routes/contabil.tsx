import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { BookOpen, Calculator, Plus } from "lucide-react";
import logoRedeFlex from "@/assets/redeflex-logo.jpg";
import { Sidebar } from "@/components/redeflex/Sidebar";
import { MultiStoreFilter } from "@/components/redeflex/MultiStoreFilter";
import { ContabilCards, RoicVsWacc } from "@/components/redeflex/ContabilCards";
import { ContabilTabela, linhasPorMes } from "@/components/redeflex/ContabilTabela";
import { LancamentoDialog } from "@/components/redeflex/LancamentoDialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { loadLojas } from "@/lib/redeflex-dashboard";
import { listarLancamentos } from "@/lib/contabil.functions";
import {
  anoDoMes,
  consolidar,
  filtrarEscopo,
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
  const [edicao, setEdicao] = useState<{ ibm: string; mes: string } | null>(null);

  const ano = anoDoMes(mes);

  const { data: lojas = [] } = useQuery({
    queryKey: ["redeflex", "lojas"],
    queryFn: () => loadLojas(),
    staleTime: 30 * 60_000,
    placeholderData: keepPreviousData,
  });

  const { data: lancamentos = [], isPending } = useQuery({
    queryKey: ["contabil", "lancamentos", ano],
    queryFn: () => listarLancamentos({ data: { ano } }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const mesesAno = useMemo(() => mesesDoAno(ano), [ano]);
  const mesesEscopo = visao === "mes" ? [mes] : mesesAno.filter((m) => m <= mes);

  const noEscopo = useMemo(
    () => filtrarEscopo(lancamentos, selecao, mesesEscopo),
    [lancamentos, selecao, mesesEscopo],
  );
  const consolidado = useMemo(() => consolidar(noEscopo), [noEscopo]);

  const doAno = useMemo(
    () => filtrarEscopo(lancamentos, selecao, mesesAno),
    [lancamentos, selecao, mesesAno],
  );
  const linhasMes = useMemo(() => linhasPorMes(doAno, mesesAno), [doAno, mesesAno]);
  const totalAno = useMemo(() => consolidar(doAno), [doAno]);

  const nomePosto = (ibm: string) =>
    ibm === IBM_REDE ? "Rede (consolidado)" : (lojas.find((l) => l.ibm === ibm)?.nome ?? `Posto ${ibm}`);
  const escopo =
    selecao.length === 0
      ? "Rede"
      : selecao.length <= 2
        ? selecao.map(nomePosto).join(" + ")
        : `${selecao.length} postos`;

  const usaRede = consolidado.postos.includes(IBM_REDE);
  const selecionados = selecao.length === 0 ? lojas.map((l) => l.ibm) : selecao;
  const semLancamento = usaRede
    ? []
    : selecionados.filter((ibm) => !consolidado.postos.includes(ibm));


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
            <div className="flex sm:justify-end">
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

        {semLancamento.length > 0 && !isPending && (
          <p className="mt-2 rounded-xl bg-surface-muted px-4 py-3 text-xs text-muted-foreground">
            {semLancamento.length === selecionados.length
              ? "Nenhum posto do escopo tem lançamento no período — os indicadores aparecem em branco."
              : `${semLancamento.length} de ${selecionados.length} postos do escopo ainda não têm lançamento no período: ${semLancamento
                  .slice(0, 3)
                  .map(nomePosto)
                  .join(", ")}${semLancamento.length > 3 ? "…" : ""}`}
          </p>
        )}

        <div className="mt-6 grid gap-6">
          <ContabilCards dados={consolidado} />
          <RoicVsWacc dados={consolidado} />
          <ContabilTabela
            linhas={linhasMes}
            total={totalAno}
            totalLabel={`Ano ${ano}`}
            nomePosto={nomePosto}
            onEditar={(l) => {
              setEdicao({ ibm: l.ibm, mes: l.mes });
              setDialogo(true);
            }}
          />
        </div>
      </main>

      <LancamentoDialog
        aberto={dialogo}
        onAberto={setDialogo}
        lojas={lojas}
        lancamentos={lancamentos}
        ano={ano}
        mesInicial={edicao?.mes ?? mes}
        {...(edicao
          ? { ibmInicial: edicao.ibm }
          : selecao.length === 1
            ? { ibmInicial: selecao[0]! }
            : {})}
      />
    </div>
  );
}
