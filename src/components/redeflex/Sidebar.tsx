import {
  Home,
  Fuel,
  Package,
  Store,
  Clock,
  MapPin,
  BarChart3,
  Target,
  FileText,
  Download,
  SlidersHorizontal,
  PieChart,
} from "lucide-react";

const analises = [
  { label: "Combustíveis", icon: Fuel },
  { label: "Produtos", icon: Package },
  { label: "Postos", icon: Store },
  { label: "Desempenho", icon: Clock },
  { label: "Mapa da Rede", icon: MapPin },
];

const gestao = [
  { label: "Indicadores", icon: BarChart3 },
  { label: "Metas", icon: Target },
  { label: "Relatórios", icon: FileText },
  { label: "Exportações", icon: Download },
];

export function Sidebar() {
  return (
    <aside className="hidden w-[268px] shrink-0 flex-col bg-sidebar px-5 py-7 text-sidebar-foreground lg:flex">
      <div className="flex items-center gap-3 px-2">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sidebar-accent">
          <PieChart className="h-6 w-6 text-brand" strokeWidth={2.4} />
        </span>
        <span className="leading-tight">
          <span className="block text-xl font-extrabold tracking-tight">
            REDE<span className="text-brand">FLEX</span>
          </span>
          <span className="block text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/60">
            Inteligência em rede
          </span>
        </span>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        <a className="flex items-center gap-3 rounded-xl bg-brand/15 px-4 py-3 text-sm font-semibold text-brand brand-rail">
          <Home className="h-[18px] w-[18px]" />
          Visão Geral
        </a>

        <p className="mt-7 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45">
          Análises
        </p>
        {analises.map(({ label, icon: Icon }) => (
          <a
            key={label}
            className="flex cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </a>
        ))}

        <div className="my-5 h-px bg-sidebar-border" />

        <p className="px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45">
          Gestão
        </p>
        {gestao.map(({ label, icon: Icon }) => (
          <a
            key={label}
            className="flex cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </a>
        ))}
      </nav>

      <div className="mt-6 rounded-2xl bg-sidebar-accent/70 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="h-4 w-4 text-brand" />
          Filtros aplicados
        </p>
        <p className="mt-1.5 text-xs text-sidebar-foreground/60">Período: Mês atual</p>
      </div>
    </aside>
  );
}