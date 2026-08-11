/**
 * Carregamento da Maps JavaScript API com tipos mínimos próprios — evita
 * dependência de @types externos e mantém tudo no que o mapa realmente usa.
 */
export type LatLng = { lat: number; lng: number };

export interface MapsBounds {
  extend(ponto: LatLng): void;
}

export interface MapsMap {
  fitBounds(bounds: MapsBounds, padding?: number): void;
  setCenter(ponto: LatLng): void;
  setZoom(zoom: number): void;
}

export interface MapsMarker {
  setMap(mapa: MapsMap | null): void;
  addListener(evento: string, callback: () => void): void;
}

export interface MapsInfoWindow {
  setContent(conteudo: string): void;
  open(opcoes: { map: MapsMap; anchor: MapsMarker }): void;
  close(): void;
}

export interface MapsApi {
  Map: new (elemento: HTMLElement, opcoes: Record<string, unknown>) => MapsMap;
  Marker: new (opcoes: Record<string, unknown>) => MapsMarker;
  InfoWindow: new (opcoes?: Record<string, unknown>) => MapsInfoWindow;
  LatLngBounds: new () => MapsBounds;
  SymbolPath: { CIRCLE: number };
  event: { addListenerOnce(alvo: unknown, evento: string, callback: () => void): void };
}

let promessa: Promise<MapsApi> | null = null;

export function carregarGoogleMaps(): Promise<MapsApi> {
  if (promessa) return promessa;
  promessa = new Promise<MapsApi>((resolve, reject) => {
    const chave = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"] as
      | string
      | undefined;
    if (!chave) {
      reject(new Error("Chave do Google Maps não configurada"));
      return;
    }
    const canal = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"] as
      | string
      | undefined;
    const janela = window as unknown as Record<string, unknown>;
    janela["__redeflexMapsReady"] = () => {
      const api = (janela["google"] as { maps?: MapsApi } | undefined)?.maps;
      if (api) resolve(api);
      else reject(new Error("Google Maps não inicializou"));
    };
    const params = new URLSearchParams({
      key: chave,
      loading: "async",
      callback: "__redeflexMapsReady",
    });
    if (canal) params.set("channel", canal);
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => reject(new Error("Falha ao carregar o Google Maps"));
    document.head.appendChild(script);
  });
  return promessa;
}
