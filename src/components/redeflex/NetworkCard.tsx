import type { ReactNode } from "react";
import { Info } from "lucide-react";

type Props = {
  title: string;
  icon: ReactNode;
  rb: string;
  rbLabel?: string;
  metrics: { label: string; value: string }[];
  note: string;
};

export function NetworkCard({ title, icon, rb, rbLabel = "RB Médio", metrics, note }: Props) {
  return (
    <section className="card-elevated flex h-full flex-col overflow-hidden">
      <div className="flex flex-1 gap-4 border-l-4 border-brand p-5 sm:gap-5 sm:p-7">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground sm:h-16 sm:w-16 [&>svg]:h-5 [&>svg]:w-5 sm:[&>svg]:h-7 sm:[&>svg]:w-7">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-brand">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{rbLabel}</p>
          <p className="mt-2 break-words text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            {rb}
          </p>

          <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-border pt-5 sm:mt-6 sm:gap-x-8 sm:gap-y-5">
            {metrics.map((m) => (
              <div key={m.label} className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {m.label}
                </dt>
                <dd className="mt-0.5 break-words text-lg font-bold sm:text-xl">{m.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <p className="flex items-start gap-2 border-t border-border bg-surface-muted px-5 py-3 text-xs text-muted-foreground sm:items-center sm:px-7">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 sm:mt-0" />
        {note}
      </p>
    </section>
  );
}