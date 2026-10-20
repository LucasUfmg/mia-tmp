import { Link } from "@tanstack/react-router";
import { BookOpen, Calculator, Home, SlidersHorizontal } from "lucide-react";
import logoRedeFlex from "@/assets/redeflex-logo.jpg";

const itemBase =
  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors";

const mobBase = "flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-semibold";

function MobileNav() {
  const itens = [
    { to: "/bi", label: "BI", icon: Home, exact: true },
    { to: "/contabil", label: "Contábil", icon: Calculator, exact: false },
    { to: "/manual", label: "Manual", icon: BookOpen, exact: false },
  ] as const;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-sidebar pb-[env(safe-area-inset-bottom)] text-sidebar-foreground lg:hidden">
      {itens.map(({ to, label, icon: Icon, exact }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact }}
          activeProps={{ className: `${mobBase} text-gold` }}
          inactiveProps={{ className: `${mobBase} text-sidebar-foreground/70` }}
        >
          <Icon className="h-5 w-5" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function Sidebar() {
  return (
    <>
    <MobileNav />
    <style>{"@media (max-width:1023px){body{padding-bottom:4.5rem}}"}</style>
    <aside className="hidden w-[268px] shrink-0 flex-col bg-sidebar px-5 py-7 text-sidebar-foreground lg:flex">
      <div className="px-2">
        <img
          src={logoRedeFlex}
          alt="RedeFlex — rede de postos"
          className="h-12 w-auto rounded-lg"
        />
        <span className="mt-2 block text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/60">
          Inteligência em postos de combustíveis
        </span>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        <Link
          to="/bi"
          className={itemBase}
          activeOptions={{ exact: true }}
          activeProps={{ className: `${itemBase} bg-gold/15 text-gold brand-rail` }}
          inactiveProps={{
            className: `${itemBase} text-sidebar-foreground/70 hover:bg-sidebar-accent/70`,
          }}
        >
          <Home className="h-[18px] w-[18px]" />
          Visão Geral
        </Link>
        <Link
          to="/contabil"
          className={itemBase}
          activeProps={{ className: `${itemBase} bg-gold/15 text-gold brand-rail` }}
          inactiveProps={{
            className: `${itemBase} text-sidebar-foreground/70 hover:bg-sidebar-accent/70`,
          }}
        >
          <Calculator className="h-[18px] w-[18px]" />
          Contábil
        </Link>
        <Link
          to="/manual"
          className={itemBase}
          activeProps={{ className: `${itemBase} bg-gold/15 text-gold brand-rail` }}
          inactiveProps={{
            className: `${itemBase} text-sidebar-foreground/70 hover:bg-sidebar-accent/70`,
          }}
        >
          <BookOpen className="h-[18px] w-[18px]" />
          Manual da plataforma
        </Link>
      </nav>

      <div className="mt-6 rounded-2xl bg-sidebar-accent/70 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="h-4 w-4 text-gold" />
          Filtros aplicados
        </p>
        <p className="mt-1.5 text-xs text-sidebar-foreground/60">Períodos: diário e mensal (on-time)</p>
      </div>
    </aside>
    </>
  );
}