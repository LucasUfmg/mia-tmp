/**
 * Camada de dados do dashboard — espelha as funções de
 * `src/Services/DataService.ts` do micro-serviço.
 *
 * Cada função recebe as datas (YYYY-MM-DD) e devolve o mesmo formato da API:
 *   rede:      { "2025-11-28": 8489.50 }
 *   por posto: { "00000000291901_2025-11-28": 8489.50 }
 *
 * >>> ÚNICO PONTO DE TROCA: substituir o corpo de `fetchSerie` por um
 * >>> `fetch` (via server function) quando a API estiver publicada.
 */

export const DATA_REFERENCIA = "2026-08-04";

export const POSTOS_IBM = [
  "00000000291901",
  "00000000291902",
  "00000000291903",
  "00000000291904",
  "00000000291905",
  "00000000291906",
];

type Tipo = "fuel" | "product";

const BASE_POR_POSTO: Record<Tipo, number> = {
  fuel: 25_500, // litros/dia por posto
  product: 1_050, // reais/dia por posto
};

/** Pseudo-aleatório determinístico a partir da chave posto_data. */
function seeded(chave: string): number {
  let h = 2166136261;
  for (let i = 0; i < chave.length; i += 1) {
    h ^= chave.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

function valorPara(tipo: Tipo, postoId: string, data: string): number {
  const base = BASE_POR_POSTO[tipo];
  const fator = 0.82 + seeded(`${tipo}_${postoId}_${data}`) * 0.36;
  const valor = base * fator;
  return tipo === "fuel" ? Math.round(valor) : Math.round(valor * 100) / 100;
}

async function fetchSerie(
  tipo: Tipo,
  dates: string[],
  porPosto: boolean,
): Promise<Record<string, number>> {
  const resultado: Record<string, number> = {};

  for (const data of dates) {
    if (porPosto) {
      for (const posto of POSTOS_IBM) {
        resultado[`${posto}_${data}`] = valorPara(tipo, posto, data);
      }
    } else {
      resultado[data] = POSTOS_IBM.reduce((soma, posto) => soma + valorPara(tipo, posto, data), 0);
    }
  }

  return resultado;
}

/** Galonagem da rede agrupada por data. */
export function calcFuelsByDate(dates: string[]) {
  return fetchSerie("fuel", dates, false);
}

/** Produto (R$) da rede agrupado por data. */
export function calcProductsByDate(dates: string[]) {
  return fetchSerie("product", dates, false);
}

/** Galonagem por posto (chave `IBM_data`). */
export function getVolumePorPosto(dates: string[]) {
  return fetchSerie("fuel", dates, true);
}

/** Produto (R$) por posto (chave `IBM_data`). */
export function getItensTotaisPorPosto(dates: string[]) {
  return fetchSerie("product", dates, true);
}
