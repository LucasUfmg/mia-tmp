import { useEffect, useRef, useState } from "react";
import { Check, PieChart, Phone, Video, MoreVertical, Mic, Plus, Smile } from "lucide-react";
import { conversa } from "@/data/flexia";

function Formatado({ texto }: { texto: string }) {
  return (
    <>
      {texto.split("\n").map((linha, i) => (
        <span key={i} className="block">
          {linha.split(/(\*[^*]+\*)/g).map((parte, j) =>
            parte.startsWith("*") && parte.endsWith("*") && parte.length > 2 ? (
              <strong key={j} className="font-bold">
                {parte.slice(1, -1)}
              </strong>
            ) : (
              <span key={j}>{parte}</span>
            ),
          )}
        </span>
      ))}
    </>
  );
}

export function WhatsappMockup() {
  const [visiveis, setVisiveis] = useState(1);
  const [digitando, setDigitando] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visiveis >= conversa.length) return;
    const proxima = conversa[visiveis];
    const daIA = proxima?.autor === "ia";
    const espera = daIA ? 1500 : 900;

    let mostrar: ReturnType<typeof setTimeout>;
    const pensar = setTimeout(() => {
      if (daIA) setDigitando(true);
      mostrar = setTimeout(() => {
        setDigitando(false);
        setVisiveis((v) => v + 1);
      }, daIA ? 1200 : 0);
    }, espera);

    return () => {
      clearTimeout(pensar);
      clearTimeout(mostrar);
    };
  }, [visiveis]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [visiveis, digitando]);

  return (
    <div className="mx-auto w-full max-w-[360px] rounded-[2.5rem] border border-white/10 bg-sidebar p-2.5 shadow-[0_40px_80px_-40px_oklch(0.24_0.035_235/60%)]">
      <div className="overflow-hidden rounded-[2rem] bg-wa-canvas">
        <div className="flex items-center gap-3 bg-wa px-4 py-3 text-wa-foreground">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand">
            <PieChart className="h-4.5 w-4.5 text-sidebar" strokeWidth={2.6} />
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-bold">Mia</p>
            <p className="text-[11px] text-wa-foreground/70">
              {digitando ? "digitando…" : "online"}
            </p>
          </div>
          <Video className="h-4 w-4 opacity-80" />
          <Phone className="h-4 w-4 opacity-80" />
          <MoreVertical className="h-4 w-4 opacity-80" />
        </div>

        <div
          ref={scroller}
          className="flex h-[440px] flex-col gap-2 overflow-y-auto px-3 py-4"
        >
          <p className="mx-auto rounded-md bg-surface/80 px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
            HOJE
          </p>

          {conversa.slice(0, visiveis).map((m, i) => (
            <div
              key={i}
              className={`flex animate-fade-in ${m.autor === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-snug shadow-sm ${
                  m.autor === "user"
                    ? "rounded-br-sm bg-wa-bubble text-foreground"
                    : "rounded-bl-sm bg-surface text-foreground"
                }`}
              >
                <Formatado texto={m.texto} />
                <span className="mt-1 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
                  {m.hora}
                  {m.autor === "user" && <Check className="h-3 w-3 text-wa" />}
                </span>
              </div>
            </div>
          ))}

          {digitando && (
            <div className="flex animate-fade-in justify-start">
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-surface px-3.5 py-3 shadow-sm">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60"
                    style={{ animationDelay: `${d * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-border bg-surface px-3 py-2.5">
          <Plus className="h-4.5 w-4.5 text-muted-foreground" />
          <span className="flex flex-1 items-center gap-2 rounded-full bg-surface-muted px-3 py-2 text-xs text-muted-foreground">
            <Smile className="h-4 w-4" />
            Pergunte algo à Mia…
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-wa text-wa-foreground">
            <Mic className="h-4 w-4" />
          </span>
        </div>
      </div>
    </div>
  );
}
