import { Fragment, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
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
import { excluirLancamento } from "@/lib/contabil.functions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const brl0 = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export type LinhaMes = { mes: string; dados: Consolidado; itens: Lancamento[] };

/** Uma linha por mês do ano, consolidando os postos do escopo. */
export function linhasPorMes(linhas: Lancamento[], meses: string[]): LinhaMes[] {
  return meses
    .map((mes) => ({ mes, linhas: linhas.filter((l) => l.mes === mes) }))
    .filter((m) => m.linhas.length > 0)
    .map(({ mes, linhas: doMes }) => ({ mes, dados: consolidar(doMes), itens: doMes }));
}

type Props = {
  linhas: LinhaMes[];
  total: Consolidado;
  totalLabel: string;
  nomePosto: (ibm: string) => string;
  onEditar: (lancamento: Lancamento) => void;
};

export function ContabilTabela({ linhas, total, totalLabel, nomePosto, onEditar }: Props) {
  const [aberto, setAberto] = useState<string | null>(null);
  const [remover, setRemover] = useState<Lancamento | null>(null);
  const queryClient = useQueryClient();
  const excluir = useServerFn(excluirLancamento);

  const exclusao = useMutation({
    mutationFn: async (id: string) => await excluir({ data: { id } }),
    onSuccess: () => {
      toast.success("Lançamento removido");
      void queryClient.invalidateQueries({ queryKey: ["contabil"] });
      setRemover(null);
    },
    onError: (erro: Error) =>
      toast.error("Não foi possível remover", { description: erro.message }),
  });

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
                <th className="px-3 py-3 text-right font-semibold">M. EBITDA</th>
                <th className="px-5 py-3 text-right font-semibold">Lançamentos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {linhas.map(({ mes, dados, itens }) => (
                <Fragment key={mes}>
                <tr>
                  <td className="px-5 py-3 font-semibold">{rotuloMes(mes)}</td>
                  <td className="px-3 py-3 text-right">{brl0.format(dados.receitaLiquida)}</td>
                  <td className="px-3 py-3 text-right">{brl0.format(dados.lucroLiquido)}</td>
                  <td className="px-3 py-3 text-right">{brl0.format(dados.ebitda)}</td>
                  <td className="px-3 py-3 text-right">{brl0.format(dados.ebit)}</td>
                  <td className="px-3 py-3 text-right font-semibold">{pct(dados.roe)}</td>
                  <td className="px-3 py-3 text-right font-semibold">{pct(dados.roic)}</td>
                  <td className="px-3 py-3 text-right">{pct(dados.margemLiquida)}</td>
                  <td className="px-3 py-3 text-right">{pct(dados.margemEbitda)}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => setAberto((a) => (a === mes ? null : mes))}
                      className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {itens.length} {itens.length === 1 ? "lançamento" : "lançamentos"}
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${aberto === mes ? "rotate-180" : ""}`}
                      />
                    </button>
                  </td>
                </tr>
                {aberto === mes &&
                  itens.map((item) => (
                    <tr key={item.id ?? `${item.ibm}-${item.mes}`} className="bg-surface-muted/50 text-xs">
                      <td className="px-5 py-2 pl-8 text-muted-foreground">{nomePosto(item.ibm)}</td>
                      <td className="px-3 py-2 text-right">{brl0.format(item.receitaLiquida)}</td>
                      <td className="px-3 py-2 text-right">{brl0.format(item.lucroLiquido)}</td>
                      <td className="px-3 py-2 text-right">{brl0.format(item.ebitda)}</td>
                      <td className="px-3 py-2 text-right">{brl0.format(item.ebit)}</td>
                      <td className="px-3 py-2 text-right" colSpan={4}>
                        PL médio {brl0.format((item.plInicial + item.plFinal) / 2)} · WACC{" "}
                        {pct(item.wacc)}
                      </td>
                      <td className="px-5 py-2">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => onEditar(item)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="sr-only">Editar lançamento</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-destructive hover:text-destructive"
                            onClick={() => setRemover(item)}
                            disabled={!item.id}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Remover lançamento</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </Fragment>
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
                <td className="px-3 py-3 text-right">{pct(total.margemEbitda)}</td>
                <td className="px-5 py-3" />
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

      <AlertDialog open={remover !== null} onOpenChange={(v) => !v && setRemover(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover lançamento?</AlertDialogTitle>
            <AlertDialogDescription>
              {remover
                ? `${nomePosto(remover.ibm)} · ${rotuloMes(remover.mes)} será excluído definitivamente.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                if (remover?.id) exclusao.mutate(remover.id);
              }}
              disabled={exclusao.isPending}
            >
              {exclusao.isPending ? "Removendo…" : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
