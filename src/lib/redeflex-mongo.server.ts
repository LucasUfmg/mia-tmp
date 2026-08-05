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
const COLECAO_LOJAS = ["Lojas", "lojas"];
const COLECAO_COMBUSTIVEIS = ["Combustiveis", "combustiveis"];
const COLECAO_GRUPOS = ["Produtos_Grupos", "produtos_grupos"];

/** Alguns documentos gravam números como string — normaliza para double. */
function num(campo: string) {
  return { $convert: { input: campo, to: "double", onError: 0, onNull: 0 } };
}

/**
 * Minutos decorridos do dia "agora" — no relógio usado pelo banco (São Paulo,
 * gravado como UTC com deslocamento de 3h).
 */
export function cutoffMinutesAgora(): number {
  const agora = new Date(Date.now() - 3 * 60 * 60 * 1000);
  return agora.getUTCHours() * 60 + agora.getUTCMinutes();
}

/**
 * `cutoffMinutes` recorta TODOS os dias no mesmo horário (comparativo on-time).
 * `toEndOfDay` mantém o dia fechado, limitado ao instante atual.
 */
function limites(data: string, toEndOfDay: boolean, cutoffMinutes?: number) {
  const start = new Date(`${data}T00:00:00.000Z`);
  const agora = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const fimDoDia = new Date(`${data}T23:59:59.999Z`);
  if (cutoffMinutes !== undefined) {
    const corte = new Date(start.getTime() + cutoffMinutes * 60 * 1000 + 59_999);
    const end = corte < agora ? corte : agora < fimDoDia ? agora : fimDoDia;
    return { $gte: start, $lte: end };
  }
  const end = toEndOfDay ? (agora < fimDoDia ? agora : fimDoDia) : agora < fimDoDia ? agora : fimDoDia;
  return { $gte: start, $lte: end };
}

