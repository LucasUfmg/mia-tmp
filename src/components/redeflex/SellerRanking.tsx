import { Trophy, Users } from "lucide-react";
import type { Vendedor } from "@/lib/redeflex-dashboard";

const litros0 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const litros2 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brl0 = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

type Ordem = "maiores" | "menores";

type Props = {
  vendedores: Vendedor[];
  ordem: Ordem;
  onOrdemChange: (ordem: Ordem) => void;
  nomePosto: (ibm: string) => string;
  mostrarPosto: boolean;
  carregando?: boolean;
  nota: string;
};

export function SellerRanking({
  vendedores,
  ordem,
  onOrdemChange,
  nomePosto,
  mostrarPosto,
  carregando,
  nota,
}: Props) {
  return (
    <section className="card-elevated min-w-0 overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-brand">
            <Users className="h-4 w-4" />
            Ranking de Vendedores
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">{nota}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-full bg-surface-muted p-1">
          {(["maiores", "menores"] as const).map((valor) => (
            <button
              key={valor}
              type="button"
              onClick={() => onOrdemChange(valor)}
              aria-pressed={ordem === valor}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                ordem === valor
                  ? "bg-gold text-gold-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {valor === "maiores" ? "Maiores" : "Menores"}
            </button>
          ))}
        </div>
      </header>

      {carregando && vendedores.length === 0 ? (
        <div className="space-y-2 p-4 sm:p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-md bg-surface-muted" />
          ))}
        </div>
      ) : vendedores.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground sm:px-6">
          Nenhuma venda por funcionário no período selecionado.
        </p>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-4 py-3 sm:px-6">#</th>
                  <th className="px-4 py-3">Vendedor</th>
                  {mostrarPosto && <th className="px-4 py-3">Posto</th>}
                  <th className="px-4 py-3 text-right">Litros</th>
                  <th className="px-4 py-3 text-right">Faturamento</th>
                  <th className="px-4 py-3 text-right">M/LT</th>
                  <th className="px-4 py-3 text-right">TMC</th>
                  <th className="px-4 py-3 pr-4 text-right sm:pr-6">Atend.</th>
                </tr>
              </thead>
              <tbody>
                {vendedores.map((v, index) => (
                  <tr key={`${v.ibm}-${v.ven}`} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3 sm:px-6">
                      <Posicao index={index} ordem={ordem} />
                    </td>
                    <td className="max-w-[240px] truncate px-4 py-3 font-semibold">{v.nome}</td>
                    {mostrarPosto && (
                      <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                        {nomePosto(v.ibm)}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right font-bold">{litros0.format(v.litros)} L</td>
                    <td className="px-4 py-3 text-right">{brl0.format(v.receita)}</td>
                    <td className="px-4 py-3 text-right">{brl.format(v.mlt)}</td>
                    <td className="px-4 py-3 text-right">{brl.format(v.tmc)}</td>
                    <td className="px-4 py-3 pr-4 text-right text-muted-foreground sm:pr-6">
                      {litros0.format(v.atendimentos)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <ul className="divide-y divide-border md:hidden">
            {vendedores.map((v, index) => (
              <li key={`${v.ibm}-${v.ven}`} className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <Posicao index={index} ordem={ordem} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{v.nome}</p>
                    {mostrarPosto && (
                      <p className="truncate text-xs text-muted-foreground">{nomePosto(v.ibm)}</p>
                    )}
                  </div>
                  <p className="shrink-0 text-sm font-extrabold">{litros0.format(v.litros)} L</p>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <dt>Faturamento</dt>
                    <dd className="font-semibold text-foreground">{brl0.format(v.receita)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>M/LT</dt>
                    <dd className="font-semibold text-foreground">{brl.format(v.mlt)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>TMC</dt>
                    <dd className="font-semibold text-foreground">{brl.format(v.tmc)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>TMV</dt>
                    <dd className="font-semibold text-foreground">
                      {litros2.format(v.tmv)} L
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function Posicao({ index, ordem }: { index: number; ordem: Ordem }) {
  const destaque = ordem === "maiores" && index < 3;
  return (
    <span
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
        destaque ? "bg-gold-soft text-gold-foreground" : "bg-surface-muted text-muted-foreground"
      }`}
    >
      {destaque ? <Trophy className="h-4 w-4" /> : index + 1}
    </span>
  );
}
