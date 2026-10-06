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
