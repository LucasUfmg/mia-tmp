import type { Document } from "mongodb";

import { colecao } from "./mongo.server";

/**
 * Porte das agregações de `src/Services/DataService.ts` do micro-serviço.
 *
 * O banco grava `dtHr` com um deslocamento de 3 horas incorreto — por isso os
 * limites do dia são calculados em UTC puro, exatamente como no original
 * (`date.minus({ hours: 3 }).toUTC()` + `timezone: '-00:00'` no agrupamento).
 */

const COLECAO_ABASTECIMENTOS = ["Abastecimentos", "abastecimentos"];
const COLECAO_VENDAS = ["Vendas", "vendas"];

function limites(data: string, toEndOfDay: boolean) {
  const start = new Date(`${data}T00:00:00.000Z`);
  const agora = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const fimDoDia = new Date(`${data}T23:59:59.999Z`);
  const end = toEndOfDay ? fimDoDia : agora < fimDoDia ? agora : fimDoDia;
  return { $gte: start, $lte: end };
}

function filtroDatas(dates: string[], toEndOfDay: boolean) {
  return { $or: dates.map((data) => ({ dtHr: limites(data, toEndOfDay) })) };
}

const dataFormatada = {
  $dateToString: { format: "%Y-%m-%d", date: "$dtHr", timezone: "-00:00" },
};

type LinhaData = { _id: string; total: number };
type LinhaPosto = { _id: { data: string; ibm: string }; total: number };

async function agregar<T extends Document>(
  fonte: "gasMonitor" | "sales",
  candidatos: string[],
  pipeline: Document[],
): Promise<T[]> {
  const col = await colecao(fonte, candidatos);
  return (await col.aggregate(pipeline).toArray()) as unknown as T[];
}

function porData(linhas: LinhaData[]): Record<string, number> {
  return linhas.reduce<Record<string, number>>((acc, item) => {
    acc[item._id] = item.total;
    return acc;
  }, {});
}

function porPosto(linhas: LinhaPosto[]): Record<string, number> {
  return linhas.reduce<Record<string, number>>((acc, item) => {
    acc[`${item._id.ibm}_${item._id.data}`] = item.total;
    return acc;
  }, {});
}

/** Galonagem da rede agrupada por data. */
export async function calcFuelByDates(dates: string[], toEndOfDay = true) {
  const linhas = await agregar<LinhaData>("gasMonitor", COLECAO_ABASTECIMENTOS, [
    { $match: { ori: { $in: ["0", "1"] }, ...filtroDatas(dates, toEndOfDay) } },
    { $group: { _id: dataFormatada, total: { $sum: "$vol" } } },
    { $sort: { _id: 1 } },
  ]);
  return porData(linhas);
}

/** Produto (R$) da rede agrupado por data. */
export async function calcProductByDates(dates: string[], toEndOfDay = true) {
  const linhas = await agregar<LinhaData>("sales", COLECAO_VENDAS, [
    { $unwind: "$items" },
    { $match: { ...filtroDatas(dates, toEndOfDay), "items.iTip": { $eq: "0" } } },
    { $group: { _id: dataFormatada, total: { $sum: { $toDouble: "$items.tot" } } } },
    { $sort: { _id: 1 } },
  ]);
  return porData(linhas);
}

/** Galonagem por posto — chave `IBM_YYYY-MM-DD`. */
export async function getVolumePorPosto(dates: string[], toEndOfDay = true) {
  const linhas = await agregar<LinhaPosto>("gasMonitor", COLECAO_ABASTECIMENTOS, [
    { $match: { ori: { $in: ["0", "1"] }, ...filtroDatas(dates, toEndOfDay) } },
    { $group: { _id: { data: dataFormatada, ibm: "$ibm" }, total: { $sum: "$vol" } } },
    { $sort: { "_id.data": 1, "_id.ibm": 1 } },
  ]);
  return porPosto(linhas);
}

/** Produto (R$) por posto — chave `IBM_YYYY-MM-DD`. */
export async function getItensTotaisPorPosto(dates: string[], toEndOfDay = true) {
  const linhas = await agregar<LinhaPosto>("sales", COLECAO_VENDAS, [
    { $unwind: "$items" },
    { $match: { ...filtroDatas(dates, toEndOfDay), "items.iTip": { $eq: "0" } } },
    {
      $group: {
        _id: { data: dataFormatada, ibm: "$ibm" },
        total: { $sum: { $toDouble: "$items.tot" } },
      },
    },
    { $sort: { "_id.data": 1, "_id.ibm": 1 } },
  ]);
  return porPosto(linhas);
}

/** IBMs distintos presentes nas datas informadas. */
export async function listarPostos(dates: string[]): Promise<string[]> {
  const col = await colecao("gasMonitor", COLECAO_ABASTECIMENTOS);
  const ibms = await col.distinct("ibm", filtroDatas(dates, true) as Document);
  return (ibms as unknown[]).filter((v): v is string => typeof v === "string").sort();
}