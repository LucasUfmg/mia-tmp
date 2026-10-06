import { useMemo, useState, type ReactNode } from "react";
import { CircleDollarSign, Gauge, Landmark, ReceiptText, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { comSinal, consolidarEbitda, linhasDre, rotuloComSinal, type DreConsolidada, type Ebitda, type LinhaEbitdaChave } from "@/lib/ebitda";
import { rotuloMes } from "@/lib/contabil";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const numero = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const moeda = (v: number) => brl.format(v);
const percentual = (v: number | null) => (v === null ? "—" : `${numero.format(v)}%`);
const razao = (a: number, b: number) => (b ? (a / b) * 100 : null);
const cores = [
  "var(--pie-1)", "var(--pie-2)", "var(--pie-3)", "var(--pie-4)", "var(--pie-5)",
  "var(--pie-6)", "var(--pie-7)", "var(--pie-8)", "var(--pie-9)",
];

type Props = {
  calculos: Ebitda[];
  /** Mesmos registros, com receita do BI cortada no mesmo dia/hora de agora. */
  calculosMesmoPeriodo?: Ebitda[];
  biStatus?: "ok" | "carregando" | "erro";
  onRecarregarBi?: () => void;
  selecao: string[];
  meses: string[];
  mesAtual: string;
  lojas: { ibm: string; nome: string }[];
};

function rotuloCorte() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })
      .formatToParts(new Date())
      .map((x) => [x.type, x.value]),
  );
  return `Acumulado até dia ${p["day"]}, ${p["hour"]}:${p["minute"]}, de cada mês`;
}

const despesas: { chave: LinhaEbitdaChave; label: string }[] = [
  { chave: "despesasPessoal", label: "Pessoal" },
  { chave: "administrativas", label: "Operação/Adm." },
  { chave: "aluguel", label: "Aluguel" },
  { chave: "taxasCartao", label: "Taxas de Cartão" },
  { chave: "frete", label: "Frete" },
  { chave: "despesasTributarias", label: "Tributárias" },
  { chave: "despesasFinanceiras", label: "Financeiras" },
  { chave: "despesasNaoContabeis", label: "Não operacionais" },
  { chave: "despesasGestao", label: "Gestão" },
  { chave: "despesaDistribuidora", label: "Distribuidora" },
  { chave: "overAluguel", label: "Over aluguel" },
];

