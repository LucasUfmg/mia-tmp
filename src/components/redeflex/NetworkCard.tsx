import type { ReactNode } from "react";
import { Info } from "lucide-react";

type Props = {
  title: string;
  icon: ReactNode;
  rb: string;
  metrics: { label: string; value: string }[];
  note: string;
};

export function NetworkCard({ title, icon, rb, metrics, note }: Props) {
  return (
    <section className="card-elevated overflow-hidden">
      <div className="flex gap-5 border-l-4 border-brand p-7">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-brand">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">RB Médio</p>
          <p className="mt-2 text-4xl font-extrabold tracking-tight md:text-5xl">{rb}</p>

          <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-5 border-t border-border pt-5">
            {metrics.map((m) => (
              <div key={m.label}>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {m.label}
                </dt>
                <dd className="mt-0.5 text-xl font-bold">{m.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <p className="flex items-center gap-2 border-t border-border bg-surface-muted px-7 py-3 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5" />
        {note}
      </p>
    </section>
  );
}