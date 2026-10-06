import type { ReceitaCusto } from "./redeflex.functions";

/** Receita e custo do BI para um posto (ou rede) em um mês. */
export async function receitaCustoDoBi(data: {
  mes: string;
  ibm?: string | undefined;
  fresh?: boolean;
  /** Corta o mês no mesmo dia/hora (horário de São Paulo). */
  corte?: { dia: number; minutos: number };
}): Promise<ReceitaCusto> {
  const fresh = data.fresh ?? false;
    const hoje = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    const [ano, mesNum] = data.mes.split("-").map(Number) as [number, number];
    const ultimoDia = new Date(Date.UTC(ano, mesNum, 0)).getUTCDate();
    const fimDoMes = `${data.mes.slice(0, 7)}-${String(ultimoDia).padStart(2, "0")}`;
    const parcial = hoje >= data.mes && hoje <= fimDoMes;
    let ate = parcial ? hoje : fimDoMes;

    let cutoffMinutes: number | undefined;
    if (parcial) {
      const [hora, minuto] = new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
        .format(new Date())
        .split(":")
        .map(Number);
      cutoffMinutes = (hora ?? 0) * 60 + (minuto ?? 0);
    } else if (data.corte && hoje > fimDoMes) {
      if (data.corte.dia <= ultimoDia) {
        ate = `${data.mes.slice(0, 7)}-${String(data.corte.dia).padStart(2, "0")}`;
        cutoffMinutes = data.corte.minutos;
      }
    }

    const escopo = {
      dates: [ate],
      desde: data.mes,
      ...(data.ibm ? { ibm: data.ibm } : {}),
      ...(cutoffMinutes !== undefined ? { cutoffMinutes } : {}),
    };

    try {
      const { comCache, chaveDeCache } = await import("./cache.server");
      const indicadores = await comCache(
        chaveDeCache("receitaCusto", escopo),
        fresh,
        async () => {
          const { comSessao } = await import("./mongo.server");
          const { getIndicadores } = await import("./redeflex-mongo.server");
          return await comSessao(
            async () =>
              await getIndicadores(escopo.dates, escopo.ibm, escopo.cutoffMinutes, escopo.desde),
          );
        },
        // Mês fechado não muda: guarda por 12 h. Mês corrente: 5 min.
        parcial ? 5 * 60_000 : 12 * 60 * 60_000,
      );

       const vendaCombustivel = indicadores.combustivel.receita;
       const vendaMercadorias = indicadores.produto.receita;
       const custoCombustivel = vendaCombustivel - indicadores.combustivel.lucroBruto;
       const custoMercadoria = vendaMercadorias - indicadores.produto.lucroBruto;
       const receita = vendaCombustivel + vendaMercadorias;
       const custo = custoCombustivel + custoMercadoria;
       return {
         receita,
         custo,
         vendaCombustivel,
         vendaMercadorias,
         vendaServicos: 0,
         custoCombustivel,
         custoMercadoria,
         litrosVendidos: indicadores.combustivel.litros,
         abastecimentosRealizados: indicadores.combustivel.atendimentos,
         margemProduto: vendaMercadorias ? ((vendaMercadorias - custoMercadoria) / vendaMercadorias) * 100 : 0,
         margemCombustivel: vendaCombustivel ? ((vendaCombustivel - custoCombustivel) / vendaCombustivel) * 100 : 0,
         parcial,
         ate,
       };
    } catch (error) {
      console.error("[RedeFlex:getReceitaCusto]", error);
      throw error;
    }
}

/** Receita/custo do BI de vários meses de um posto (ou rede) em uma única consulta. */
export async function receitaCustoPorMes(data: {
  meses: string[];
  ibm?: string | undefined;
  corte?: { dia: number; minutos: number } | undefined;
}): Promise<Record<string, ReceitaCusto>> {
  const meses = [...new Set(data.meses)].sort();
  if (meses.length === 0) return {};
  const desde = meses[0]!;
  const ultimo = meses[meses.length - 1]!;
  const [a, m] = ultimo.split("-").map(Number) as [number, number];
  const ate = `${ultimo.slice(0, 7)}-${String(new Date(Date.UTC(a, m, 0)).getUTCDate()).padStart(2, "0")}`;
  const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

  const { comCache, chaveDeCache } = await import("./cache.server");
  const porMes = await comCache(
    chaveDeCache("receitaCustoPorMes", { desde, ate, ibm: data.ibm ?? "", corte: data.corte ?? null, hoje }),
    false,
    async () => {
      const { comSessao } = await import("./mongo.server");
      const { getIndicadoresPorMes } = await import("./redeflex-mongo.server");
      return await comSessao(async () => await getIndicadoresPorMes(desde, ate, data.ibm, data.corte));
    },
  );

  const saida: Record<string, ReceitaCusto> = {};
  for (const mes of meses) {
    const i = porMes[mes.slice(0, 7)];
    const vendaCombustivel = i?.receitaComb ?? 0;
    const vendaMercadorias = i?.receitaProd ?? 0;
    const custoCombustivel = i?.custoComb ?? 0;
    const custoMercadoria = i?.custoProd ?? 0;
    const parcial = hoje.slice(0, 7) === mes.slice(0, 7);
    saida[mes] = {
      receita: vendaCombustivel + vendaMercadorias,
      custo: custoCombustivel + custoMercadoria,
      vendaCombustivel,
      vendaMercadorias,
      vendaServicos: 0,
      custoCombustivel,
      custoMercadoria,
      litrosVendidos: i?.litros ?? 0,
      abastecimentosRealizados: i?.atendimentos ?? 0,
      margemProduto: vendaMercadorias ? ((vendaMercadorias - custoMercadoria) / vendaMercadorias) * 100 : 0,
      margemCombustivel: vendaCombustivel ? ((vendaCombustivel - custoCombustivel) / vendaCombustivel) * 100 : 0,
      parcial,
      ate: parcial ? hoje : mes,
    };
  }
  return saida;
}
