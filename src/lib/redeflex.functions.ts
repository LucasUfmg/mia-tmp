import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const seriesSchema = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1).max(120),
  porPosto: z.boolean().default(false),
  cutoffMinutes: z.number().int().min(0).max(1439).optional(),
  fresh: z.boolean().default(false),
});

const indicatorsSchema = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1).max(120),
  /** Um IBM ou uma lista de IBMs (valores agrupados). */
  ibm: z.union([z.string().min(1), z.array(z.string().min(1)).min(1).max(200)]).optional(),
  cutoffMinutes: z.number().int().min(0).max(1439).optional(),
  /** Início de um intervalo contínuo (visão mensal: 1º dia do mês). */
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fresh: z.boolean().default(false),
});

const postosSchema = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1).max(31),
  fresh: z.boolean().default(false),
});

const monthsSchema = z.object({
  referencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  count: z.number().int().min(1).max(12).default(4),
  cutoffMinutes: z.number().int().min(0).max(1439),
  porPosto: z.boolean().default(false),
  fresh: z.boolean().default(false),
});

/** Galonagem por mês (mesmo período acumulado): `{ "2026-08": 123 }`. */
export const getFuelMonths = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => monthsSchema.parse(input))
  .handler(async ({ data }) => {
    const { fresh, ...escopo } = data;
    try {
      const { comCache, chaveDeCache } = await import("./cache.server");
      return await comCache(chaveDeCache("fuelMonths", escopo), fresh, async () => {
        const { comSessao } = await import("./mongo.server");
        const { calcFuelByMonths } = await import("./redeflex-mongo.server");
        return await comSessao(async () =>
          calcFuelByMonths(escopo.referencia, escopo.count, escopo.cutoffMinutes, escopo.porPosto),
        );
      });
    } catch (error) {
      console.error("[RedeFlex:getFuelMonths]", error);
      throw error;
    }
  });

/** Produto (R$) por mês (mesmo período acumulado). */
export const getProductMonths = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => monthsSchema.parse(input))
  .handler(async ({ data }) => {
    const { fresh, ...escopo } = data;
    try {
      const { comCache, chaveDeCache } = await import("./cache.server");
      return await comCache(chaveDeCache("productMonths", escopo), fresh, async () => {
        const { comSessao } = await import("./mongo.server");
        const { calcProductByMonths } = await import("./redeflex-mongo.server");
        return await comSessao(async () =>
          calcProductByMonths(escopo.referencia, escopo.count, escopo.cutoffMinutes, escopo.porPosto),
        );
      });
    } catch (error) {
      console.error("[RedeFlex:getProductMonths]", error);
      throw error;
    }
  });

// [MENSAL DESATIVADO] Acumulado do mês (consulta pesada — suspensa):
// const monthToDateSchema = z.object({
//   referencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
//   ibm: z.string().min(1).optional(),
//   fresh: z.boolean().default(false),
// });
//
// export const getMonthToDate = createServerFn({ method: "POST" })
//   .inputValidator((input: unknown) => monthToDateSchema.parse(input))
//   .handler(async ({ data }) => {
//     const { fresh, ...escopo } = data;
//     try {
//       const { comCache, chaveDeCache } = await import("./cache.server");
//       return await comCache(chaveDeCache("monthToDate", escopo), fresh, async () => {
//         const { comSessao } = await import("./mongo.server");
//         const { calcFuelMonthToDate, calcProductMonthToDate } = await import(
//           "./redeflex-mongo.server"
//         );
//         return await comSessao(async () => {
//           const [combustivel, produto] = await Promise.all([
//             calcFuelMonthToDate(escopo.referencia, escopo.ibm),
//             calcProductMonthToDate(escopo.referencia, escopo.ibm),
//           ]);
//           return { combustivel, produto };
//         });
//       });
//     } catch (error) {
//       console.error("[RedeFlex:getMonthToDate]", error);
//       throw error;
//     }
//   });

/** Galonagem: `{ "2025-11-28": 8489.5 }` ou `{ "IBM_2025-11-28": 8489.5 }`. */
export const getFuelSeries = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => seriesSchema.parse(input))
  .handler(async ({ data }) => {
    const { fresh, ...escopo } = data;
    try {
      const { comCache, chaveDeCache } = await import("./cache.server");
      return await comCache(chaveDeCache("fuelSeries", escopo), fresh, async () => {
        const { comSessao } = await import("./mongo.server");
        const { calcFuelByDates, getVolumePorPosto } = await import("./redeflex-mongo.server");
        return await comSessao(async () =>
          escopo.porPosto
            ? await getVolumePorPosto(escopo.dates, true, escopo.cutoffMinutes)
            : await calcFuelByDates(escopo.dates, true, escopo.cutoffMinutes),
        );
      });
    } catch (error) {
      console.error("[RedeFlex:getFuelSeries]", error);
      throw error;
    }
  });

