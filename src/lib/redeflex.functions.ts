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
  ibm: z.string().min(1).optional(),
  cutoffMinutes: z.number().int().min(0).max(1439).optional(),
  fresh: z.boolean().default(false),
});

const postosSchema = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1).max(31),
  fresh: z.boolean().default(false),
});

const monthToDateSchema = z.object({
  referencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ibm: z.string().min(1).optional(),
  fresh: z.boolean().default(false),
});

/** Acumulado do 1º dia do mês até agora, direto do banco. */
export const getMonthToDate = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => monthToDateSchema.parse(input))
  .handler(async ({ data }) => {
    const { fresh, ...escopo } = data;
    try {
      const { comCache, chaveDeCache } = await import("./cache.server");
      return await comCache(chaveDeCache("monthToDate", escopo), fresh, async () => {
        const { comSessao } = await import("./mongo.server");
        const { calcFuelMonthToDate, calcProductMonthToDate } = await import(
          "./redeflex-mongo.server"
        );
        return await comSessao(async () => {
          const [combustivel, produto] = await Promise.all([
            calcFuelMonthToDate(escopo.referencia, escopo.ibm),
            calcProductMonthToDate(escopo.referencia, escopo.ibm),
          ]);
          return { combustivel, produto };
        });
      });
    } catch (error) {
      console.error("[RedeFlex:getMonthToDate]", error);
      throw error;
    }
  });

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
          async () => await getIndicadores(escopo.dates, escopo.ibm, escopo.cutoffMinutes),
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
            getCategoriasCombustivel(escopo.dates, escopo.ibm, escopo.cutoffMinutes),
            getCategoriasProduto(escopo.dates, escopo.ibm, escopo.cutoffMinutes),
          ]);
          return { combustiveis, produtos };
        });
      });
    } catch (error) {
      console.error("[RedeFlex:getCategorias]", error);
      throw error;
    }
  });
