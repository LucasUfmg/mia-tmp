import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const seriesSchema = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1).max(120),
  porPosto: z.boolean().default(false),
  cutoffMinutes: z.number().int().min(0).max(1439).optional(),
});

const indicatorsSchema = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1).max(120),
  ibm: z.string().min(1).optional(),
  cutoffMinutes: z.number().int().min(0).max(1439).optional(),
});

const postosSchema = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1).max(31),
});

const monthToDateSchema = z.object({
  referencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ibm: z.string().min(1).optional(),
});

/** Acumulado do 1º dia do mês até agora, direto do banco. */
export const getMonthToDate = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => monthToDateSchema.parse(input))
  .handler(async ({ data }) => {
    const { comSessao } = await import("./mongo.server");
    const { calcFuelMonthToDate, calcProductMonthToDate } = await import(
      "./redeflex-mongo.server"
    );
    return await comSessao(async () => {
      const [combustivel, produto] = await Promise.all([
        calcFuelMonthToDate(data.referencia, data.ibm),
        calcProductMonthToDate(data.referencia, data.ibm),
      ]);
      return { combustivel, produto };
    });
  });

/** Galonagem: `{ "2025-11-28": 8489.5 }` ou `{ "IBM_2025-11-28": 8489.5 }`. */
export const getFuelSeries = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => seriesSchema.parse(input))
  .handler(async ({ data }) => {
    const { comSessao } = await import("./mongo.server");
    const { calcFuelByDates, getVolumePorPosto } = await import("./redeflex-mongo.server");
    return await comSessao(async () =>
      data.porPosto
        ? await getVolumePorPosto(data.dates, true, data.cutoffMinutes)
        : await calcFuelByDates(data.dates, true, data.cutoffMinutes),
    );
  });

/** Produto (R$) no mesmo formato de chaves. */
export const getProductSeries = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => seriesSchema.parse(input))
  .handler(async ({ data }) => {
    const { comSessao } = await import("./mongo.server");
    const { calcProductByDates, getItensTotaisPorPosto } = await import(
      "./redeflex-mongo.server"
    );
    return await comSessao(async () =>
      data.porPosto
        ? await getItensTotaisPorPosto(data.dates, true, data.cutoffMinutes)
        : await calcProductByDates(data.dates, true, data.cutoffMinutes),
    );
  });

/** IBMs disponíveis para o filtro do topo. */
export const getPostos = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => postosSchema.parse(input))
  .handler(async ({ data }) => {
    const { comSessao } = await import("./mongo.server");
    const { listarPostos } = await import("./redeflex-mongo.server");
    return await comSessao(async () => await listarPostos(data.dates));
  });

/** Índices calculados (M/LT, TMV, TMC, TMP, LB %). */
export const getIndicators = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => indicatorsSchema.parse(input))
  .handler(async ({ data }) => {
    const { comSessao } = await import("./mongo.server");
    const { getIndicadores } = await import("./redeflex-mongo.server");
    return await comSessao(
      async () => await getIndicadores(data.dates, data.ibm, data.cutoffMinutes),
    );
  });

/** Cadastro de lojas (IBM → nome fantasia). */
export const getLojas = createServerFn({ method: "GET" }).handler(async () => {
  const { comSessao } = await import("./mongo.server");
  const { listarLojas } = await import("./redeflex-mongo.server");
  return await comSessao(async () => await listarLojas());
});

/** Distribuição por combustível e por grupo de produto. */
export const getCategorias = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => indicatorsSchema.parse(input))
  .handler(async ({ data }) => {
    const { comSessao } = await import("./mongo.server");
    const { getCategoriasCombustivel, getCategoriasProduto } = await import(
      "./redeflex-mongo.server"
    );
    return await comSessao(async () => {
      const [combustiveis, produtos] = await Promise.all([
        getCategoriasCombustivel(data.dates, data.ibm, data.cutoffMinutes),
        getCategoriasProduto(data.dates, data.ibm, data.cutoffMinutes),
      ]);
      return { combustiveis, produtos };
    });
  });