const mesAnterior = (m: string) => {
  const [a, mm] = m.split("-").map(Number);
  const d = new Date(Date.UTC(a!, mm! - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
};

function Card({ icon: Icon, label, valor, detalhe, variacao, inverter, comparacao = "vs mês anterior" }: { icon: typeof TrendingUp; label: string; valor: string; detalhe: string; variacao?: number | null; inverter?: boolean; comparacao?: string }) {
  const bom = variacao != null && (inverter ? variacao <= 0 : variacao >= 0);
  return (
    <article className="card-elevated min-w-0 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-brand" />
      </div>
      <p className="mt-3 whitespace-nowrap text-xl font-extrabold tabular-nums 2xl:text-2xl">{valor}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{detalhe}</p>
      <p className={`mt-1 text-[11px] font-bold ${variacao == null ? "text-muted-foreground" : bom ? "text-wa" : "text-destructive"}`}>
        {variacao == null ? `— ${comparacao}` : `${variacao >= 0 ? "▲" : "▼"} ${numero.format(Math.abs(variacao))}% ${comparacao}`}
      </p>
    </article>
  );
}

const tooltipStyle = { borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 };

export function DreDashboard({ calculos, calculosMesmoPeriodo, biStatus = "ok", onRecarregarBi, selecao, meses, mesAtual, lojas }: Props) {
  const [mesesDre, setMesesDre] = useState<string[]>([mesAtual]);
  const [metrica, setMetrica] = useState<"resultado" | "ebitda" | "receita" | "despesas" | "margem">("resultado");
  const consolidado = useMemo(() => consolidarEbitda(calculos, selecao, meses), [calculos, selecao, meses]);
  // Evolução: todos os meses até o selecionado que tenham dados (últimos 12).
  const mensais = useMemo(() => {
    const todos = [...new Set(calculos.map((c) => c.mes))].filter((m) => m <= mesAtual).sort();
    return todos
      .map((mes) => ({ mes, ...consolidarEbitda(calculos, selecao, [mes]) }))
      .filter((d) => d.receitaBruta || d.resultadoFinal)
      .slice(-12);
  }, [calculos, selecao, mesAtual]);
  const serieReceita = useMemo(() => {
    if (!calculosMesmoPeriodo) return mensais;
    return mensais.map((m) => {
      const c = consolidarEbitda(calculosMesmoPeriodo, selecao, [m.mes]);
      // Receita: acumulada até o mesmo dia/hora. Resultado final: mês fechado
      // (despesas são fixas e não podem ser fatiadas por dia).
      return { mes: m.mes, receitaBruta: c.receitaBruta, resultadoFinal: m.resultadoFinal };
    });
  }, [mensais, calculosMesmoPeriodo, selecao]);
  const mesesAnt = useMemo(() => meses.length > 1 ? meses.slice(0, -1) : meses.map(mesAnterior), [meses]);
  // Mês corrente (parcial): compara com o mês anterior cortado no mesmo dia/hora.
  // Despesas seguem do mês inteiro (são fixas).
  const mesCorrenteSp = `${new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" }).format(new Date())}-01`;
  const usaCorte = !!calculosMesmoPeriodo && meses.length === 1 && meses[0] === mesCorrenteSp;
  const anterior = useMemo(
    () => consolidarEbitda(usaCorte ? calculosMesmoPeriodo! : calculos, selecao, mesesAnt),
    [usaCorte, calculosMesmoPeriodo, calculos, selecao, mesesAnt],
  );
  const rotuloComparacao = usaCorte ? "vs mesmo período do mês anterior" : "vs mês anterior";
  const varia = (a: number, b: number) => (b ? ((a - b) / Math.abs(b)) * 100 : null);
  const composicao = despesas.map((item) => ({ name: item.label, value: Math.abs(consolidado[item.chave]) }));
  const maiores = [...composicao].sort((a, b) => b.value - a.value);
  const cards = [
    { icon: CircleDollarSign, label: "Receita bruta", valor: moeda(consolidado.receitaBruta), detalhe: "Vendas vindas do BI", variacao: varia(consolidado.receitaBruta, anterior.receitaBruta) },
    { icon: ReceiptText, label: "CMV", valor: moeda(Math.abs(consolidado.custo)), detalhe: percentual(razao(Math.abs(consolidado.custo), consolidado.receitaBruta)) + " da receita · BI", variacao: varia(Math.abs(consolidado.custo), Math.abs(anterior.custo)), inverter: true },
    { icon: TrendingUp, label: "Result. Operacional Bruto", valor: moeda(consolidado.resultadoBruto), detalhe: "Receita bruta − CMV", variacao: varia(consolidado.resultadoBruto, anterior.resultadoBruto) },
    { icon: ReceiptText, label: "Despesas totais", valor: moeda(consolidado.despesasTotais), detalhe: percentual(razao(consolidado.despesasTotais, consolidado.receitaBruta)) + " da receita", variacao: varia(consolidado.despesasTotais, anterior.despesasTotais), inverter: true },
    { icon: Gauge, label: "EBITDA", valor: moeda(consolidado.ebitda), detalhe: "Result. Operacional Bruto − Despesas totais", variacao: varia(consolidado.ebitda, anterior.ebitda) },
    { icon: Landmark, label: "Resultado final", valor: moeda(consolidado.resultadoFinal), detalhe: consolidado.resultadoFinal >= 0 ? "Resultado positivo" : "Resultado negativo", variacao: varia(consolidado.resultadoFinal, anterior.resultadoFinal) },
  ];

  const alternarMes = (mes: string) => setMesesDre((atuais) => atuais.includes(mes) ? (atuais.length === 1 ? atuais : atuais.filter((m) => m !== mes)) : [...atuais, mes].sort());
  const colunasDre = mesesDre.map((mes) => ({ mes, dados: consolidarEbitda(calculos, selecao, [mes]) }));
  const nomePosto = (ibm: string) => lojas.find((loja) => loja.ibm === ibm)?.nome ?? ibm;
  const porPosto = useMemo(() => {
    const baseReceita = consolidado.receitaBruta > 0 ? consolidado.receitaBruta / Math.max(lojas.length, 1) : 1_250_000;
    const hash = (texto: string) => [...texto].reduce((n, letra) => (n * 31 + letra.charCodeAt(0)) >>> 0, 2166136261);
    return lojas.map((loja) => {
      const semente = hash(`${loja.ibm}|${mesAtual}`);
      const fator = 0.72 + (semente % 57) / 100;
      const receitaBruta = baseReceita * fator;
      const custo = receitaBruta * (0.76 + ((semente >> 4) % 11) / 100);
      const despesasTotais = receitaBruta * (0.08 + ((semente >> 8) % 8) / 100);
      const ebitda = receitaBruta - custo - despesasTotais;
      const resultadoFinal = ebitda - receitaBruta * (((semente >> 12) % 4) / 100);
      return { ibm: loja.ibm, nome: loja.nome, receitaBruta, custo, despesasTotais, ebitda, resultadoFinal, margem: razao(resultadoFinal, receitaBruta) ?? 0 };
    });
  }, [consolidado.receitaBruta, lojas, mesAtual]);
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
        {biStatus === "erro" && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            Não foi possível carregar receita e CMV do BI.
            <button onClick={onRecarregarBi} className="rounded-full bg-destructive px-3 py-1 font-bold text-destructive-foreground">Tentar novamente</button>
          </div>
        )}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">{cards.map((card) => <Card key={card.label} {...card} comparacao={rotuloComparacao} {...(biStatus !== "ok" ? { valor: biStatus === "carregando" ? "carregando…" : "—", variacao: null } : {})} />)}</section>
        <section className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
          <ChartCard titulo="Evolução da receita" subtitulo={calculosMesmoPeriodo ? rotuloCorte() : "Receita bruta por mês"}>
            <ResponsiveContainer width="100%" height="100%"><LineChart data={serieReceita}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="mes" tickFormatter={rotuloMes} fontSize={11} /><YAxis tickFormatter={(v) => `${numero.format(v / 1_000_000)} mi`} fontSize={11} /><Tooltip formatter={(v: number) => moeda(v)} labelFormatter={rotuloMes} contentStyle={tooltipStyle} /><Line dataKey="receitaBruta" name="Receita" stroke="var(--color-chart-1)" strokeWidth={3} dot={{ r: 3 }} /></LineChart></ResponsiveContainer>
          </ChartCard>
          <ChartCard titulo="Composição das despesas" subtitulo="Participação por rubrica no período">
            <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={composicao} dataKey="value" nameKey="name" innerRadius="50%" outerRadius="78%" paddingAngle={1.5}>{composicao.map((item, i) => <Cell key={item.name} fill={cores[i % cores.length]} />)}</Pie><Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 11 }} formatter={(value: string) => <span style={{ color: "var(--foreground)" }}>{value}</span>} /><Tooltip formatter={(v: number) => moeda(v)} contentStyle={tooltipStyle} /></PieChart></ResponsiveContainer>
          </ChartCard>
        </section>
        <section className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
          <ChartCard titulo="Resultado final mensal" subtitulo="Mês fechado · verde positivo, vermelho negativo">
            <ResponsiveContainer width="100%" height="100%"><BarChart data={serieReceita}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="mes" tickFormatter={rotuloMes} fontSize={11} /><YAxis tickFormatter={(v) => `${numero.format(v / 1000)} mil`} fontSize={11} /><Tooltip formatter={(v: number) => moeda(v)} labelFormatter={rotuloMes} contentStyle={tooltipStyle} /><Bar dataKey="resultadoFinal" name="Resultado" radius={[4, 4, 0, 0]}>{serieReceita.map((item) => <Cell key={item.mes} fill={item.resultadoFinal >= 0 ? "var(--color-chart-3)" : "var(--color-destructive)"} />)}</Bar></BarChart></ResponsiveContainer>
          </ChartCard>
          <section className="card-elevated p-5"><h3 className="text-sm font-bold">Maiores contas de despesa</h3><p className="text-xs text-muted-foreground">Somatório no período selecionado</p><div className="mt-4 divide-y divide-border">{maiores.map((item, i) => <div key={item.name} className="flex items-center gap-3 py-2.5"><span className="w-5 text-xs text-muted-foreground">{i + 1}</span><span className="flex-1 text-sm">{item.name}</span><span className="font-mono text-xs font-semibold">{moeda(item.value)}</span></div>)}</div></section>
        </section>
      </TabsContent>

      <TabsContent value="dre" className="mt-5 space-y-4">
        <div className="flex flex-wrap gap-2">{meses.map((mes) => <Button key={mes} size="sm" variant={mesesDre.includes(mes) ? "default" : "outline"} onClick={() => alternarMes(mes)}>{rotuloMes(mes)}</Button>)}</div>
         <section className="card-elevated overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b border-border text-[10px] uppercase tracking-[0.08em] text-muted-foreground"><th className="sticky left-0 bg-card px-5 py-3 text-left">Linha</th>{colunasDre.map(({ mes }) => <th key={mes} colSpan={2} className="px-3 py-3 text-right">{rotuloMes(mes)}</th>)}</tr><tr className="border-b border-border text-[10px] text-muted-foreground"><th className="sticky left-0 bg-card" />{colunasDre.map(({ mes }) => <MemoCells key={mes} />)}</tr></thead><tbody>{linhasDre.map((linha, indice) => <DreRow key={`${linha.label}-${indice}`} linha={linha} colunas={colunasDre} />)}</tbody></table></section>
      </TabsContent>

      <TabsContent value="comparativo" className="mt-5 space-y-5">
        <div className="rounded-md border border-gold bg-gold-soft px-4 py-3 text-xs font-semibold text-gold-foreground">Dados simulados para demonstração. Nenhum valor desta área é salvo.</div>
        <section className="grid gap-5">
          <section className="card-elevated p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-bold">Ranking de postos</h3><p className="text-xs text-muted-foreground">Desempenho no período selecionado</p></div><Select value={metrica} onValueChange={(valor) => setMetrica(valor as typeof metrica)}><SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="resultado">Resultado final</SelectItem><SelectItem value="ebitda">EBITDA</SelectItem><SelectItem value="receita">Receita bruta</SelectItem><SelectItem value="despesas">Despesas totais</SelectItem><SelectItem value="margem">Margem líquida</SelectItem></SelectContent></Select></div><div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto">{ranking.map((item, i) => <div key={item.ibm} className="flex items-center gap-3 rounded-md bg-surface-muted px-3 py-2"><span className="text-xs font-bold text-muted-foreground">{i + 1}</span><span className="min-w-0 flex-1 truncate text-sm font-semibold">{item.nome}</span><span className="font-mono text-xs">{metrica === "margem" ? percentual(item.margem) : moeda(valorMetrica(item))}</span></div>)}</div></section>
          <ChartCard titulo="Margem líquida por posto" subtitulo="Resultado final sobre a receita bruta" altura="h-[420px]">
            <ResponsiveContainer width="100%" height="100%"><BarChart data={ranking.slice(0, 12)} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 8 }} barCategoryGap="30%"><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tickFormatter={(v) => `${numero.format(v)}%`} fontSize={11} tickMargin={8} /><YAxis dataKey="nome" type="category" width={220} fontSize={12} tickLine={false} axisLine={false} tickMargin={10} interval={0} tickFormatter={(nome: string) => (nome.length > 30 ? `${nome.slice(0, 29)}…` : nome)} /><Tooltip formatter={(v: number) => percentual(v)} contentStyle={tooltipStyle} /><Bar dataKey="margem" name="Margem" radius={[0, 4, 4, 0]} maxBarSize={22}>{ranking.slice(0, 12).map((item) => <Cell key={item.ibm} fill={item.margem >= 0 ? "var(--color-chart-3)" : "var(--color-destructive)"} />)}</Bar></BarChart></ResponsiveContainer>
          </ChartCard>
        </section>
        <section className="card-elevated overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead><tr className="border-b border-border text-[10px] uppercase tracking-[0.08em] text-muted-foreground"><th className="px-5 py-3 text-left">Posto</th><th className="px-3 py-3 text-right">Receita bruta</th><th className="px-3 py-3 text-right">CMV %</th><th className="px-3 py-3 text-right">Despesas %</th><th className="px-3 py-3 text-right">Resultado final</th><th className="px-3 py-3 text-right">Margem %</th><th className="px-5 py-3 text-right">Tendência</th></tr></thead><tbody>{ranking.map((item, indice) => <tr key={item.ibm} className="border-b border-border/70"><td className="px-5 py-3 font-semibold">{item.nome}</td><td className="px-3 py-3 text-right">{moeda(item.receitaBruta)}</td><td className="px-3 py-3 text-right">{percentual(razao(item.custo, item.receitaBruta))}</td><td className="px-3 py-3 text-right">{percentual(razao(item.despesasTotais, item.receitaBruta))}</td><td className={`px-3 py-3 text-right font-semibold ${item.resultadoFinal < 0 ? "text-destructive" : "text-wa"}`}>{moeda(item.resultadoFinal)}</td><td className="px-3 py-3 text-right font-semibold">{percentual(item.margem)}</td><td className={`px-5 py-3 text-right font-bold ${indice % 4 === 0 ? "text-destructive" : "text-wa"}`}>{indice % 4 === 0 ? "▼" : "▲"} {numero.format(1.5 + (indice % 7) * 0.7)}%</td></tr>)}</tbody></table></section>
      </TabsContent>
    </Tabs>
  );
}

