import { useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, MapPin } from "lucide-react";
import {
  LngLatBounds,
  Map as MapaLibre,
  Marker as MarcadorLibre,
  NavigationControl,
  Popup,
  type StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import type { PostoMapa } from "@/lib/redeflex-mapa";

const litros0 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brl0 = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

/** Centro inicial do mapa: Belo Horizonte. */
const BELO_HORIZONTE: [number, number] = [-43.9345, -19.9167];
const ZOOM_INICIAL = 11;

/** Fundo claro e minimalista (CARTO Positron) — sem chave de API. */
const ESTILO_CLEAN: StyleSpecification = {
  version: 8,
  sources: {
    base: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap · © CARTO",
    },
  },
  layers: [
    { id: "fundo", type: "background", paint: { "background-color": "#f2f5f7" } },
    { id: "base", type: "raster", source: "base" },
  ],
};

const CORES = {
  alto: "#16a34a",
  medio: "#eab308",
  baixo: "#dc2626",
  sem: "#94a3b8",
} as const;

type Faixa = keyof typeof CORES;

/** Todos os postos usam o mesmo tamanho de ícone. */
const TAMANHO_PONTO = 26;

/** Margem em torno da média da rede que ainda conta como "na média". */
const MARGEM = 0.05;

/** M/LT médio da rede no período: resultado bruto total ÷ litros totais. */
function mediaRede(postos: PostoMapa[]): number {
  let litros = 0;
  let bruto = 0;
  for (const posto of postos) {
    if (!posto.comDados) continue;
    litros += posto.litros;
    bruto += posto.lucroBruto;
  }
  return litros > 0 ? bruto / litros : 0;
}

function classificar(posto: PostoMapa, media: number): Faixa {
  if (!posto.comDados) return "sem";
  if (media <= 0) return "medio";
  if (posto.mlt >= media * (1 + MARGEM)) return "alto";
  if (posto.mlt >= media * (1 - MARGEM)) return "medio";
  return "baixo";
}

function escapar(texto: string): string {
  return texto.replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;",
  );
}

function local(posto: PostoMapa): string {
  return [posto.bairro, posto.cidade].filter(Boolean).join(" · ");
}