function filtroDatas(dates: string[], toEndOfDay: boolean, cutoffMinutes?: number) {
  return { $or: dates.map((data) => ({ dtHr: limites(data, toEndOfDay, cutoffMinutes) })) };
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
export async function calcFuelByDates(dates: string[], toEndOfDay = true, cutoffMinutes?: number) {
  const linhas = await agregar<LinhaData>("gasMonitor", COLECAO_ABASTECIMENTOS, [
    { $match: { ori: { $in: ["0", "1"] }, ...filtroDatas(dates, toEndOfDay, cutoffMinutes) } },
    { $group: { _id: dataFormatada, total: { $sum: "$vol" } } },
    { $sort: { _id: 1 } },
  ]);
  return porData(linhas);
}

/** Produto (R$) da rede agrupado por data. */
export async function calcProductByDates(dates: string[], toEndOfDay = true, cutoffMinutes?: number) {
  const linhas = await agregar<LinhaData>("sales", COLECAO_VENDAS, [
    { $unwind: "$items" },
    { $match: { ...filtroDatas(dates, toEndOfDay, cutoffMinutes), "items.iTip": { $eq: "0" } } },
    { $group: { _id: dataFormatada, total: { $sum: { $toDouble: "$items.tot" } } } },
    { $sort: { _id: 1 } },
  ]);
  return porData(linhas);
}

/** Galonagem por posto — chave `IBM_YYYY-MM-DD`. */
export async function getVolumePorPosto(dates: string[], toEndOfDay = true, cutoffMinutes?: number) {
  const linhas = await agregar<LinhaPosto>("gasMonitor", COLECAO_ABASTECIMENTOS, [
    { $match: { ori: { $in: ["0", "1"] }, ...filtroDatas(dates, toEndOfDay, cutoffMinutes) } },
    { $group: { _id: { data: dataFormatada, ibm: "$ibm" }, total: { $sum: "$vol" } } },
    { $sort: { "_id.data": 1, "_id.ibm": 1 } },
  ]);
  return porPosto(linhas);
}

/** Produto (R$) por posto — chave `IBM_YYYY-MM-DD`. */
export async function getItensTotaisPorPosto(
  dates: string[],
  toEndOfDay = true,
  cutoffMinutes?: number,
) {
  const linhas = await agregar<LinhaPosto>("sales", COLECAO_VENDAS, [
    { $unwind: "$items" },
    { $match: { ...filtroDatas(dates, toEndOfDay, cutoffMinutes), "items.iTip": { $eq: "0" } } },
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

/** Cadastro de lojas: IBM → nome fantasia (banco LBCBi). */
export async function listarLojas(): Promise<{ ibm: string; nome: string }[]> {
  const col = await colecao("lbc", COLECAO_LOJAS);
  const docs = await col
    .find({}, { projection: { ibm: 1, nomeFantasia: 1, razaoSocial: 1 } })
    .toArray();
  const mapa = new Map<string, string>();
  for (const doc of docs as unknown as Record<string, unknown>[]) {
    const ibm = typeof doc["ibm"] === "string" ? doc["ibm"] : null;
    if (!ibm) continue;
    const nome =
      (typeof doc["nomeFantasia"] === "string" && doc["nomeFantasia"].trim()) ||
      (typeof doc["razaoSocial"] === "string" && doc["razaoSocial"].trim()) ||
      ibm;
    if (!mapa.has(ibm)) mapa.set(ibm, nome);
  }
  return [...mapa.entries()]
    .map(([ibm, nome]) => ({ ibm, nome }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

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
  produto: {
    receita: number;
    lucroBruto: number;
    cupons: number;
    tmp: number;
    lb: number;
  };
};

function div(a: number, b: number): number {
  return b > 0 ? a / b : 0;
}

/**
 * Índices calculados da base: M/LT, TMV, TMC (combustível) e TMP (produto),
 * mais o lucro bruto percentual de cada frente.
 */
export async function getIndicadores(
  dates: string[],
  ibm?: string,
  cutoffMinutes?: number,
): Promise<Indicadores> {
  const filtroIbm = ibm ? { ibm } : {};

  const [comb] = await agregar<{
    litros: number;
    receita: number;
    custo: number;
    atendimentos: number;
  }>("gasMonitor", COLECAO_ABASTECIMENTOS, [
    {
      $match: {
        ori: { $in: ["0", "1"] },
        ...filtroIbm,
        ...filtroDatas(dates, true, cutoffMinutes),
      },
    },
    {
      $group: {
        _id: null,
        litros: { $sum: num("$vol") },
        receita: { $sum: num("$val") },
        custo: { $sum: { $multiply: [num("$cus"), num("$vol")] } },
        atendimentos: { $sum: 1 },
      },
    },
  ]);

  const [prod] = await agregar<{ receita: number; custo: number; cupons: number }>(
    "sales",
    COLECAO_VENDAS,
    [
      { $match: { ...filtroIbm, ...filtroDatas(dates, true, cutoffMinutes) } },
      { $unwind: "$items" },
      { $match: { "items.iTip": { $eq: "0" } } },
      {
        $group: {
          _id: "$_id",
          receita: { $sum: num("$items.tot") },
          custo: { $sum: { $multiply: [num("$items.pC"), num("$items.qd")] } },
        },
      },
      {
        $group: {
          _id: null,
          receita: { $sum: "$receita" },
          custo: { $sum: "$custo" },
          cupons: { $sum: 1 },
        },
      },
    ],
  );

  const litros = comb?.litros ?? 0;
  const receitaComb = comb?.receita ?? 0;
  const lbComb = receitaComb - (comb?.custo ?? 0);
  const atendimentos = comb?.atendimentos ?? 0;

  const receitaProd = prod?.receita ?? 0;
  const lbProd = receitaProd - (prod?.custo ?? 0);
  const cupons = prod?.cupons ?? 0;

  return {
    combustivel: {
      litros,
      receita: receitaComb,
      lucroBruto: lbComb,
      atendimentos,
      mlt: div(lbComb, litros),
      tmv: div(litros, atendimentos),
      tmc: div(receitaComb, atendimentos),
      lb: div(lbComb, receitaComb) * 100,
    },
    produto: {
      receita: receitaProd,
      lucroBruto: lbProd,
      cupons,
      tmp: div(receitaProd, cupons),
      lb: div(lbProd, receitaProd) * 100,
    },
  };
}

export type CategoriaIndicador = {
  nome: string;
  receita: number;
  lucroBruto: number;
  lb: number;
  /** M/LT para combustíveis, TMP para produtos. */
  indice: number;
};

/** Distribuição por combustível (sigla → descrição do cadastro). */
export async function getCategoriasCombustivel(
  dates: string[],
  ibm?: string,
  cutoffMinutes?: number,
): Promise<CategoriaIndicador[]> {
  const linhas = await agregar<{
    _id: string | null;
    litros: number;
    receita: number;
    custo: number;
  }>("gasMonitor", COLECAO_ABASTECIMENTOS, [
    {
      $match: {
        ori: { $in: ["0", "1"] },
        ...(ibm ? { ibm } : {}),
        ...filtroDatas(dates, true, cutoffMinutes),
      },
    },
    {
      $group: {
        _id: "$sig",
        litros: { $sum: num("$vol") },
        receita: { $sum: num("$val") },
        custo: { $sum: { $multiply: [num("$cus"), num("$vol")] } },
      },
    },
  ]);

  const cadastro = await colecao("lbc", COLECAO_COMBUSTIVEIS);
  const docs = (await cadastro
    .find({}, { projection: { sig: 1, des: 1 } })
    .toArray()) as unknown as Record<string, unknown>[];
  const nomePorSig = new Map<string, string>();
  for (const doc of docs) {
    const sig = typeof doc["sig"] === "string" ? doc["sig"] : null;
    const des = typeof doc["des"] === "string" ? doc["des"] : null;
    if (sig && des && !nomePorSig.has(sig)) nomePorSig.set(sig, des);
  }

  return consolidar(
    linhas.map((l) => ({
      nome: nomePorSig.get(l._id ?? "") ?? l._id ?? "OUTROS",
      receita: l.receita,
      lucroBruto: l.receita - l.custo,
      base: l.litros,
    })),
  );
}

/** Distribuição por grupo de produto (codG do item + ibm → descrição). */
export async function getCategoriasProduto(
  dates: string[],
  ibm?: string,
  cutoffMinutes?: number,
): Promise<CategoriaIndicador[]> {
  const linhas = await agregar<{
    _id: { ibm: string | null; grupo: string | null };
    receita: number;
    custo: number;
    cupons: number;
  }>("sales", COLECAO_VENDAS, [
    { $match: { ...(ibm ? { ibm } : {}), ...filtroDatas(dates, true, cutoffMinutes) } },
    { $unwind: "$items" },
    { $match: { "items.iTip": { $eq: "0" } } },
    {
      $group: {
        _id: { ibm: "$ibm", grupo: "$items.codG", venda: "$_id" },
        receita: { $sum: num("$items.tot") },
        custo: { $sum: { $multiply: [num("$items.pC"), num("$items.qd")] } },
      },
    },
    {
      $group: {
        _id: { ibm: "$_id.ibm", grupo: "$_id.grupo" },
        receita: { $sum: "$receita" },
        custo: { $sum: "$custo" },
        cupons: { $sum: 1 },
      },
    },
  ]);

  const cadastro = await colecao("lbc", COLECAO_GRUPOS);
  const docs = (await cadastro
    .find({}, { projection: { ibm: 1, id: 1, des: 1 } })
    .toArray()) as unknown as Record<string, unknown>[];
  const nomePorChave = new Map<string, string>();
  for (const doc of docs) {
    const chave = `${String(doc["ibm"] ?? "")}_${String(doc["id"] ?? "")}`;
    const des = typeof doc["des"] === "string" ? doc["des"] : null;
    if (des && !nomePorChave.has(chave)) nomePorChave.set(chave, des);
  }

  return consolidar(
    linhas.map((l) => ({
      nome: nomePorChave.get(`${l._id.ibm ?? ""}_${l._id.grupo ?? ""}`) ?? "OUTROS",
      receita: l.receita,
      lucroBruto: l.receita - l.custo,
      base: l.cupons,
    })),
  );
}

/** Agrupa por nome, descarta valores negativos/nulos e mantém as 6 maiores. */
function consolidar(
  itens: { nome: string; receita: number; lucroBruto: number; base: number }[],
): CategoriaIndicador[] {
  const mapa = new Map<string, { receita: number; lucroBruto: number; base: number }>();
  for (const item of itens) {
    const atual = mapa.get(item.nome) ?? { receita: 0, lucroBruto: 0, base: 0 };
    atual.receita += item.receita;
    atual.lucroBruto += item.lucroBruto;
    atual.base += item.base;
    mapa.set(item.nome, atual);
  }

  const todas = [...mapa.entries()]
    .map(([nome, v]) => ({
      nome,
      receita: v.receita,
      lucroBruto: v.lucroBruto,
      lb: div(v.lucroBruto, v.receita) * 100,
      indice: div(v.lucroBruto, v.base),
    }))
    .filter((c) => c.receita > 0)
    .sort((a, b) => b.receita - a.receita);

  const principais = todas.slice(0, 6);
  const resto = todas.slice(6);
  if (resto.length > 0) {
    const receita = resto.reduce((s, c) => s + c.receita, 0);
    const lucroBruto = resto.reduce((s, c) => s + c.lucroBruto, 0);
    principais.push({
      nome: "OUTROS",
      receita,
      lucroBruto,
      lb: div(lucroBruto, receita) * 100,
      indice: 0,
    });
  }
  return principais;
}