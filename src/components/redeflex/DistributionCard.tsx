import { useState } from "react";
import { Info } from "lucide-react";
import { sliceColors, type Slice } from "@/data/redeflex";

type Props = { title: string; data: Slice[]; note: string };

const SIZE = 240;
const R = 112;
const C = SIZE / 2;

function arc(startAngle: number, endAngle: number, radius: number) {
  const pt = (a: number) => [
    C + radius * Math.cos((a - 90) * (Math.PI / 180)),
    C + radius * Math.sin((a - 90) * (Math.PI / 180)),
  ];
  const [x1, y1] = pt(startAngle);
  const [x2, y2] = pt(endAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${C} ${C} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`;
}

export function DistributionCard({ title, data, note }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  const pct = (v: number) => (total > 0 ? `${Math.round((v / total) * 100)}%` : "—");

  if (data.length === 0 || total <= 0) {
    return (
      <section className="card-elevated flex h-full flex-col">
        <h2 className="px-7 pt-6 text-base font-bold uppercase tracking-[0.06em]">{title}</h2>
        <p className="flex flex-1 items-center justify-center px-7 py-16 text-sm text-muted-foreground">
          Carregando dados…
        </p>
      </section>
    );
  }

  let cursor = 0;
  const slices = data.map((d, i) => {
    const start = cursor;
    const end = start + (d.value / total) * 360;
    cursor = end;
    const mid = (start + end) / 2;
    return { ...d, i, start, end, mid, color: sliceColors[i % sliceColors.length] };
  });

  const hovered = active !== null ? slices[active] : null;

  return (
    <section className="card-elevated flex h-full flex-col">
      <h2 className="px-7 pt-6 text-base font-bold uppercase tracking-[0.06em]">{title}</h2>

      <div className="flex flex-1 flex-col items-center gap-6 px-7 py-5 sm:flex-row sm:gap-8">
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={title}>
            {slices.map((s) => {
              const isActive = active === s.i;
              const offset = isActive ? 6 : 0;
              const dx = offset * Math.cos((s.mid - 90) * (Math.PI / 180));
              const dy = offset * Math.sin((s.mid - 90) * (Math.PI / 180));
              return (
                <g key={s.name} transform={`translate(${dx} ${dy})`}>
                  <path
                    d={arc(s.start, s.end, R)}
                    fill={s.color}
                    stroke="var(--surface)"
                    strokeWidth={2}
                    className="cursor-pointer transition-opacity"
                    opacity={active === null || isActive ? 1 : 0.45}
                    onMouseEnter={() => setActive(s.i)}
                    onMouseLeave={() => setActive(null)}
                  />
                  {s.end - s.start > 22 && (
                    <text
                      x={C + R * 0.62 * Math.cos((s.mid - 90) * (Math.PI / 180))}
                      y={C + R * 0.62 * Math.sin((s.mid - 90) * (Math.PI / 180))}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="pointer-events-none text-[13px] font-bold"
                      fill={s.i === 3 ? "var(--foreground)" : "white"}
                    >
                      {pct(s.value)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {hovered && (
            <div className="card-elevated pointer-events-none absolute left-1/2 top-full z-10 w-[240px] -translate-x-1/2 -translate-y-6 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: hovered.color }}
                />
                <span className="truncate">{hovered.name}</span>
              </p>
              <dl className="mt-3 space-y-1.5 text-sm">
                {[
                  { k: hovered.primaryLabel, v: hovered.primaryValue },
                  { k: "LB", v: hovered.lb },
                  { k: "RB", v: hovered.rb },
                ].map((row) => (
                  <div key={row.k} className="flex justify-between gap-6">
                    <dt className="text-muted-foreground">{row.k}</dt>
                    <dd className="font-semibold tabular-nums">{row.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        <ul className="w-full min-w-0 space-y-2.5">
          {slices.map((s) => (
            <li
              key={s.name}
              onMouseEnter={() => setActive(s.i)}
              onMouseLeave={() => setActive(null)}
              className={`flex cursor-pointer items-center gap-3 rounded-md px-2 py-1 text-sm transition-colors ${
                active === s.i ? "bg-surface-muted" : ""
              }`}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="min-w-0 flex-1 truncate text-foreground/85">{s.name}</span>
              <span className="font-semibold tabular-nums">{pct(s.value)}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="flex items-center gap-2 border-t border-border bg-surface-muted px-7 py-3 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5" />
        {note}
      </p>
    </section>
  );
}
