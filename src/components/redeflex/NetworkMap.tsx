import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin } from "lucide-react";

import { carregarGoogleMaps } from "@/lib/google-maps";
import type { PostoMapa } from "@/lib/redeflex-mapa";

const litros0 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brl0 = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const CORES = {
  alto: "#16a34a",
  medio: "#eab308",
  baixo: "#dc2626",
  sem: "#94a3b8",
} as const;

type Faixa = keyof typeof CORES;

/** Faixas de M/LT relativas à rede (terços dos postos com movimento). */
function faixas(postos: PostoMapa[]): { alto: number; medio: number } {
  const valores = postos
    .filter((p) => p.comDados)
    .map((p) => p.mlt)
    .sort((a, b) => a - b);
  if (valores.length === 0) return { alto: 0, medio: 0 };
  const em = (q: number) => valores[Math.min(valores.length - 1, Math.floor(valores.length * q))]!;
  return { alto: em(0.66), medio: em(0.33) };
}

function classificar(posto: PostoMapa, corte: { alto: number; medio: number }): Faixa {
  if (!posto.comDados) return "sem";
  if (posto.mlt >= corte.alto) return "alto";
  if (posto.mlt >= corte.medio) return "medio";
  return "baixo";
}

function balao(posto: PostoMapa, periodoLabel: string): string {
  const linha = (rotulo: string, valor: string) =>
    `<div style="display:flex;justify-content:space-between;gap:16px"><span style="color:#64748b">${rotulo}</span><strong>${valor}</strong></div>`;
  return `
    <div style="font-family:inherit;min-width:210px;max-width:260px;color:#0f172a;font-size:13px;line-height:1.5">
      <div style="font-weight:800;font-size:14px">${posto.nome}</div>
      ${posto.endereco ? `<div style="color:#64748b;margin-bottom:6px">${posto.endereco}</div>` : ""}
      <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.08em;margin:6px 0 4px">${periodoLabel}</div>
      ${
        posto.comDados
          ? linha("Volume", `${litros0.format(posto.litros)} L`) +
            linha("Faturamento", brl0.format(posto.receita)) +
            linha("Resultado Bruto", brl0.format(posto.lucroBruto)) +
            linha("M/LT", brl.format(posto.mlt)) +
            linha("TMC", brl.format(posto.tmc))
          : `<div style="color:#64748b">Sem movimento no período</div>`
      }
      <button data-ibm="${posto.ibm}" style="margin-top:10px;width:100%;border:0;border-radius:8px;padding:7px 10px;background:#0f766e;color:#fff;font-weight:700;cursor:pointer">Ver no painel</button>
    </div>`;
}

type Props = {
  postos: PostoMapa[];
  carregando: boolean;
  erro?: unknown;
  periodoLabel: string;
  onSelecionar: (ibm: string) => void;
};

export default function NetworkMap({ postos, carregando, erro, periodoLabel, onSelecionar }: Props) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const mapaRef = useRef<google.maps.Map | null>(null);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);
  const marcadoresRef = useRef<google.maps.Marker[]>([]);
  const selecionarRef = useRef(onSelecionar);
  const [pronto, setPronto] = useState(false);
  const [erroMapa, setErroMapa] = useState<string | null>(null);

  selecionarRef.current = onSelecionar;
  const corte = useMemo(() => faixas(postos), [postos]);

  useEffect(() => {
    let ativo = true;
    carregarGoogleMaps()
      .then((maps) => {
        if (!ativo || !divRef.current) return;
        mapaRef.current = new maps.Map(divRef.current, {
          center: { lat: -15.8, lng: -47.9 },
          zoom: 4,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
        infoRef.current = new maps.InfoWindow();
        setPronto(true);
      })
      .catch((e: unknown) => {
        if (ativo) setErroMapa(e instanceof Error ? e.message : String(e));
      });
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    const mapa = mapaRef.current;
    if (!pronto || !mapa) return;

    marcadoresRef.current.forEach((m) => m.setMap(null));
    marcadoresRef.current = [];
    if (postos.length === 0) return;

    const maxLitros = Math.max(...postos.map((p) => p.litros), 1);
    const bounds = new google.maps.LatLngBounds();

    for (const posto of postos) {
      const faixa = classificar(posto, corte);
      const escala = posto.comDados ? 8 + 10 * Math.sqrt(posto.litros / maxLitros) : 7;
      const marcador = new google.maps.Marker({
        map: mapa,
        position: { lat: posto.lat, lng: posto.lng },
        title: posto.nome,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: escala,
          fillColor: CORES[faixa],
          fillOpacity: 0.85,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
      marcador.addListener("click", () => {
        const info = infoRef.current;
        if (!info) return;
        info.setContent(balao(posto, periodoLabel));
        info.open({ map: mapa, anchor: marcador });
        google.maps.event.addListenerOnce(info, "domready", () => {
          const botao = document.querySelector<HTMLButtonElement>(`button[data-ibm="${posto.ibm}"]`);
          botao?.addEventListener("click", () => {
            selecionarRef.current(posto.ibm);
            info.close();
          });
        });
      });
      marcadoresRef.current.push(marcador);
      bounds.extend({ lat: posto.lat, lng: posto.lng });
    }

    mapa.fitBounds(bounds, 48);
  }, [pronto, postos, corte, periodoLabel]);

  const mensagem = erroMapa
    ? erroMapa
    : erro
      ? "Não foi possível carregar a localização dos postos."
      : null;

  return (
    <section className="card-elevated min-w-0 overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4 sm:px-7">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-brand">
          <MapPin className="h-4 w-4" />
          Mapa da rede
        </h2>
        <span className="text-xs text-muted-foreground">
          {carregando ? "Carregando…" : `${postos.length} postos localizados`}
        </span>
      </header>

      <div className="relative">
        <div ref={divRef} className="h-[320px] w-full sm:h-[420px]" />
        {mensagem && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-muted px-6 text-center text-sm text-muted-foreground">
            {mensagem}
          </div>
        )}
      </div>

      <footer className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border bg-surface-muted px-5 py-3 text-xs text-muted-foreground sm:px-7">
        <span>Tamanho do círculo = volume vendido · cor = M/LT frente à rede</span>
        {(
          [
            ["alto", "M/LT alto"],
            ["medio", "M/LT médio"],
            ["baixo", "M/LT baixo"],
            ["sem", "Sem movimento"],
          ] as [Faixa, string][]
        ).map(([faixa, rotulo]) => (
          <span key={faixa} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: CORES[faixa] }}
              aria-hidden
            />
            {rotulo}
          </span>
        ))}
      </footer>
    </section>
  );
}
