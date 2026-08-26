import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { consolidar, rotuloMes, type Consolidado, type Lancamento } from "@/lib/contabil";
import { pct } from "./ContabilCards";

const brl0 = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export type LinhaMes = { mes: string; dados: Consolidado };

/** Uma linha por mês do ano, consolidando os postos do escopo. */
export function linhasPorMes(linhas: Lancamento[], meses: string[]): LinhaMes[] {
  return meses
    .map((mes) => ({ mes, linhas: linhas.filter((l) => l.mes === mes) }))
    .filter((m) => m.linhas.length > 0)
    .map(({ mes, linhas: doMes }) => ({ mes, dados: consolidar(doMes) }));
}

type Props = { linhas: LinhaMes[]; total: Consolidado; totalLabel: string };

export function ContabilTabela({ linhas, total, totalLabel }: Props) {
  if (linhas.length === 0) {
    return (
      <section className="card-elevated p-6">
        <p className="text-sm font-semibold">Nenhum lançamento contábil no ano</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Use “Lançar dados contábeis” para informar receita, lucro, EBITDA, EBIT, patrimônio
          líquido, dívida, caixa e WACC de cada posto por mês.
        </p>
      </section>
    );
  }

  const serie = linhas.map(({ mes, dados }) => ({
    mes: rotuloMes(mes),
    ROE: dados.roe ?? 0,
    ROIC: dados.roic ?? 0,
    "Margem líquida": dados.margemLiquida ?? 0,
    "Margem EBITDA": dados.margemEbitda ?? 0,
  }));

  return (
    <div className="grid gap-6">
      <section className="card-elevated overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <p className="text-sm font-bold">Detalhamento mensal</p>
          <p className="text-xs text-muted-foreground">
            Valores consolidados dos postos selecionados
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Mês</th>
                <th className="px-3 py-3 text-right font-semibold">Receita</th>
                <th className="px-3 py-3 text-right font-semibold">Lucro líquido</th>
                <th className="px-3 py-3 text-right font-semibold">EBITDA</th>
                <th className="px-3 py-3 text-right font-semibold">EBIT</th>
                <th className="px-3 py-3 text-right font-semibold">ROE</th>
                <th className="px-3 py-3 text-right font-semibold">ROIC</th>
                <th className="px-3 py-3 text-right font-semibold">M. líquida</th>
                <th className="px-5 py-3 text-right font-semibold">M. EBITDA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {linhas.map(({ mes, dados }) => (
                <tr key={mes}>
                  <td className="px-5 py-3 font-semibold">{rotuloMes(mes)}</td>
                  <td className="px-3 py-3 text-right">{brl0.format(dados.receitaLiquida)}</td>
                  <td className="px-3 py-3 text-right">{brl0.format(dados.lucroLiquido)}</td>
                  <td className="px-3 py-3 text-right">{brl0.format(dados.ebitda)}</td>
                  <td className="px-3 py-3 text-right">{brl0.format(dados.ebit)}</td>
                  <td className="px-3 py-3 text-right font-semibold">{pct(dados.roe)}</td>
                  <td className="px-3 py-3 text-right font-semibold">{pct(dados.roic)}</td>
                  <td className="px-3 py-3 text-right">{pct(dados.margemLiquida)}</td>
                  <td className="px-5 py-3 text-right">{pct(dados.margemEbitda)}</td>
                </tr>
              ))}
              <tr className="bg-surface-muted font-bold">
                <td className="px-5 py-3">{totalLabel}</td>
                <td className="px-3 py-3 text-right">{brl0.format(total.receitaLiquida)}</td>
                <td className="px-3 py-3 text-right">{brl0.format(total.lucroLiquido)}</td>
                <td className="px-3 py-3 text-right">{brl0.format(total.ebitda)}</td>
                <td className="px-3 py-3 text-right">{brl0.format(total.ebit)}</td>
                <td className="px-3 py-3 text-right">{pct(total.roe)}</td>
                <td className="px-3 py-3 text-right">{pct(total.roic)}</td>
                <td className="px-3 py-3 text-right">{pct(total.margemLiquida)}</td>
                <td className="px-5 py-3 text-right">{pct(total.margemEbitda)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="card-elevated p-5">
        <p className="text-sm font-bold">Evolução dos indicadores</p>
        <p className="text-xs text-muted-foreground">Percentual por mês</p>
        <div className="mt-4 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={serie} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis
                tickFormatter={(v: number) => `${v}%`}
                tickLine={false}
                axisLine={false}
                fontSize={12}
              />
              <Tooltip
                formatter={(v: number) => pct(v)}
                contentStyle={{ borderRadius: 12, fontSize: 12 }}
              />
              <Line type="monotone" dataKey="ROE" stroke="var(--color-chart-1)" strokeWidth={2} />
              <Line type="monotone" dataKey="ROIC" stroke="var(--color-chart-2)" strokeWidth={2} />
              <Line
                type="monotone"
                dataKey="Margem líquida"
                stroke="var(--color-chart-3)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="Margem EBITDA"
                stroke="var(--color-chart-4)"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
          {["ROE", "ROIC", "Margem líquida", "Margem EBITDA"].map((nome, i) => (
            <span key={nome} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: `var(--color-chart-${i + 1})` }}
              />
              {nome}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
