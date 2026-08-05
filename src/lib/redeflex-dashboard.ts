import {
  getCategorias,
  getFuelSeries,
  getIndicators,
  getLojas,
  getProductSeries,
} from "./redeflex.functions";
// [MENSAL DESATIVADO] import { getMonthToDate } from "./redeflex.functions";
import {
  REDE_ID,
  extractPostoIds,
  groupByDate,
  parseKeyedSeries,
  sameWeekdayDates,
  variacao,
} from "./redeflex-transform";
// [MENSAL DESATIVADO] monthRanges, monthToDateDates, projectMonth

export type Selecao = string; // REDE_ID ou o IBM do posto

export type Periodo = "diario" | "mensal";

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

export type Categoria = {
  nome: string;
  receita: number;
  lucroBruto: number;
  lb: number;
  indice: number;
};

export type DashboardData = {
  comparativo: LinhaComparativo[];
  projecao: { combustivel: number; produto: number; referencia: string };
  periodo: Periodo;
  postos: string[];
  indicadores: Indicadores;
  categorias: { combustiveis: Categoria[]; produtos: Categoria[] };
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
  periodo: Periodo = "diario",
  referencia = dataReferencia(),
  fresh = false,
): Promise<DashboardData> {
  const porPosto = selecao !== REDE_ID;
  const datasSemana = sameWeekdayDates(referencia, 4);
  const corte = cutoffMinutes();
  // [MENSAL DESATIVADO] visão mensal suspensa: consultas acumuladas do mês eram
  // muito pesadas e derrubavam o carregamento em produção.
  // const datasMes = monthToDateDates(referencia);
  // const meses = monthRanges(referencia, 4);
  // const mesesCompletos = [...new Set(meses.flatMap((m) => m.diasCompletos))];
  // const mesesParciais = meses.map((m) => m.diaParcial);
  const datasEscopo = [referencia];
  const corteEscopo = { cutoffMinutes: corte };

  // Comparativo on-time: todos os dias cortados no mesmo horário.
  const [combustivelSemana, produtoSemana, indicadores, categorias] = await Promise.all([
    getFuelSeries({ data: { dates: datasSemana, porPosto, cutoffMinutes: corte, fresh } }),
    getProductSeries({ data: { dates: datasSemana, porPosto, cutoffMinutes: corte, fresh } }),
    getIndicators({
      data: { dates: datasEscopo, fresh, ...corteEscopo, ...(porPosto ? { ibm: selecao } : {}) },
    }),
    getCategorias({
      data: { dates: datasEscopo, fresh, ...corteEscopo, ...(porPosto ? { ibm: selecao } : {}) },
    }),
    // [MENSAL DESATIVADO] getMonthToDate + séries de meses cheios/parciais
    // getMonthToDate({ data: { referencia, fresh, ...(porPosto ? { ibm: selecao } : {}) } }),
    // getFuelSeries({ data: { dates: mesesCompletos, porPosto, fresh } }),
    // getProductSeries({ data: { dates: mesesCompletos, porPosto, fresh } }),
    // getFuelSeries({ data: { dates: mesesParciais, porPosto, cutoffMinutes: corte, fresh } }),
    // getProductSeries({ data: { dates: mesesParciais, porPosto, cutoffMinutes: corte, fresh } }),
  ]);

  const pontosCombustivel = parseKeyedSeries(combustivelSemana);
  const pontosProduto = parseKeyedSeries(produtoSemana);

  const filtro = porPosto ? selecao : undefined;
  const combustivelPorData = groupByDate(pontosCombustivel, filtro);
  const produtoPorData = groupByDate(pontosProduto, filtro);

  const comparativoSemanal = datasSemana.map((data, index) => {
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

  // [MENSAL DESATIVADO] Comparativo mensal (mesmo período acumulado dos meses anteriores):
  // const combustivelMesPorData = {
  //   ...groupByDate(parseKeyedSeries(combustivelMesesCheios), filtro),
  //   ...groupByDate(parseKeyedSeries(combustivelMesesParciais), filtro),
  // };
  // const produtoMesPorData = {
  //   ...groupByDate(parseKeyedSeries(produtoMesesCheios), filtro),
  //   ...groupByDate(parseKeyedSeries(produtoMesesParciais), filtro),
  // };
  // const somaMes = (mes: (typeof meses)[number], fonte: Record<string, number>) =>
  //   [...mes.diasCompletos, mes.diaParcial].reduce((acc, d) => acc + (fonte[d] ?? 0), 0);
  // const totaisMensais = meses.map((mes) => ({
  //   label: mes.label,
  //   galonagem: somaMes(mes, combustivelMesPorData),
  //   produto: somaMes(mes, produtoMesPorData),
  // }));
  // const comparativoMensal: LinhaComparativo[] = totaisMensais.map((mes, index) => {
  //   const anterior = index > 0 ? totaisMensais[index - 1] : undefined;
  //   return {
  //     dia: mes.label,
  //     galonagem: mes.galonagem,
  //     galonagemVar: variacao(mes.galonagem, anterior?.galonagem),
  //     produto: mes.produto,
  //     produtoVar: variacao(mes.produto, anterior?.produto),
  //   };
  // });
  // const acumuladoCombustivel = acumuladoMes.combustivel.litros;
  // const acumuladoProduto = acumuladoMes.produto.receita;
  const comparativo = comparativoSemanal;

  const fatorDia = corte > 0 ? 1440 / corte : 0;
  const projecao = {
    combustivel: Math.round((combustivelPorData[referencia] ?? 0) * fatorDia),
    produto: Math.round((produtoPorData[referencia] ?? 0) * fatorDia),
    referencia: `${formatReferencia(referencia)} ${formatCorte(corte)}`,
  };
  // [MENSAL DESATIVADO] projeção mensal:
  // { combustivel: Math.round(projectMonth(acumuladoCombustivel, referencia)),
  //   produto: Math.round(projectMonth(acumuladoProduto, referencia)),
  //   referencia: formatReferencia(referencia) }

  return {
    comparativo,
    projecao,
    periodo: "diario",
    postos: extractPostoIds(pontosCombustivel),
    indicadores,
    categorias,
    corte: formatCorte(corte),
  };
}

/** Lojas disponíveis para o filtro: IBM + nome fantasia. */
export async function loadLojas(): Promise<Loja[]> {
  return await getLojas();
}
