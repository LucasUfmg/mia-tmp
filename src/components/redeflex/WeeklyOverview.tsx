import { ArrowDownRight, ArrowUpRight, CalendarRange, Fuel, Minus, ShoppingBag, Target } from "lucide-react";
import type { DashboardData } from "@/lib/redeflex-dashboard";

const litros = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const reais2 = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const num2 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
function fmt(v: number, f: string): string {
  if (f === "reais") return reais.format(v);
  if (f === "reais2") return reais2.format(v);
  if (f === "pct") return `${num2.format(v)}%`;
  if (f === "num2") return num2.format(v);
  return litros.format(v);
}

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
  periodo?: DashboardData["periodo"];
};

export function WeeklyOverview({
  comparativo,
  projecao,
  escopo,
  carregando,
  corte,
  periodo = "diario", // [MENSAL DESATIVADO] default era "mensal"
}: Props) {
  const comparativoSemanal = comparativo;
  const projecaoMensal = projecao;
  const atual = comparativoSemanal[comparativoSemanal.length - 1];
  const diario = periodo === "diario";
  const tituloComparativo = diario
    ? "Comparativo semanal — mesmo dia"
    : "Comparativo mensal — mesmo período";
  const notaComparativo = diario
    ? `${escopo} · mesmo dia da semana · acumulado até ${corte ?? "--:--"} em todos os dias`
    : `${escopo} · dia 1 até hoje · dia corrente acumulado até ${corte ?? "--:--"}`;
  const colunaPeriodo = diario ? "Dia" : "Mês";
  const tituloProjecao = diario ? "Projeção do dia" : "Projeção mensal";
  const notaCombustivel = diario ? "litros projetados hoje" : "litros projetados no mês";
  const notaProduto = diario ? "receita projetada hoje" : "receita projetada no mês";

  return (
    <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
      <section className="card-elevated min-w-0 overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-4 sm:px-6">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-brand">
            <CalendarRange className="h-4 w-4" />
            {tituloComparativo}
          </h2>
          <p className="text-xs text-muted-foreground">{notaComparativo}</p>
        </header>

        <div className="w-full max-w-full overflow-x-auto [scrollbar-width:thin]">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="bg-surface-muted text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                <th className="whitespace-nowrap px-3 py-2.5 sm:px-6">{colunaPeriodo}</th>
                <th className="whitespace-nowrap px-3 py-2.5 sm:px-6">Galonagem (L)</th>
                <th className="whitespace-nowrap px-3 py-2.5 sm:px-6">Variação</th>
                <th className="whitespace-nowrap px-3 py-2.5 sm:px-6">Produto (R$)</th>
                <th className="whitespace-nowrap px-3 py-2.5 sm:px-6">Variação</th>
              </tr>
            </thead>
            <tbody>
              {carregando && comparativoSemanal.length === 0 ? (
                <tr className="border-t border-border">
                  <td className="px-3 py-4 text-muted-foreground sm:px-6" colSpan={5}>
                    Carregando dados…
                  </td>
                </tr>
              ) : null}
              {comparativoSemanal.map((s) => (
                <tr key={s.dia} className="border-t border-border">
                  <td className="whitespace-nowrap px-3 py-3 font-semibold sm:px-6">{s.dia}</td>
                  <td className="whitespace-nowrap px-3 py-3 font-bold tabular-nums sm:px-6">
                    {litros.format(s.galonagem)}
                  </td>
                  <td className="px-3 py-3 sm:px-6">
                    <Variation value={s.galonagemVar} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 font-bold tabular-nums sm:px-6">
                    {reais.format(s.produto)}
                  </td>
                  <td className="px-3 py-3 sm:px-6">
                    <Variation value={s.produtoVar} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border px-4 pt-2 text-[11px] text-muted-foreground sm:hidden">
          Arraste a tabela para o lado para ver Produto e variação.
        </p>

        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border bg-surface-muted px-4 py-3 text-xs text-muted-foreground sm:px-6">
          <span>
            {diario ? "Semana atual" : "Mês atual"} ({atual?.dia}):{" "}
            {litros.format(atual?.galonagem ?? 0)} L e{" "}
            {reais.format(atual?.produto ?? 0)} em produtos
          </span>
        </p>
      </section>

      <section className="card-elevated min-w-0 overflow-hidden">
        <header className="flex items-center gap-2 border-b border-border px-4 py-4 sm:px-6">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-brand">
            <Target className="h-4 w-4" />
            {tituloProjecao}
          </h2>
        </header>

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="bg-surface-muted text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                <th className="px-3 py-2.5">Indicador</th>
                <th className="px-3 py-2.5">Até agora</th>
                <th className="px-3 py-2.5">Projeção</th>
                <th className="px-3 py-2.5">Meta</th>
              </tr>
            </thead>
            <tbody>
              {(projecaoMensal.itens ?? []).map((i) => {
                const tom =
                  i.variacaoPct === null
                    ? "text-muted-foreground"
                    : i.variacaoPct >= 0
                      ? "text-brand"
                      : "text-destructive";
                return (
                  <tr key={i.chave} className="border-t border-border">
                    <td className="whitespace-nowrap px-3 py-2 font-semibold">{i.label}</td>
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums">{fmt(i.realizado, i.formato)}</td>
                    <td className={`whitespace-nowrap px-3 py-2 font-bold tabular-nums ${tom}`}>
                      {fmt(i.projecao, i.formato)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                      {i.meta === null ? "—" : fmt(i.meta, i.formato)}
                      {i.variacaoPct !== null ? (
                        <span className={`ml-1 text-xs font-bold ${tom}`}>
                          ({i.variacaoPct >= 0 ? "+" : ""}
                          {i.variacaoPct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%)
                        </span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
              {(projecaoMensal.itens ?? []).length === 0 ? (
                <tr className="border-t border-border">
                  <td colSpan={4} className="px-3 py-4 text-muted-foreground">Carregando…</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <p className="border-t border-border bg-surface-muted px-4 py-3 text-xs text-muted-foreground sm:px-6">
          Projeção = realizado + (realizado ÷ {diario ? "horas decorridas" : "dias decorridos"}) ×{" "}
          {diario ? "horas restantes do dia" : "dias restantes do mês"}. Base: até {projecaoMensal.referencia}.
          Meta: {projecaoMensal.metaLabel ?? "—"}.
        </p>
      </section>
    </div>
  );
}
