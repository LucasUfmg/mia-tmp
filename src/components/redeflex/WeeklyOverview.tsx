import { ArrowDownRight, ArrowUpRight, CalendarRange, Fuel, Minus, ShoppingBag, Target } from "lucide-react";
import type { DashboardData } from "@/lib/redeflex-dashboard";

const litros = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function Variation({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-xs font-medium text-muted-foreground">—</span>;
  }
  const up = value > 0;
  const flat = Math.abs(value) < 0.5;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  const tone = flat
    ? "bg-surface-muted text-muted-foreground"
    : up
      ? "bg-brand-soft text-brand"
      : "bg-destructive/10 text-destructive";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${tone}`}>
      <Icon className="h-3.5 w-3.5" />
      {up && !flat ? "+" : ""}
      {value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
    </span>
  );
}

type Props = {
  comparativo: DashboardData["comparativo"];
  projecao: DashboardData["projecao"];
  escopo: string;
  carregando?: boolean;
  corte?: string;
};

export function WeeklyOverview({ comparativo, projecao, escopo, carregando, corte }: Props) {
  const comparativoSemanal = comparativo;
  const projecaoMensal = projecao;
  const atual = comparativoSemanal[comparativoSemanal.length - 1];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
      <section className="card-elevated overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-6 py-4">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-brand">
            <CalendarRange className="h-4 w-4" />
            Comparativo semanal — mesmo dia
          </h2>
          <p className="text-xs text-muted-foreground">
            {escopo} · mesmo dia da semana · acumulado até {corte ?? "--:--"} em todos os dias
          </p>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-muted text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                <th className="px-6 py-2.5">Dia</th>
                <th className="px-6 py-2.5">Galonagem (L)</th>
                <th className="px-6 py-2.5">Variação</th>
                <th className="px-6 py-2.5">Produto (R$)</th>
                <th className="px-6 py-2.5">Variação</th>
              </tr>
            </thead>
            <tbody>
              {carregando && comparativoSemanal.length === 0 ? (
                <tr className="border-t border-border">
                  <td className="px-6 py-4 text-muted-foreground" colSpan={5}>
                    Carregando dados…
                  </td>
                </tr>
              ) : null}
              {comparativoSemanal.map((s) => (
                <tr key={s.dia} className="border-t border-border">
                  <td className="px-6 py-3 font-semibold">{s.dia}</td>
                  <td className="px-6 py-3 font-bold tabular-nums">{litros.format(s.galonagem)}</td>
                  <td className="px-6 py-3">
                    <Variation value={s.galonagemVar} />
                  </td>
                  <td className="px-6 py-3 font-bold tabular-nums">{reais.format(s.produto)}</td>
                  <td className="px-6 py-3">
                    <Variation value={s.produtoVar} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border bg-surface-muted px-6 py-3 text-xs text-muted-foreground">
          <span>
            Semana atual ({atual?.dia}): {litros.format(atual?.galonagem ?? 0)} L e{" "}
            {reais.format(atual?.produto ?? 0)} em produtos
          </span>
        </p>
      </section>

      <section className="card-elevated overflow-hidden">
        <header className="flex items-center gap-2 border-b border-border px-6 py-4">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-brand">
            <Target className="h-4 w-4" />
            Projeção mensal
          </h2>
        </header>

        <div className="grid grid-cols-1 divide-y divide-border">
          <div className="flex items-center gap-4 px-6 py-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Fuel className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Combustível
              </p>
              <p className="mt-0.5 text-3xl font-extrabold tracking-tight tabular-nums">
                {litros.format(projecaoMensal.combustivel)}
              </p>
              <p className="text-xs text-muted-foreground">litros projetados no mês</p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-6 py-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Produto
              </p>
              <p className="mt-0.5 text-3xl font-extrabold tracking-tight tabular-nums">
                {reais.format(projecaoMensal.produto)}
              </p>
              <p className="text-xs text-muted-foreground">receita projetada no mês</p>
            </div>
          </div>
        </div>

        <p className="border-t border-border bg-surface-muted px-6 py-3 text-xs text-muted-foreground">
          Base: acumulado até {projecaoMensal.referencia}
        </p>
      </section>
    </div>
  );
}
