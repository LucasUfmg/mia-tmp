import { useState } from "react";
import { Fuel, ShoppingBag, Radio, Store } from "lucide-react";
import { biDistribuicao, biKpis } from "@/data/flexia";

const SIZE = 200;
const C = SIZE / 2;
const R = 92;
const HOLE = 52;

const CORES = [
  "oklch(0.86 0.15 92)",
  "oklch(0.78 0.155 82)",
  "oklch(0.68 0.13 78)",
  "oklch(0.56 0.1 74)",
  "oklch(0.42 0.07 72)",
];

function anel(start: number, end: number) {
  const pt = (a: number, r: number) => [
    C + r * Math.cos((a - 90) * (Math.PI / 180)),
    C + r * Math.sin((a - 90) * (Math.PI / 180)),
  ];
  const [x1, y1] = pt(start, R);
  const [x2, y2] = pt(end, R);
  const [x3, y3] = pt(end, HOLE);
  const [x4, y4] = pt(start, HOLE);
  const large = end - start > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${HOLE} ${HOLE} 0 ${large} 0 ${x4} ${y4} Z`;
}

function BigNumber({
  title,
  icon,
  rb,
  metrics,
}: {
  title: string;
  icon: React.ReactNode;
  rb: string;
  metrics: { label: string; value: string }[];
}) {
  return (
    <div className="card-elevated brand-rail min-w-0 p-4 pl-5 sm:p-5 sm:pl-6">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </span>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand">{title}</p>
      </div>
      <p className="mt-3 text-[11px] uppercase tracking-wider text-muted-foreground">RB médio</p>
      <p className="mt-0.5 break-words text-2xl font-extrabold tracking-tight sm:text-3xl">{rb}</p>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4">
        {metrics.map((m) => (
          <div key={m.label} className="min-w-0">
            <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {m.label}
            </dt>
            <dd className="mt-0.5 break-words text-sm font-bold">{m.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function BiMockup() {
  const [ativo, setAtivo] = useState<number | null>(null);
  const total = biDistribuicao.reduce((s, d) => s + d.value, 0);

  let cursor = 0;
  const fatias = biDistribuicao.map((d, i) => {
    const start = cursor;
    const end = start + (d.value / total) * 360;
    cursor = end;
    return { ...d, i, start, end, cor: CORES[i % CORES.length] };
  });

  const foco = ativo !== null ? fatias[ativo] : null;

  return (
    <div className="card-elevated overflow-hidden">
      {/* barra do painel */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-sidebar px-4 py-3 sm:px-6">
        <span className="text-sm font-extrabold tracking-tight">
          Painel de Dados <span className="text-brand">Diário</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
          <Store className="h-3 w-3 text-brand" />
          Rede · 41 postos
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold text-brand">
          <Radio className="h-3 w-3" />
          on-time
        </span>
      </div>

      <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-2">
        <BigNumber
          title="Rede Combustíveis"
          icon={<Fuel />}
          rb={biKpis.combustiveis.rb}
          metrics={biKpis.combustiveis.metrics}
        />
        <BigNumber
          title="Rede Produtos"
          icon={<ShoppingBag />}
          rb={biKpis.produtos.rb}
          metrics={biKpis.produtos.metrics}
        />

        <div className="card-elevated lg:col-span-2">
          <h3 className="px-4 pt-5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground sm:px-6">
            Distribuição dos combustíveis
          </h3>
          <div className="flex flex-col items-center gap-6 px-4 py-5 sm:flex-row sm:gap-8 sm:px-6">
            <div className="relative w-full max-w-[200px] shrink-0 sm:w-[200px]">
              <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full">
                {fatias.map((f) => (
                  <path
                    key={f.name}
                    d={anel(f.start, f.end)}
                    fill={f.cor}
                    opacity={ativo === null || ativo === f.i ? 1 : 0.35}
                    onMouseEnter={() => setAtivo(f.i)}
                    onMouseLeave={() => setAtivo(null)}
                    className="cursor-pointer transition-opacity"
                  />
                ))}
              </svg>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {foco ? foco.name : "Galonagem"}
                </span>
                <span className="text-lg font-extrabold text-brand">
                  {foco ? `${Math.round((foco.value / total) * 100)}%` : "38.412 L"}
                </span>
              </div>
            </div>

            <ul className="w-full min-w-0 flex-1 space-y-2">
              {fatias.map((f) => (
                <li
                  key={f.name}
                  onMouseEnter={() => setAtivo(f.i)}
                  onMouseLeave={() => setAtivo(null)}
                  className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-3 py-2 text-sm transition ${
                    ativo === f.i ? "bg-sidebar-accent" : ""
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: f.cor }}
                  />
                  <span className="min-w-0 flex-1 truncate">{f.name}</span>
                  <span className="text-xs text-muted-foreground">M/LT {f.mlt}</span>
                  <span className="text-xs text-muted-foreground">LB {f.lb}</span>
                  <span className="text-xs font-bold text-brand">
                    {Math.round((f.value / total) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <p className="border-t border-border bg-surface-muted px-4 py-3 text-[11px] text-muted-foreground sm:px-6">
        Demonstração com números fictícios. No seu painel, os valores vêm direto da base dos seus
        postos e atualizam on-time.
      </p>
    </div>
  );
}
