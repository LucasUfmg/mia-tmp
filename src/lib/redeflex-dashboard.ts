import {
  getCategorias,
  getFuelSeries,
  getIndicators,
  getLojas,
  getMonthToDate,
  getProductSeries,
} from "./redeflex.functions";
import {
  REDE_ID,
  extractPostoIds,
  groupByDate,
  monthRanges,
  monthToDateDates,
  parseKeyedSeries,
  projectMonth,
  sameWeekdayDates,
  variacao,
} from "./redeflex-transform";

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
  periodo: Periodo = "mensal",
  referencia = dataReferencia(),
  fresh = false,
): Promise<DashboardData> {
  const porPosto = selecao !== REDE_ID;
  const datasSemana = sameWeekdayDates(referencia, 4);
  const datasMes = monthToDateDates(referencia);
  const datas = [...new Set([...datasSemana, ...datasMes])];
  const corte = cutoffMinutes();
  const diario = periodo === "diario";
  const datasEscopo = diario ? [referencia] : datasMes;
  const corteEscopo = diario ? { cutoffMinutes: corte } : {};
  const meses = monthRanges(referencia, 4);
  const mesesCompletos = [...new Set(meses.flatMap((m) => m.diasCompletos))];
  const mesesParciais = meses.map((m) => m.diaParcial);

  // Comparativo on-time: todos os dias cortados no mesmo horário.
  const [
    combustivelSemana,
    produtoSemana,
    acumuladoMes,
    indicadores,
    categorias,
    combustivelMesesCheios,
    produtoMesesCheios,
    combustivelMesesParciais,
    produtoMesesParciais,
  ] =
    await Promise.all([
      getFuelSeries({ data: { dates: datasSemana, porPosto, cutoffMinutes: corte, fresh } }),
      getProductSeries({ data: { dates: datasSemana, porPosto, cutoffMinutes: corte, fresh } }),
      getMonthToDate({ data: { referencia, fresh, ...(porPosto ? { ibm: selecao } : {}) } }),
      getIndicators({
        data: { dates: datasEscopo, fresh, ...corteEscopo, ...(porPosto ? { ibm: selecao } : {}) },
      }),
      getCategorias({
        data: { dates: datasEscopo, fresh, ...corteEscopo, ...(porPosto ? { ibm: selecao } : {}) },
      }),
      diario
        ? Promise.resolve({})
        : getFuelSeries({ data: { dates: mesesCompletos, porPosto, fresh } }),
      diario
        ? Promise.resolve({})
        : getProductSeries({ data: { dates: mesesCompletos, porPosto, fresh } }),
      diario
        ? Promise.resolve({})
        : getFuelSeries({ data: { dates: mesesParciais, porPosto, cutoffMinutes: corte, fresh } }),
      diario
        ? Promise.resolve({})
        : getProductSeries({
            data: { dates: mesesParciais, porPosto, cutoffMinutes: corte, fresh },
          }),
    ]);
  void datas;

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

  // Comparativo mensal (mesmo período): dias fechados + dia atual on-time.
  const combustivelMesPorData = {
    ...groupByDate(parseKeyedSeries(combustivelMesesCheios), filtro),
    ...groupByDate(parseKeyedSeries(combustivelMesesParciais), filtro),
  };
  const produtoMesPorData = {
    ...groupByDate(parseKeyedSeries(produtoMesesCheios), filtro),
    ...groupByDate(parseKeyedSeries(produtoMesesParciais), filtro),
  };

  const somaMes = (mes: (typeof meses)[number], fonte: Record<string, number>) =>
    [...mes.diasCompletos, mes.diaParcial].reduce((acc, d) => acc + (fonte[d] ?? 0), 0);

  const totaisMensais = meses.map((mes) => ({
    label: mes.label,
    galonagem: somaMes(mes, combustivelMesPorData),
    produto: somaMes(mes, produtoMesPorData),
  }));

  const comparativoMensal: LinhaComparativo[] = totaisMensais.map((mes, index) => {
    const anterior = index > 0 ? totaisMensais[index - 1] : undefined;
    return {
      dia: mes.label,
      galonagem: mes.galonagem,
      galonagemVar: variacao(mes.galonagem, anterior?.galonagem),
      produto: mes.produto,
      produtoVar: variacao(mes.produto, anterior?.produto),
    };
  });

  const comparativo = diario ? comparativoSemanal : comparativoMensal;

  const acumuladoCombustivel = acumuladoMes.combustivel.litros;
  const acumuladoProduto = acumuladoMes.produto.receita;

  const fatorDia = corte > 0 ? 1440 / corte : 0;
  const projecao = diario
    ? {
        combustivel: Math.round((combustivelPorData[referencia] ?? 0) * fatorDia),
        produto: Math.round((produtoPorData[referencia] ?? 0) * fatorDia),
        referencia: `${formatReferencia(referencia)} ${formatCorte(corte)}`,
      }
    : {
        combustivel: Math.round(projectMonth(acumuladoCombustivel, referencia)),
        produto: Math.round(projectMonth(acumuladoProduto, referencia)),
        referencia: formatReferencia(referencia),
      };

  return {
    comparativo,
    projecao,
    periodo,
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
