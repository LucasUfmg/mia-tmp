import { Link } from "@tanstack/react-router";
import { BookOpen, Calculator, Home, SlidersHorizontal } from "lucide-react";
import logoRedeFlex from "@/assets/redeflex-logo.jpg";

const itemBase =
  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors";

export function Sidebar() {
  return (
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
          to="/"
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
  );
}