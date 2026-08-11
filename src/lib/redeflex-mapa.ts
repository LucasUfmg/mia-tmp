import { getIndicatorsPorPosto, getLocalizacoes } from "./redeflex.functions";
import { POSTOS_LOCALIZADOS } from "@/data/postos-localizacao";
import { cutoffMinutes, dataReferencia, type Periodo } from "./redeflex-dashboard";

export type PostoMapa = {
  ibm: string;
  nome: string;
  endereco: string | null;
  lat: number;
  lng: number;
  /** Métricas do período; nulas quando o posto não teve movimento. */
  litros: number;
  receita: number;
  lucroBruto: number;
  mlt: number;
  tmc: number;
  comDados: boolean;
};

function primeiroDiaDoMes(referencia: string): string {
  const [ano, mes] = referencia.split("-");
  return `${ano}-${mes}-01`;
}

/**
 * Junta o cadastro de localização (Postgres) com os índices por posto (Mongo)
 * usando o IBM como chave.
 */
export async function loadMapa(periodo: Periodo = "diario", fresh = false): Promise<PostoMapa[]> {
  const referencia = dataReferencia();
  const corte = cutoffMinutes();

  const [localizacoes, indicadores] = await Promise.all([
    // O cadastro de lat/long vive no Postgres do backend; se ele estiver
    // inacessível o painel continua funcionando, só sem o mapa.
    getLocalizacoes().catch((erro: unknown) => {
      console.error("[RedeFlex] localizações indisponíveis", erro);
      return [] as Awaited<ReturnType<typeof getLocalizacoes>>;
    }),
    getIndicatorsPorPosto({
      data: {
        dates: [referencia],
        cutoffMinutes: corte,
        ...(periodo === "mensal" ? { desde: primeiroDiaDoMes(referencia) } : {}),
        fresh,
      },
    }),
  ]);

  const porIbm = new Map(indicadores.map((item) => [item.ibm, item]));

  // Cadastro do Postgres tem prioridade; o arquivo buscado por CNPJ cobre o resto.
  const base = new Map<string, { ibm: string; nome: string; endereco: string | null; lat: number; lng: number }>();
  for (const posto of POSTOS_LOCALIZADOS) {
    base.set(posto.ibm, {
      ibm: posto.ibm,
      nome: posto.nome,
      endereco: posto.endereco,
      lat: posto.lat,
      lng: posto.lng,
    });
  }
  for (const loja of localizacoes) {
    base.set(loja.ibm, {
      ibm: loja.ibm,
      nome: loja.nome,
      endereco: loja.endereco,
      lat: loja.lat,
      lng: loja.lng,
    });
  }

  return [...base.values()]
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    .map((loja) => {
    const dados = porIbm.get(loja.ibm);
    return {
      ibm: loja.ibm,
      nome: loja.nome,
      endereco: loja.endereco,
      lat: loja.lat,
      lng: loja.lng,
      litros: dados?.litros ?? 0,
      receita: dados?.receita ?? 0,
      lucroBruto: dados?.lucroBruto ?? 0,
      mlt: dados?.mlt ?? 0,
      tmc: dados?.tmc ?? 0,
      comDados: Boolean(dados && dados.litros > 0),
    };
  });
}
