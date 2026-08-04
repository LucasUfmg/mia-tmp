import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const seriesSchema = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1).max(120),
  porPosto: z.boolean().default(false),
});

const postosSchema = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1).max(31),
});

/** Galonagem: `{ "2025-11-28": 8489.5 }` ou `{ "IBM_2025-11-28": 8489.5 }`. */
export const getFuelSeries = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => seriesSchema.parse(input))
  .handler(async ({ data }) => {
    const { calcFuelByDates, getVolumePorPosto } = await import("./redeflex-mongo.server");
    return data.porPosto
      ? await getVolumePorPosto(data.dates)
      : await calcFuelByDates(data.dates);
  });

/** Produto (R$) no mesmo formato de chaves. */
export const getProductSeries = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => seriesSchema.parse(input))
  .handler(async ({ data }) => {
    const { calcProductByDates, getItensTotaisPorPosto } = await import(
      "./redeflex-mongo.server"
    );
    return data.porPosto
      ? await getItensTotaisPorPosto(data.dates)
      : await calcProductByDates(data.dates);
  });

/** IBMs disponíveis para o filtro do topo. */
export const getPostos = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => postosSchema.parse(input))
  .handler(async ({ data }) => {
    const { listarPostos } = await import("./redeflex-mongo.server");
    return await listarPostos(data.dates);
  });