import { CalendarDays, RefreshCw, TriangleAlert } from "lucide-react";

const horario = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZone: "America/Sao_Paulo",
});

type Props = {
  atualizadoEm: number;
  atualizando: boolean;
  erro: boolean;
  onRefresh: () => void;
};

export function LiveStatus({ atualizadoEm, atualizando, erro, onRefresh }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
      <span className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4" />
        <span className="relative flex h-2 w-2">
          {atualizando ? (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
          ) : null}
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${
              erro ? "bg-destructive" : "bg-brand"
            }`}
          />
        </span>
        Última atualização: {atualizadoEm ? horario.format(new Date(atualizadoEm)) : "—"}
      </span>

      {erro ? (
        <span className="flex items-center gap-1.5 text-xs font-medium text-destructive">
          <TriangleAlert className="h-3.5 w-3.5" />
          Falha ao atualizar — tentando novamente
        </span>
      ) : null}

      <span className="hidden h-5 w-px bg-border sm:block" />
      <button
        type="button"
        onClick={onRefresh}
        disabled={atualizando}
        className="flex items-center gap-2 font-medium text-brand transition-opacity hover:opacity-80 disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 ${atualizando ? "animate-spin" : ""}`} />
        Atualizar
      </button>
    </div>
  );
}
