import { getFuelSeries, getPostos, getProductSeries } from "./redeflex.functions";
import {
  REDE_ID,
  extractPostoIds,
  groupByDate,
  monthToDateDates,
  parseKeyedSeries,
  projectMonth,
  sameWeekdayDates,
  variacao,
} from "./redeflex-transform";

export type Selecao = string; // REDE_ID ou o IBM do posto

export type LinhaComparativo = {
  dia: string;
  galonagem: number;
  galonagemVar: number | null;
  produto: number;
  produtoVar: number | null;
};

export type DashboardData = {
  comparativo: LinhaComparativo[];
  projecao: { combustivel: number; produto: number; referencia: string };
  postos: string[];
};

/** Data de referência = hoje no fuso de São Paulo. */
export function dataReferencia(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatDia(data: string): string {
  const [, mes, dia] = data.split("-");
  return `${dia}/${mes}`;
}

function formatReferencia(data: string): string {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

export async function loadDashboardData(
  selecao: Selecao,
  referencia = dataReferencia(),
): Promise<DashboardData> {
  const porPosto = selecao !== REDE_ID;
  const datasSemana = sameWeekdayDates(referencia, 4);
  const datasMes = monthToDateDates(referencia);
  const datas = [...new Set([...datasSemana, ...datasMes])];

  const [combustivelBruto, produtoBruto] = await Promise.all([
    getFuelSeries({ data: { dates: datas, porPosto } }),
    getProductSeries({ data: { dates: datas, porPosto } }),
  ]);

  const pontosCombustivel = parseKeyedSeries(combustivelBruto);
  const pontosProduto = parseKeyedSeries(produtoBruto);

  const filtro = porPosto ? selecao : undefined;
  const combustivelPorData = groupByDate(pontosCombustivel, filtro);
  const produtoPorData = groupByDate(pontosProduto, filtro);

  const comparativo = datasSemana.map((data, index) => {
    const anterior = index > 0 ? datasSemana[index - 1] : undefined;
    const galonagem = combustivelPorData[data] ?? 0;
    const produto = produtoPorData[data] ?? 0;
    return {
      dia: formatDia(data),
      galonagem,
      galonagemVar: variacao(galonagem, anterior ? (combustivelPorData[anterior] ?? 0) : undefined),
      produto,
      produtoVar: variacao(produto, anterior ? (produtoPorData[anterior] ?? 0) : undefined),
    };
  });

  const acumuladoCombustivel = datasMes.reduce((s, d) => s + (combustivelPorData[d] ?? 0), 0);
  const acumuladoProduto = datasMes.reduce((s, d) => s + (produtoPorData[d] ?? 0), 0);

  return {
    comparativo,
    projecao: {
      combustivel: Math.round(projectMonth(acumuladoCombustivel, referencia)),
      produto: Math.round(projectMonth(acumuladoProduto, referencia)),
      referencia: formatReferencia(referencia),
    },
    postos: extractPostoIds(pontosCombustivel),
  };
}

/** IBMs disponíveis, derivados dos dados por posto nos últimos dias. */
export async function loadPostos(referencia = dataReferencia()): Promise<string[]> {
  const datas = sameWeekdayDates(referencia, 4);
  return await getPostos({ data: { dates: datas } });
}
