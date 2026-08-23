import {
  getCategorias,
  getFuelSeries,
  getFuelMonths,
  getIndicators,
  getLojas,
  getProductSeries,
  getProductMonths,
  getVendedores,
} from "./redeflex.functions";
import {
  REDE_ID,
  extractPostoIds,
  groupByDate,
  parseKeyedSeries,
  projectMonth,
  sameWeekdayDates,
  variacao,
} from "./redeflex-transform";

/** Lista de IBMs selecionados; vazia (ou com `REDE_ID`) = rede inteira. */
export type Selecao = string[];

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

/** "2026-08" → "08/2026" */
function formatMes(mes: string): string {
  const [ano, m] = mes.split("-");
  return `${m}/${ano}`;
}

/** Primeiro dia do mês da referência (para o acumulado mensal). */
function primeiroDiaDoMes(referencia: string): string {
  const [ano, mes] = referencia.split("-");
  return `${ano}-${mes}-01`;
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
  const ibms = [...new Set(selecao.filter((id) => id && id !== REDE_ID))].sort();
  const porPosto = ibms.length > 0;
  const corte = cutoffMinutes();
  const mensal = periodo === "mensal";
  const filtro = porPosto ? ibms : undefined;

  // Escopo dos indicadores/categorias: o dia (on-time) ou o acumulado do mês.
  const escopoIndices = {
    dates: [referencia],
    cutoffMinutes: corte,
    ...(mensal ? { desde: primeiroDiaDoMes(referencia) } : {}),
    ...(porPosto ? { ibm: ibms } : {}),
  };

  if (mensal) {
    const [combustivelMeses, produtoMeses, indicadores, categorias] = await Promise.all([
      getFuelMonths({ data: { referencia, count: 4, cutoffMinutes: corte, porPosto, fresh } }),
      getProductMonths({ data: { referencia, count: 4, cutoffMinutes: corte, porPosto, fresh } }),
      getIndicators({ data: { ...escopoIndices, fresh } }),
      getCategorias({ data: { ...escopoIndices, fresh } }),
    ]);

    const pontosCombustivelMes = parseKeyedSeries(combustivelMeses);
    const pontosProdutoMes = parseKeyedSeries(produtoMeses);
    const combustivelPorMes = groupByDate(pontosCombustivelMes, filtro);
    const produtoPorMes = groupByDate(pontosProdutoMes, filtro);
    const meses = [...new Set([...Object.keys(combustivelPorMes), ...Object.keys(produtoPorMes)])]
      .sort()
      .slice(-4);

    const comparativo = meses.map((mes, index) => {
      const anterior = index > 0 ? meses[index - 1] : undefined;
      const galonagem = combustivelPorMes[mes] ?? 0;
      const produto = produtoPorMes[mes] ?? 0;
      return {
        dia: formatMes(mes),
        galonagem,
        galonagemVar: variacao(galonagem, anterior ? (combustivelPorMes[anterior] ?? 0) : undefined),
        produto,
        produtoVar: variacao(produto, anterior ? (produtoPorMes[anterior] ?? 0) : undefined),
      };
    });

    return {
      comparativo,
      projecao: {
        combustivel: Math.round(projectMonth(indicadores.combustivel.litros, referencia)),
        produto: Math.round(projectMonth(indicadores.produto.receita, referencia)),
        referencia: formatReferencia(referencia),
      },
      periodo: "mensal",
      postos: extractPostoIds(pontosCombustivelMes),
      indicadores,
      categorias,
      corte: formatCorte(corte),
    };
  }

  const datasSemana = sameWeekdayDates(referencia, 4);

  // Comparativo on-time: todos os dias cortados no mesmo horário.
  const [combustivelSemana, produtoSemana, indicadores, categorias] = await Promise.all([
    getFuelSeries({ data: { dates: datasSemana, porPosto, cutoffMinutes: corte, fresh } }),
    getProductSeries({ data: { dates: datasSemana, porPosto, cutoffMinutes: corte, fresh } }),
    getIndicators({ data: { ...escopoIndices, fresh } }),
    getCategorias({ data: { ...escopoIndices, fresh } }),
  ]);

  const pontosCombustivel = parseKeyedSeries(combustivelSemana);
  const pontosProduto = parseKeyedSeries(produtoSemana);

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

  const comparativo = comparativoSemanal;

  const fatorDia = corte > 0 ? 1440 / corte : 0;
  const projecao = {
    combustivel: Math.round((combustivelPorData[referencia] ?? 0) * fatorDia),
    produto: Math.round((produtoPorData[referencia] ?? 0) * fatorDia),
    referencia: `${formatReferencia(referencia)} ${formatCorte(corte)}`,
  };

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

export type Vendedor = {
  ibm: string;
  ven: string;
  nome: string;
  litros: number;
  receita: number;
  lucroBruto: number;
  atendimentos: number;
  mlt: number;
  tmc: number;
  tmv: number;
};

/** Ranking de vendedores de combustível, com os mesmos filtros do painel. */
export async function loadRankingVendedores(
  selecao: Selecao,
  periodo: Periodo = "diario",
  ordem: "maiores" | "menores" = "maiores",
  limite = 10,
  referencia = dataReferencia(),
  fresh = false,
): Promise<Vendedor[]> {
  const ibms = [...new Set(selecao.filter((id) => id && id !== REDE_ID))].sort();
  const corte = cutoffMinutes();
  return await getVendedores({
    data: {
      dates: [referencia],
      cutoffMinutes: corte,
      ordem,
      limite,
      fresh,
      ...(periodo === "mensal" ? { desde: primeiroDiaDoMes(referencia) } : {}),
      ...(ibms.length > 0 ? { ibm: ibms } : {}),
    },
  });
}
