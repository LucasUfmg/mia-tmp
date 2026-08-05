import { getFuelSeries, getIndicators, getLojas, getProductSeries } from "./redeflex.functions";
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

export type Loja = { ibm: string; nome: string };

export type Indicadores = {
  combustivel: {
    litros: number;
    receita: number;
    lucroBruto: number;
    atendimentos: number;
    mlt: number;
    tmv: number;
    tmc: number;
    lb: number;
  };
  produto: { receita: number; lucroBruto: number; cupons: number; tmp: number; lb: number };
};

export type DashboardData = {
  comparativo: LinhaComparativo[];
  projecao: { combustivel: number; produto: number; referencia: string };
  postos: string[];
  indicadores: Indicadores;
  corte: string;
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

/** Minutos decorridos do dia no fuso de São Paulo (corte on-time). */
export function cutoffMinutes(): number {
  const [hora, minuto] = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date())
    .split(":")
    .map(Number);
  return (hora ?? 0) * 60 + (minuto ?? 0);
}

function formatCorte(minutos: number): string {
  const h = String(Math.floor(minutos / 60)).padStart(2, "0");
  const m = String(minutos % 60).padStart(2, "0");
  return `${h}:${m}`;
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
  const corte = cutoffMinutes();

  // Comparativo on-time: todos os dias cortados no mesmo horário.
  const [combustivelSemana, produtoSemana, combustivelMes, produtoMes, indicadores] =
    await Promise.all([
      getFuelSeries({ data: { dates: datasSemana, porPosto, cutoffMinutes: corte } }),
      getProductSeries({ data: { dates: datasSemana, porPosto, cutoffMinutes: corte } }),
      getFuelSeries({ data: { dates: datasMes, porPosto } }),
      getProductSeries({ data: { dates: datasMes, porPosto } }),
      getIndicators({ data: { dates: datasMes, ...(porPosto ? { ibm: selecao } : {}) } }),
    ]);
  void datas;

  const pontosCombustivel = parseKeyedSeries(combustivelSemana);
  const pontosProduto = parseKeyedSeries(produtoSemana);
  const pontosCombustivelMes = parseKeyedSeries(combustivelMes);
  const pontosProdutoMes = parseKeyedSeries(produtoMes);

  const filtro = porPosto ? selecao : undefined;
  const combustivelPorData = groupByDate(pontosCombustivel, filtro);
  const produtoPorData = groupByDate(pontosProduto, filtro);
  const combustivelMesPorData = groupByDate(pontosCombustivelMes, filtro);
  const produtoMesPorData = groupByDate(pontosProdutoMes, filtro);

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

  const acumuladoCombustivel = datasMes.reduce((s, d) => s + (combustivelMesPorData[d] ?? 0), 0);
  const acumuladoProduto = datasMes.reduce((s, d) => s + (produtoMesPorData[d] ?? 0), 0);

  return {
    comparativo,
    projecao: {
      combustivel: Math.round(projectMonth(acumuladoCombustivel, referencia)),
      produto: Math.round(projectMonth(acumuladoProduto, referencia)),
      referencia: formatReferencia(referencia),
    },
    postos: extractPostoIds(pontosCombustivelMes),
    indicadores,
    corte: formatCorte(corte),
  };
}

/** Lojas disponíveis para o filtro: IBM + nome fantasia. */
export async function loadLojas(): Promise<Loja[]> {
  return await getLojas();
}
