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
  erro: unknown;
  onRefresh: () => void;
};

function formatarErro(error: unknown): string {
  if (error instanceof Error) {
    return [
      `${error.name}: ${error.message}`,
      error.stack,
      error.cause ? `Causa: ${formatarErro(error.cause)}` : undefined,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}

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
        <div className="basis-full border-l-2 border-destructive pl-3 text-destructive">
          <span className="flex items-center gap-1.5 text-xs font-semibold">
            <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
            Erro completo da atualização
          </span>
          <pre className="mt-2 max-h-72 max-w-full overflow-auto whitespace-pre-wrap break-all font-mono text-xs leading-relaxed">
            {formatarErro(erro)}
          </pre>
        </div>
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