function ChartCard({ titulo, subtitulo, children, altura = "h-[280px]" }: { titulo: string; subtitulo: string; children: ReactNode; altura?: string }) {
  return <section className="card-elevated p-5"><h3 className="text-sm font-bold">{titulo}</h3><p className="text-xs text-muted-foreground">{subtitulo}</p><div className={`mt-4 ${altura}`}>{children}</div></section>;
}

function MemoCells() { return <><th className="px-3 py-2 text-right">Valor</th><th className="px-3 py-2 text-right">AV</th></>; }
function ValueCells({ valor, receita }: { valor: number; receita: number }) { return <><td className={`px-3 py-2.5 text-right font-mono text-xs ${valor < 0 ? "text-destructive" : valor > 0 ? "text-wa" : ""}`}>{moeda(valor)}</td><td className="px-3 py-2.5 text-right text-xs text-muted-foreground">{percentual(razao(valor, receita))}</td></>; }
function DreRow({ linha, colunas }: { linha: (typeof linhasDre)[number]; colunas: { mes: string; dados: DreConsolidada }[] }) {
  const destaque = linha.tipo === "total";
  const grupo = linha.tipo === "grupo";
  const metrica = linha.tipo === "metrica";
  const valor = (dados: DreConsolidada) => {
    if (linha.tipo === "manual") return comSinal(linha.chave, dados[linha.chave]);
    if (linha.tipo === "bi") return dados[linha.campo] * (linha.sinal ?? 1);
    return dados[linha.campo];
  };
  const exibir = (dados: DreConsolidada) => metrica && (linha.campo === "margemProduto" || linha.campo === "margemCombustivel") ? percentual(valor(dados)) : metrica ? numero.format(valor(dados)) : moeda(valor(dados));
  const rotulo = linha.tipo === "manual"
    ? rotuloComSinal(linha.chave, linha.label)
    : linha.tipo === "bi"
      ? `(${linha.sinal === -1 ? "−" : "+"}) ${linha.label}`
      : linha.label;
   return <tr className={destaque ? "border-t-2 border-foreground bg-brand-soft font-bold" : grupo ? "bg-surface-muted font-bold" : metrica ? "bg-surface-muted/70 font-semibold italic" : "border-b border-border/70"}><td className={`sticky left-0 bg-inherit px-5 py-2.5 ${!grupo && !destaque && !metrica ? "pl-8 text-muted-foreground" : ""}`}>{rotulo}</td>{colunas.map(({ mes, dados }) => <ValuePair key={mes} mes={mes} dados={dados} metrica={metrica} valor={valor(dados)} exibir={exibir(dados)} />)}</tr>;
}

function ValuePair({ dados, metrica, valor, exibir }: { mes: string; dados: DreConsolidada; metrica: boolean; valor: number; exibir: string }) {
  return <><td className={`px-3 py-2.5 text-right font-mono text-xs ${valor < 0 ? "text-destructive" : valor > 0 && !metrica ? "text-wa" : ""}`}>{exibir}</td><td className="px-3 py-2.5 text-right text-xs text-muted-foreground">{metrica ? "—" : percentual(razao(valor, dados.receitaBruta))}</td></>;
}