function balao(posto: PostoMapa, periodoLabel: string, media: number): string {
  const linha = (rotulo: string, valor: string) =>
    `<div style="display:flex;justify-content:space-between;gap:16px"><span style="color:#64748b">${rotulo}</span><strong>${valor}</strong></div>`;
  const lugar = local(posto);
  const diff = media > 0 ? (posto.mlt / media - 1) * 100 : 0;
  const corDiff = diff >= MARGEM * 100 ? "#16a34a" : diff <= -MARGEM * 100 ? "#dc2626" : "#64748b";
  const vsRede =
    media > 0
      ? `<div style="display:flex;justify-content:space-between;gap:16px"><span style="color:#64748b">vs. rede</span><strong style="color:${corDiff}">${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%</strong></div>`
      : "";
  return `
    <div style="font-family:inherit;min-width:200px;max-width:250px;color:#0f172a;font-size:13px;line-height:1.5">
      <div style="font-weight:800;font-size:14px">${escapar(posto.nome)}</div>
      ${lugar ? `<div style="color:#64748b">${escapar(lugar)}</div>` : ""}
      <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.08em;margin:8px 0 4px">${escapar(periodoLabel)}</div>
      ${
        posto.comDados
          ? linha("Volume", `${litros0.format(posto.litros)} L`) +
            linha("Faturamento", brl0.format(posto.receita)) +
            linha("Resultado Bruto", brl0.format(posto.lucroBruto)) +
            linha("M/LT", brl.format(posto.mlt)) +
            vsRede +
            linha("TMC", brl.format(posto.tmc))
          : `<div style="color:#64748b">Sem movimento no período</div>`
      }
      <button data-ibm="${escapar(posto.ibm)}" style="margin-top:10px;width:100%;border:0;border-radius:8px;padding:7px 10px;background:#1b4c9c;color:#fff;font-weight:700;cursor:pointer">Adicionar ao painel</button>
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
  const mapaRef = useRef<MapaLibre | null>(null);
  const marcadoresRef = useRef<MarcadorLibre[]>([]);
  const postosRef = useRef<PostoMapa[]>(postos);
  const selecionarRef = useRef(onSelecionar);
  const [pronto, setPronto] = useState(false);
  const [erroMapa, setErroMapa] = useState<string | null>(null);

  selecionarRef.current = onSelecionar;
  postosRef.current = postos;
  const media = useMemo(() => mediaRede(postos), [postos]);

  useEffect(() => {
    if (!divRef.current) return;
    let mapa: MapaLibre | undefined;
    try {
      mapa = new MapaLibre({
        container: divRef.current,
        style: ESTILO_CLEAN,
        center: BELO_HORIZONTE,
        zoom: ZOOM_INICIAL,
        attributionControl: { compact: true },
      });
      mapa.addControl(new NavigationControl({ showCompass: false }), "top-right");
      mapa.on("load", () => setPronto(true));
      mapa.on("error", (evento) => {
        console.warn("[RedeFlex] mapa", evento.error);
      });
      mapaRef.current = mapa;
    } catch (e: unknown) {
      setErroMapa(e instanceof Error ? e.message : String(e));
    }
    return () => {
      marcadoresRef.current.forEach((m) => m.remove());
      marcadoresRef.current = [];
      mapa?.remove();
      mapaRef.current = null;
      setPronto(false);
    };
  }, []);

  useEffect(() => {
    const mapa = mapaRef.current;
    if (!pronto || !mapa) return;

    marcadoresRef.current.forEach((m) => m.remove());
    marcadoresRef.current = [];
    if (postos.length === 0) return;

    for (const posto of postos) {
      const faixa = classificar(posto, media);
      const cor = CORES[faixa];

      const ponto = document.createElement("div");
      ponto.title = `${posto.nome}${local(posto) ? ` — ${local(posto)}` : ""}`;
      ponto.style.cssText = `width:${TAMANHO_PONTO}px;height:${TAMANHO_PONTO}px;cursor:pointer`;

      // O transform do elemento raiz é controlado pelo MapLibre para posicionar
      // o marcador; o efeito de hover vai em um elemento interno.
      const interno = document.createElement("div");
      interno.style.cssText = "transition:transform .15s ease;transform-origin:center";
      interno.innerHTML = `
        <svg viewBox="0 0 24 24" width="${TAMANHO_PONTO}" height="${TAMANHO_PONTO}" style="display:block;filter:drop-shadow(0 2px 4px rgba(15,23,42,.35))">
          <circle cx="12" cy="12" r="11" fill="#fff"/>
          <circle cx="12" cy="12" r="9.5" fill="${cor}"/>
          <g fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8.4 16.8V8.4a1.2 1.2 0 0 1 1.2-1.2h2.6a1.2 1.2 0 0 1 1.2 1.2v8.4"/>
            <path d="M7.4 16.8h7.2"/>
            <path d="M9.6 10.2h2.6"/>
            <path d="M13.4 9.6l2 1.6v3.4a1.1 1.1 0 0 0 2.2 0v-3.6"/>
          </g>
        </svg>`;
      ponto.appendChild(interno);
      ponto.addEventListener("mouseenter", () => (interno.style.transform = "scale(1.15)"));
      ponto.addEventListener("mouseleave", () => (interno.style.transform = "scale(1)"));

      const popup = new Popup({
        offset: TAMANHO_PONTO / 2 + 6,
        closeButton: false,
        maxWidth: "270px",
      }).setHTML(balao(posto, periodoLabel, media));

      popup.on("open", () => {
        const elemento = popup.getElement();
        const botao = elemento?.querySelector<HTMLButtonElement>(`button[data-ibm="${posto.ibm}"]`);
        botao?.addEventListener("click", () => {
          selecionarRef.current(posto.ibm);
          popup.remove();
        });
      });

      const marcador = new MarcadorLibre({ element: ponto })
        .setLngLat([posto.lng, posto.lat])
        .setPopup(popup)
        .addTo(mapa);

      marcadoresRef.current.push(marcador);
    }
    // O enquadramento inicial fica em Belo Horizonte; usar "Enquadrar rede"
    // para ver todos os postos.
  }, [pronto, postos, media, periodoLabel]);

  function enquadrarRede() {
    const mapa = mapaRef.current;
    const lista = postosRef.current;
    if (!mapa || lista.length === 0) return;
    const bounds = new LngLatBounds(
      [lista[0]!.lng, lista[0]!.lat],
      [lista[0]!.lng, lista[0]!.lat],
    );
    for (const posto of lista) bounds.extend([posto.lng, posto.lat]);
    mapa.fitBounds(bounds, { padding: 48, maxZoom: 13, duration: 600 });
  }

  const mensagem = erroMapa
    ? erroMapa
    : erro && postos.length === 0
      ? "Não foi possível carregar a localização dos postos."
      : null;

  return (
    <section className="card-elevated min-w-0 overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4 sm:px-7">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-brand">
          <MapPin className="h-4 w-4" />
          Mapa da rede
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {carregando ? "Carregando…" : `${postos.length} postos localizados`}
          </span>
          <button
            type="button"
            onClick={enquadrarRede}
            disabled={!pronto || postos.length === 0}
            className="flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand disabled:opacity-50"
          >
            <Crosshair className="h-3.5 w-3.5" />
            Enquadrar rede
          </button>
        </div>
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
        <span>
          Cor do ícone = M/LT frente à média da rede
          {media > 0 ? ` (${brl.format(media)}/L)` : ""}
        </span>
        {(
          [
            ["alto", "Acima da média"],
            ["medio", "Na média"],
            ["baixo", "Abaixo da média"],
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
