import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Info } from "lucide-react";
import { sliceColors, type Slice } from "@/data/redeflex";

type Props = {
  title: string;
  data: Slice[];
  note: string;
};

function SliceTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as Slice & { percent: string };
  return (
    <div className="card-elevated min-w-[210px] p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: payload[0].color }}
        />
        {d.name}
      </p>
      <dl className="mt-3 space-y-1.5 text-sm">
        {[
          { k: d.primaryLabel, v: d.primaryValue },
          { k: "LB", v: d.lb },
          { k: "RB", v: d.rb },
        ].map((row) => (
          <div key={row.k} className="flex justify-between gap-6">
            <dt className="text-muted-foreground">{row.k}</dt>
            <dd className="font-semibold">{row.v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function DistributionCard({ title, data, note }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const pct = (v: number) => `${Math.round((v / total) * 100)}%`;

  return (
    <section className="card-elevated flex flex-col">
      <h2 className="px-7 pt-6 text-base font-bold uppercase tracking-[0.06em]">{title}</h2>
      <div className="flex flex-1 flex-col items-center gap-4 px-7 py-5 sm:flex-row sm:gap-8">
        <div className="h-[230px] w-full max-w-[240px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={0}
                outerRadius="95%"
                stroke="var(--surface)"
                strokeWidth={2}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={sliceColors[i % sliceColors.length]} />
                ))}
              </Pie>
              <Tooltip content={<SliceTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="w-full space-y-2.5">
          {data.map((d, i) => (
            <li key={d.name} className="flex items-center gap-3 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: sliceColors[i % sliceColors.length] }}
              />
              <span className="min-w-0 flex-1 truncate text-foreground/85">{d.name}</span>
              <span className="font-semibold tabular-nums">{pct(d.value)}</span>
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