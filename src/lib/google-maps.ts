/** Carrega a Maps JavaScript API uma única vez (somente no browser). */
let promessa: Promise<typeof google.maps> | null = null;

export function carregarGoogleMaps(): Promise<typeof google.maps> {
  if (promessa) return promessa;
  promessa = new Promise((resolve, reject) => {
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
    janela["__redeflexMapsReady"] = () => resolve(google.maps);
    const script = document.createElement("script");
    const params = new URLSearchParams({
      key: chave,
      loading: "async",
      callback: "__redeflexMapsReady",
    });
    if (canal) params.set("channel", canal);
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => reject(new Error("Falha ao carregar o Google Maps"));
    document.head.appendChild(script);
  });
  return promessa;
}
