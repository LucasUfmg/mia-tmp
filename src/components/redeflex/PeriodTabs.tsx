import { CalendarDays, CalendarRange } from "lucide-react";
import type { Periodo } from "@/lib/redeflex-dashboard";

const opcoes: { id: Periodo; label: string; icon: typeof CalendarDays }[] = [
  { id: "diario", label: "Diária", icon: CalendarDays },
  { id: "mensal", label: "Mensal", icon: CalendarRange },
];

type Props = {
  value: Periodo;
  onChange: (value: Periodo) => void;
};

export function PeriodTabs({ value, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Período das métricas"
      className="inline-flex items-center gap-1 rounded-xl border border-border bg-card p-1"
    >
      {opcoes.map(({ id, label, icon: Icon }) => {
        const ativo = value === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={ativo}
            onClick={() => onChange(id)}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
              ativo
                ? "bg-brand text-brand-foreground"
                : "text-muted-foreground hover:bg-surface-muted"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
