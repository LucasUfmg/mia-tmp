import { useMemo, useState, type ReactNode } from "react";
import { BarChart3, CircleDollarSign, Gauge, Landmark, ReceiptText, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calcularEbitda, consolidarEbitda, linhasEbitda, type Ebitda, type LinhaEbitdaChave } from "@/lib/ebitda";
import { rotuloMes } from "@/lib/contabil";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const numero = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const moeda = (v: number) => brl.format(v);
const percentual = (v: number | null) => (v === null ? "—" : `${numero.format(v)}%`);
const razao = (a: number, b: number) => (b ? (a / b) * 100 : null);
const cores = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

type Props = {
  calculos: Ebitda[];
  selecao: string[];
  meses: string[];
  mesAtual: string;
  lojas: { ibm: string; nome: string }[];
};

const despesas: { chave: LinhaEbitdaChave; label: string }[] = [
  { chave: "administrativas", label: "Administrativas" },
  { chave: "despesasFinanceiras", label: "Financeiras" },
  { chave: "despesasNaoContabeis", label: "Não contábeis" },
  { chave: "despesasPessoal", label: "Trabalhistas" },
  { chave: "despesasTributarias", label: "Tributárias" },
  { chave: "outrasOperacionais", label: "Outras operacionais" },
];

function Card({ icon: Icon, label, valor, detalhe }: { icon: typeof TrendingUp; label: string; valor: string; detalhe: string }) {
  return (
    <article className="card-elevated min-w-0 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-brand" />
      </div>
      <p className="mt-3 truncate text-2xl font-extrabold tabular-nums">{valor}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{detalhe}</p>
    </article>
  );
}

const tooltipStyle = { borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 };