/** Produto (R$) no mesmo formato de chaves. */
export const getProductSeries = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => seriesSchema.parse(input))
  .handler(async ({ data }) => {
    const { fresh, ...escopo } = data;
    try {
      const { comCache, chaveDeCache } = await import("./cache.server");
      return await comCache(chaveDeCache("productSeries", escopo), fresh, async () => {
        const { comSessao } = await import("./mongo.server");
        const { calcProductByDates, getItensTotaisPorPosto } = await import(
          "./redeflex-mongo.server"
        );
        return await comSessao(async () =>
          escopo.porPosto
            ? await getItensTotaisPorPosto(escopo.dates, true, escopo.cutoffMinutes)
            : await calcProductByDates(escopo.dates, true, escopo.cutoffMinutes),
        );
      });
    } catch (error) {
      console.error("[RedeFlex:getProductSeries]", error);
      throw error;
    }
  });

/** IBMs disponíveis para o filtro do topo. */
export const getPostos = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => postosSchema.parse(input))
  .handler(async ({ data }) => {
    const { fresh, ...escopo } = data;
    try {
      const { comCache, chaveDeCache } = await import("./cache.server");
      return await comCache(chaveDeCache("postos", escopo), fresh, async () => {
        const { comSessao } = await import("./mongo.server");
        const { listarPostos } = await import("./redeflex-mongo.server");
        return await comSessao(async () => await listarPostos(escopo.dates));
      });
    } catch (error) {
      console.error("[RedeFlex:getPostos]", error);
      throw error;
    }
  });

/** Índices calculados (M/LT, TMV, TMC, TMP, LB %). */
export const getIndicators = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => indicatorsSchema.parse(input))
  .handler(async ({ data }) => {
    const { fresh, ...escopo } = data;
    try {
      const { comCache, chaveDeCache } = await import("./cache.server");
      return await comCache(chaveDeCache("indicators", escopo), fresh, async () => {
        const { comSessao } = await import("./mongo.server");
        const { getIndicadores } = await import("./redeflex-mongo.server");
        return await comSessao(
          async () =>
            await getIndicadores(escopo.dates, escopo.ibm, escopo.cutoffMinutes, escopo.desde),
        );
      });
    } catch (error) {
      console.error("[RedeFlex:getIndicators]", error);
      throw error;
    }
  });

/** Cadastro de lojas (IBM → nome fantasia). */
export const getLojas = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { comCache, chaveDeCache } = await import("./cache.server");
    return await comCache(chaveDeCache("lojas", null), false, async () => {
      const { comSessao } = await import("./mongo.server");
      const { listarLojas } = await import("./redeflex-mongo.server");
      return await comSessao(async () => await listarLojas());
    });
  } catch (error) {
    console.error("[RedeFlex:getLojas]", error);
    throw error;
  }
});

/** Distribuição por combustível e por grupo de produto. */
export const getCategorias = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => indicatorsSchema.parse(input))
  .handler(async ({ data }) => {
    const { fresh, ...escopo } = data;
    try {
      const { comCache, chaveDeCache } = await import("./cache.server");
      return await comCache(chaveDeCache("categorias", escopo), fresh, async () => {
        const { comSessao } = await import("./mongo.server");
        const { getCategoriasCombustivel, getCategoriasProduto } = await import(
          "./redeflex-mongo.server"
        );
        return await comSessao(async () => {
          const [combustiveis, produtos] = await Promise.all([
            getCategoriasCombustivel(escopo.dates, escopo.ibm, escopo.cutoffMinutes, escopo.desde),
            getCategoriasProduto(escopo.dates, escopo.ibm, escopo.cutoffMinutes, escopo.desde),
          ]);
          return { combustiveis, produtos };
        });
      });
    } catch (error) {
      console.error("[RedeFlex:getCategorias]", error);
      throw error;
    }
  });

/** Localização dos postos (lat/long do cadastro `ibm_info` no Postgres). */
export const getLocalizacoes = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { comCache, chaveDeCache } = await import("./cache.server");
    return await comCache(chaveDeCache("localizacoes", null), false, async () => {
      const { listarLocalizacoes } = await import("./redeflex-postgres.server");
      return await listarLocalizacoes();
    });
  } catch (error) {
    console.error("[RedeFlex:getLocalizacoes]", error);
    // Cadastro de localização é opcional: o painel usa o arquivo local quando
    // o Postgres não responde.
    return [] as import("./redeflex-postgres.server").Localizacao[];
  }
});

/** Índices de combustível de todos os postos no período (mapa da rede). */
export const getIndicatorsPorPosto = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => indicatorsSchema.parse(input))
  .handler(async ({ data }) => {
    const { fresh, ibm: _ibm, ...escopo } = data;
    try {
      const { comCache, chaveDeCache } = await import("./cache.server");
      return await comCache(chaveDeCache("indicatorsPorPosto", escopo), fresh, async () => {
        const { comSessao } = await import("./mongo.server");
        const { getIndicadoresPorPosto } = await import("./redeflex-mongo.server");
        return await comSessao(
          async () =>
            await getIndicadoresPorPosto(escopo.dates, escopo.cutoffMinutes, escopo.desde),
        );
      });
    } catch (error) {
      console.error("[RedeFlex:getIndicatorsPorPosto]", error);
      throw error;
    }
  });
