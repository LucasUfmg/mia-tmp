import { Percent, PiggyBank, Target, TrendingUp } from "lucide-react";
import type { Consolidado } from "@/lib/contabil";

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});
const num2 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

export const pct = (v: number | null) => (v === null ? "—" : `${num2.format(v)}%`);

/** R$ 20.000.000 → "R$ 20,0 mi" para caber nos cartões. */
function compacto(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `R$ ${num2.format(v / 1_000_000)} mi`;
  if (abs >= 1_000) return `R$ ${num2.format(v / 1_000)} mil`;
  return brl.format(v);
}

type Props = { dados: Consolidado };

export function ContabilCards({ dados }: Props) {
  const cards = [
    {
      icon: PiggyBank,
      label: "ROE",
      titulo: "Retorno sobre o patrimônio líquido",
      valor: pct(dados.roe),
      formula: `${compacto(dados.lucroLiquido)} ÷ ${compacto(dados.plMedio)} (PL médio)`,
      leitura:
        dados.roe === null
          ? "Informe o patrimônio líquido inicial e final para calcular."
          : `Cada R$ 1,00 de capital próprio gerou R$ ${num2.format(dados.roe / 100)} de lucro.`,
    },
    {
      icon: Target,
      label: "ROIC",
      titulo: "Retorno sobre o capital investido",
      valor: pct(dados.roic),
      formula: `NOPAT ${compacto(dados.nopat)} ÷ ${compacto(dados.capitalInvestido)} investidos`,
      leitura:
        dados.roic === null
          ? "Informe EBIT, PL, dívida e caixa para calcular."
          : `Cada R$ 1,00 investido na operação gerou R$ ${num2.format(dados.roic / 100)} após impostos.`,
    },
    {
      icon: Percent,
      label: "Margem líquida",
      titulo: "Lucro que sobra da receita",
      valor: pct(dados.margemLiquida),
      formula: `${compacto(dados.lucroLiquido)} ÷ ${compacto(dados.receitaLiquida)} de receita`,
      leitura:
        dados.margemLiquida === null
          ? "Informe a receita líquida para calcular."
          : `De cada R$ 100,00 vendidos, R$ ${num2.format(dados.margemLiquida)} viraram lucro líquido.`,
    },
    {
      icon: TrendingUp,
      label: "Margem EBITDA",
      titulo: "Eficiência operacional",
      valor: pct(dados.margemEbitda),
      formula: `${compacto(dados.ebitda)} ÷ ${compacto(dados.receitaLiquida)} de receita`,
      leitura:
        dados.margemEbitda === null
          ? "Informe a receita líquida e o EBITDA para calcular."
          : `Cada R$ 100,00 de receita geraram R$ ${num2.format(dados.margemEbitda)} de EBITDA.`,
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ icon: Icon, label, titulo, valor, formula, leitura }) => (
        <article key={label} className="card-elevated flex flex-col gap-3 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-soft text-gold-foreground">
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {label}
              </p>
              <p className="truncate text-xs text-muted-foreground">{titulo}</p>
            </div>
          </div>
          <p className="text-3xl font-extrabold tracking-tight">{valor}</p>
          <p className="text-xs font-semibold text-muted-foreground">{formula}</p>
          <p className="text-xs text-muted-foreground">{leitura}</p>
        </article>
      ))}
    </section>
  );
}

type WaccProps = { dados: Consolidado };

export function RoicVsWacc({ dados }: WaccProps) {
  const { roic, wacc } = dados;
  const indefinido = roic === null || !wacc;
  const diferenca = indefinido ? 0 : roic - wacc;
  const estado = indefinido
    ? { titulo: "Comparação indisponível", cor: "text-muted-foreground" }
    : diferenca > 0.05
      ? { titulo: "Criando valor", cor: "text-emerald-600" }
      : diferenca < -0.05
        ? { titulo: "Destruindo valor econômico", cor: "text-destructive" }
        : { titulo: "Apenas remunerando o capital", cor: "text-muted-foreground" };

  return (
    <section className="card-elevated p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        ROIC vs WACC
      </p>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <p className="text-2xl font-extrabold tracking-tight">
          ROIC {pct(roic)} <span className="text-muted-foreground">vs</span> WACC{" "}
          {wacc ? pct(wacc) : "—"}
        </p>
        <p className={`text-sm font-bold ${estado.cor}`}>{estado.titulo}</p>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {indefinido
          ? "Informe o WACC nos lançamentos para comparar o retorno com o custo de capital."
          : `Diferença de ${num2.format(diferenca)} p.p. entre o retorno do capital investido e o custo de capital.`}
      </p>
    </section>
  );
}