export function DreDashboard({ calculos, selecao, meses, mesAtual, lojas }: Props) {
  const [mesesDre, setMesesDre] = useState<string[]>([mesAtual]);
  const [metrica, setMetrica] = useState<"resultado" | "ebitda" | "receita" | "despesas" | "margem">("resultado");
  const consolidado = useMemo(() => consolidarEbitda(calculos, selecao, meses), [calculos, selecao, meses]);
  const mensais = useMemo(
    () => meses.map((mes) => ({ mes, ...consolidarEbitda(calculos, selecao, [mes]) })),
    [calculos, selecao, meses],
  );
  const composicao = despesas.map((item) => ({ name: item.label, value: Math.abs(consolidado[item.chave]) }));
  const maiores = [...composicao].sort((a, b) => b.value - a.value);
  const cards = [
    { icon: CircleDollarSign, label: "Receita bruta", valor: moeda(consolidado.receitaBruta), detalhe: "Vendas vindas do BI" },
    { icon: TrendingUp, label: "Lucro bruto", valor: moeda(consolidado.resultadoBruto), detalhe: percentual(razao(consolidado.resultadoBruto, consolidado.receitaBruta)) + " da receita" },
    { icon: Gauge, label: "EBITDA", valor: moeda(consolidado.ebitda), detalhe: percentual(razao(consolidado.ebitda, consolidado.receitaBruta)) + " de margem" },
    { icon: Landmark, label: "Resultado final", valor: moeda(consolidado.resultadoFinal), detalhe: consolidado.resultadoFinal >= 0 ? "Resultado positivo" : "Resultado negativo" },
    { icon: ReceiptText, label: "Despesas totais", valor: moeda(consolidado.despesasTotais), detalhe: percentual(razao(consolidado.despesasTotais, consolidado.receitaBruta)) + " da receita" },
    { icon: BarChart3, label: "Margem líquida", valor: percentual(razao(consolidado.resultadoFinal, consolidado.receitaBruta)), detalhe: "Resultado final sobre receita" },
  ];

  const alternarMes = (mes: string) => setMesesDre((atuais) => atuais.includes(mes) ? (atuais.length === 1 ? atuais : atuais.filter((m) => m !== mes)) : [...atuais, mes].sort());
  const colunasDre = mesesDre.map((mes) => ({ mes, dados: consolidarEbitda(calculos, selecao, [mes]) }));
  const nomePosto = (ibm: string) => lojas.find((loja) => loja.ibm === ibm)?.nome ?? ibm;
  const porPosto = useMemo(() => {
    const ibms = selecao.length ? selecao : [...new Set(calculos.filter((c) => c.ibm !== "REDE").map((c) => c.ibm))];
    return ibms.map((ibm) => {
      const d = consolidarEbitda(calculos, [ibm], meses);
      return { ibm, nome: nomePosto(ibm), ...d, margem: razao(d.resultadoFinal, d.receitaBruta) ?? 0 };
    }).filter((item) => item.receitaBruta || item.despesasTotais);
  }, [calculos, selecao, meses, lojas]);
  const valorMetrica = (item: (typeof porPosto)[number]) => ({ resultado: item.resultadoFinal, ebitda: item.ebitda, receita: item.receitaBruta, despesas: item.despesasTotais, margem: item.margem })[metrica];
  const ranking = [...porPosto].sort((a, b) => valorMetrica(b) - valorMetrica(a));

  return (
    <Tabs defaultValue="geral" className="mt-6">
      <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-none border-b border-border bg-transparent p-0">
        <TabsTrigger value="geral" className="rounded-none border-b-2 border-transparent px-4 py-3 shadow-none data-[state=active]:border-brand data-[state=active]:bg-transparent data-[state=active]:shadow-none">Visão Geral</TabsTrigger>
        <TabsTrigger value="dre" className="rounded-none border-b-2 border-transparent px-4 py-3 shadow-none data-[state=active]:border-brand data-[state=active]:bg-transparent data-[state=active]:shadow-none">DRE Gerencial</TabsTrigger>
        <TabsTrigger value="comparativo" className="rounded-none border-b-2 border-transparent px-4 py-3 shadow-none data-[state=active]:border-brand data-[state=active]:bg-transparent data-[state=active]:shadow-none">Comparativo entre Postos</TabsTrigger>
      </TabsList>

      <TabsContent value="geral" className="mt-5 space-y-5">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">{cards.map((card) => <Card key={card.label} {...card} />)}</section>
        <section className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
          <ChartCard titulo="Evolução da receita" subtitulo="Receita bruta por mês">
            <ResponsiveContainer width="100%" height="100%"><LineChart data={mensais}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="mes" tickFormatter={rotuloMes} fontSize={11} /><YAxis tickFormatter={(v) => `${numero.format(v / 1_000_000)} mi`} fontSize={11} /><Tooltip formatter={(v: number) => moeda(v)} labelFormatter={rotuloMes} contentStyle={tooltipStyle} /><Line dataKey="receitaBruta" name="Receita" stroke="var(--color-chart-1)" strokeWidth={3} dot={{ r: 3 }} /></LineChart></ResponsiveContainer>
          </ChartCard>
          <ChartCard titulo="Composição das despesas" subtitulo="Participação por rubrica no período">
            <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={composicao} dataKey="value" nameKey="name" innerRadius="50%" outerRadius="78%">{composicao.map((item, i) => <Cell key={item.name} fill={cores[i % cores.length]} />)}</Pie><Tooltip formatter={(v: number) => moeda(v)} contentStyle={tooltipStyle} /></PieChart></ResponsiveContainer>
          </ChartCard>
        </section>
        <section className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
          <ChartCard titulo="Resultado final mensal" subtitulo="Verde positivo · vermelho negativo">
            <ResponsiveContainer width="100%" height="100%"><BarChart data={mensais}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="mes" tickFormatter={rotuloMes} fontSize={11} /><YAxis tickFormatter={(v) => `${numero.format(v / 1000)} mil`} fontSize={11} /><Tooltip formatter={(v: number) => moeda(v)} labelFormatter={rotuloMes} contentStyle={tooltipStyle} /><Bar dataKey="resultadoFinal" name="Resultado" radius={[4, 4, 0, 0]}>{mensais.map((item) => <Cell key={item.mes} fill={item.resultadoFinal >= 0 ? "var(--color-chart-3)" : "var(--color-destructive)"} />)}</Bar></BarChart></ResponsiveContainer>
          </ChartCard>
          <section className="card-elevated p-5"><h3 className="text-sm font-bold">Maiores contas de despesa</h3><p className="text-xs text-muted-foreground">Somatório no período selecionado</p><div className="mt-4 divide-y divide-border">{maiores.map((item, i) => <div key={item.name} className="flex items-center gap-3 py-2.5"><span className="w-5 text-xs text-muted-foreground">{i + 1}</span><span className="flex-1 text-sm">{item.name}</span><span className="font-mono text-xs font-semibold">{moeda(item.value)}</span></div>)}</div></section>
        </section>
      </TabsContent>

      <TabsContent value="dre" className="mt-5 space-y-4">
        <div className="flex flex-wrap gap-2">{meses.map((mes) => <Button key={mes} size="sm" variant={mesesDre.includes(mes) ? "default" : "outline"} onClick={() => alternarMes(mes)}>{rotuloMes(mes)}</Button>)}</div>
        <section className="card-elevated overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b border-border text-[10px] uppercase tracking-[0.08em] text-muted-foreground"><th className="sticky left-0 bg-card px-5 py-3 text-left">Linha</th>{colunasDre.map(({ mes }) => <th key={mes} colSpan={2} className="px-3 py-3 text-right">{rotuloMes(mes)}</th>)}</tr><tr className="border-b border-border text-[10px] text-muted-foreground"><th className="sticky left-0 bg-card" />{colunasDre.map(({ mes }) => <MemoCells key={mes} />)}</tr></thead><tbody>{linhasEbitda.map((linha) => <tr key={linha.chave} className="border-b border-border/70"><td className="sticky left-0 bg-card px-5 py-2.5 font-medium">{linha.label}</td>{colunasDre.map(({ mes, dados }) => <ValueCells key={mes} valor={linha.sinal * Math.abs(dados[linha.chave])} receita={dados.receitaBruta} />)}</tr>)}<TotalRow label="Lucro bruto" colunas={colunasDre} campo="resultadoBruto" /><TotalRow label="Despesas totais" colunas={colunasDre} campo="despesasTotais" /><TotalRow label="EBITDA" colunas={colunasDre} campo="ebitda" destaque /><TotalRow label="Resultado final" colunas={colunasDre} campo="resultadoFinal" destaque /></tbody></table></section>
      </TabsContent>

      <TabsContent value="comparativo" className="mt-5 space-y-5">
        <section className="grid gap-5 xl:grid-cols-[1fr_1.2fr]">
          <section className="card-elevated p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-bold">Ranking de postos</h3><p className="text-xs text-muted-foreground">Desempenho no período selecionado</p></div><select value={metrica} onChange={(e) => setMetrica(e.target.value as typeof metrica)} className="h-9 rounded-md border border-input bg-background px-3 text-xs"><option value="resultado">Resultado final</option><option value="ebitda">EBITDA</option><option value="receita">Receita bruta</option><option value="despesas">Despesas totais</option><option value="margem">Margem líquida</option></select></div><div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto">{ranking.map((item, i) => <div key={item.ibm} className="flex items-center gap-3 rounded-md bg-surface-muted px-3 py-2"><span className="text-xs font-bold text-muted-foreground">{i + 1}</span><span className="min-w-0 flex-1 truncate text-sm font-semibold">{item.nome}</span><span className="font-mono text-xs">{metrica === "margem" ? percentual(item.margem) : moeda(valorMetrica(item))}</span></div>)}</div></section>
          <ChartCard titulo="Margem líquida por posto" subtitulo="Resultado final sobre a receita bruta">
            <ResponsiveContainer width="100%" height="100%"><BarChart data={ranking.slice(0, 12)} layout="vertical" margin={{ left: 8 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tickFormatter={(v) => `${numero.format(v)}%`} fontSize={11} /><YAxis dataKey="nome" type="category" width={110} fontSize={10} tick={{ width: 105 }} /><Tooltip formatter={(v: number) => percentual(v)} contentStyle={tooltipStyle} /><Bar dataKey="margem" name="Margem" radius={[0, 4, 4, 0]}>{ranking.slice(0, 12).map((item) => <Cell key={item.ibm} fill={item.margem >= 0 ? "var(--color-chart-3)" : "var(--color-destructive)"} />)}</Bar></BarChart></ResponsiveContainer>
          </ChartCard>
        </section>
        <section className="card-elevated overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b border-border text-[10px] uppercase tracking-[0.08em] text-muted-foreground"><th className="px-5 py-3 text-left">Posto</th><th className="px-3 py-3 text-right">Receita bruta</th><th className="px-3 py-3 text-right">CMV %</th><th className="px-3 py-3 text-right">Despesas %</th><th className="px-3 py-3 text-right">Resultado final</th><th className="px-5 py-3 text-right">Margem %</th></tr></thead><tbody>{ranking.map((item) => <tr key={item.ibm} className="border-b border-border/70"><td className="px-5 py-3 font-semibold">{item.nome}</td><td className="px-3 py-3 text-right">{moeda(item.receitaBruta)}</td><td className="px-3 py-3 text-right">{percentual(razao(item.custo, item.receitaBruta))}</td><td className="px-3 py-3 text-right">{percentual(razao(item.despesasTotais, item.receitaBruta))}</td><td className={`px-3 py-3 text-right font-semibold ${item.resultadoFinal < 0 ? "text-destructive" : ""}`}>{moeda(item.resultadoFinal)}</td><td className="px-5 py-3 text-right font-semibold">{percentual(item.margem)}</td></tr>)}</tbody></table></section>
      </TabsContent>
    </Tabs>
  );
}

function ChartCard({ titulo, subtitulo, children }: { titulo: string; subtitulo: string; children: ReactNode }) {
  return <section className="card-elevated p-5"><h3 className="text-sm font-bold">{titulo}</h3><p className="text-xs text-muted-foreground">{subtitulo}</p><div className="mt-4 h-[280px]">{children}</div></section>;
}

function MemoCells() { return <><th className="px-3 py-2 text-right">Valor</th><th className="px-3 py-2 text-right">AV</th></>; }
function ValueCells({ valor, receita }: { valor: number; receita: number }) { return <><td className={`px-3 py-2.5 text-right font-mono text-xs ${valor < 0 ? "text-destructive" : ""}`}>{moeda(valor)}</td><td className="px-3 py-2.5 text-right text-xs text-muted-foreground">{percentual(razao(valor, receita))}</td></>; }
function TotalRow({ label, colunas, campo, destaque = false }: { label: string; colunas: { mes: string; dados: ReturnType<typeof calcularEbitda> & Record<LinhaEbitdaChave, number> }[]; campo: "resultadoBruto" | "despesasTotais" | "ebitda" | "resultadoFinal"; destaque?: boolean }) {
  return <tr className={destaque ? "border-t-2 border-foreground bg-brand-soft font-bold" : "bg-surface-muted font-bold"}><td className="sticky left-0 bg-inherit px-5 py-3">{label}</td>{colunas.map(({ mes, dados }) => <ValueCells key={mes} valor={dados[campo]} receita={dados.receitaBruta} />)}</tr>;
}