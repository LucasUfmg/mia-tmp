import { consultar } from "./postgres.server";

export type Localizacao = {
  ibm: string;
  nome: string;
  endereco: string | null;
  cep: string | null;
  regional: string | null;
  lat: number;
  lng: number;
};

type Linha = {
  ibm: string | null;
  nomefantasia: string | null;
  endereco: string | null;
  cep: string | null;
  regional: string | null;
  lat: number | string | null;
  long: number | string | null;
};

/** O IBM do Mongo tem 14 dígitos com zeros à esquerda. */
function normalizaIbm(valor: string): string {
  const digitos = valor.replace(/\D/g, "");
  return digitos.padStart(14, "0");
}

function numero(valor: number | string | null): number | null {
  if (valor === null) return null;
  const n = typeof valor === "number" ? valor : Number(valor);
  return Number.isFinite(n) ? n : null;
}

/** Cadastro de localização dos postos (lat/long vindos de `ibm_info`). */
export async function listarLocalizacoes(): Promise<Localizacao[]> {
  const linhas = await consultar<Linha>(
    `select ibm, nomefantasia, endereco, cep, regional, lat, long
       from ibm_info
      where lat is not null and long is not null`,
  );

  const mapa = new Map<string, Localizacao>();
  for (const linha of linhas) {
    if (!linha.ibm) continue;
    const lat = numero(linha.lat);
    const lng = numero(linha.long);
    if (lat === null || lng === null || (lat === 0 && lng === 0)) continue;
    const ibm = normalizaIbm(linha.ibm);
    if (mapa.has(ibm)) continue;
    mapa.set(ibm, {
      ibm,
      nome: linha.nomefantasia?.trim() || ibm,
      endereco: linha.endereco?.trim() || null,
      cep: linha.cep?.trim() || null,
      regional: linha.regional?.trim() || null,
      lat,
      lng,
    });
  }
  return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
