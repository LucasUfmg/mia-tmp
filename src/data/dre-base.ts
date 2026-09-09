import type { LinhaEbitdaChave } from "@/lib/ebitda";

/**
 * Valores da primeira aba ("BASE DRE") da planilha de indicadores, usados como
 * preenchimento inicial do cálculo de EBITDA.
 * - Por posto: coluna MÉDIA MENSAL.
 * - Rede consolidada: coluna TOTAL GERAL (acumulado).
 * Valores em módulo — o sinal de cada linha é aplicado por `comSinal`.
 * Receita de vendas e custo NÃO entram aqui: vêm do painel em tempo real.
 */
export type BaseDreChave = Exclude<LinhaEbitdaChave, "receitaVendas" | "custo">;

type BaseDre = Record<BaseDreChave, number>;

const baseDre: Record<string, BaseDre> = {
  "POSTO AEROPORTO": { deducoes: 2736.14, ajusteEnergy: 0.0, ajusteTransporte: 7571.77, ajusteGestao: 0.0, despesasPessoal: 38625.39, administrativas: 117272.41, despesasTributarias: 3030.23, furtosRoubos: 0.0, apropriacaoContratos: 18064.23, participacoesEmpregados: 0.0, depreciacao: 93.91 },
  "POSTO ALELUIA": { deducoes: 2189.26, ajusteEnergy: 0.0, ajusteTransporte: 10934.96, ajusteGestao: 0.0, despesasPessoal: 66375.19, administrativas: 107151.07, despesasTributarias: 1420.45, furtosRoubos: 0.0, apropriacaoContratos: 20803.79, participacoesEmpregados: 0.0, depreciacao: 864.1 },
  "POSTO BURITIS": { deducoes: 3827.65, ajusteEnergy: 0.0, ajusteTransporte: 9370.59, ajusteGestao: 0.0, despesasPessoal: 76577.51, administrativas: 157213.25, despesasTributarias: 7493.71, furtosRoubos: 0.0, apropriacaoContratos: 22451.47, participacoesEmpregados: 0.0, depreciacao: 107.06 },
  "POSTO CCA": { deducoes: 10961.8, ajusteEnergy: 0.0, ajusteTransporte: 6912.9, ajusteGestao: 0.0, despesasPessoal: 45885.96, administrativas: 109872.09, despesasTributarias: 3008.08, furtosRoubos: 0.0, apropriacaoContratos: 19110.03, participacoesEmpregados: 0.0, depreciacao: 4428.45 },
  "POSTO CELT": { deducoes: 40683.75, ajusteEnergy: 0.0, ajusteTransporte: 11711.15, ajusteGestao: 0.0, despesasPessoal: 88998.82, administrativas: 134732.79, despesasTributarias: 4397.27, furtosRoubos: 0.0, apropriacaoContratos: 33961.42, participacoesEmpregados: 0.0, depreciacao: 0.0 },
  "POSTO CENTER NORTE": { deducoes: 3675.32, ajusteEnergy: 0.0, ajusteTransporte: 10060.88, ajusteGestao: 0.0, despesasPessoal: 100383.26, administrativas: 57379.67, despesasTributarias: 2368.3, furtosRoubos: 0.0, apropriacaoContratos: 20408.91, participacoesEmpregados: 0.0, depreciacao: 409.39 },
  "CENTER POSTO": { deducoes: 2109.95, ajusteEnergy: 0.0, ajusteTransporte: 10535.82, ajusteGestao: 0.0, despesasPessoal: 74987.84, administrativas: 120559.68, despesasTributarias: 1363.6, furtosRoubos: 0.0, apropriacaoContratos: 20408.91, participacoesEmpregados: 0.0, depreciacao: 2181.51 },
  "POSTO FORMULA": { deducoes: 2481.06, ajusteEnergy: 0.0, ajusteTransporte: 9208.49, ajusteGestao: 0.0, despesasPessoal: 54170.93, administrativas: 54575.99, despesasTributarias: 1620.47, furtosRoubos: 0.0, apropriacaoContratos: 20964.79, participacoesEmpregados: 0.0, depreciacao: 277.84 },
  "POSTO JUPITER": { deducoes: 6516.44, ajusteEnergy: 0.0, ajusteTransporte: 19471.17, ajusteGestao: 0.0, despesasPessoal: 125519.92, administrativas: 145376.04, despesasTributarias: 5309.14, furtosRoubos: 0.0, apropriacaoContratos: 49252.02, participacoesEmpregados: 0.0, depreciacao: 4854.1 },
  "POSTO LESTE": { deducoes: 4617.95, ajusteEnergy: 0.0, ajusteTransporte: 11834.56, ajusteGestao: 0.0, despesasPessoal: 72125.89, administrativas: 94003.13, despesasTributarias: 5058.37, furtosRoubos: 0.0, apropriacaoContratos: 29772.43, participacoesEmpregados: 0.0, depreciacao: 2948.18 },
  "POSTO MAQUINE": { deducoes: 5207.7, ajusteEnergy: 0.0, ajusteTransporte: 0.0, ajusteGestao: 7813.99, despesasPessoal: 114643.24, administrativas: 86274.04, despesasTributarias: 3661.91, furtosRoubos: 0.0, apropriacaoContratos: 49375.69, participacoesEmpregados: 0.0, depreciacao: 1924.11 },
  "POSTO MAURITANIA": { deducoes: 1729.35, ajusteEnergy: 0.0, ajusteTransporte: 1140.64, ajusteGestao: 0.0, despesasPessoal: 42755.49, administrativas: 31912.99, despesasTributarias: 3110.2, furtosRoubos: 0.0, apropriacaoContratos: 5917.14, participacoesEmpregados: 0.0, depreciacao: 427.66 },
  "POSTO MINAS SHOPPING": { deducoes: 9511.65, ajusteEnergy: 0.0, ajusteTransporte: 7414.9, ajusteGestao: 0.0, despesasPessoal: 55830.47, administrativas: 60174.81, despesasTributarias: 2879.5, furtosRoubos: 0.0, apropriacaoContratos: 19305.48, participacoesEmpregados: 0.0, depreciacao: 190.46 },
  "POSTO MM": { deducoes: 2684.21, ajusteEnergy: 0.0, ajusteTransporte: 4256.51, ajusteGestao: 0.0, despesasPessoal: 43899.79, administrativas: 43295.57, despesasTributarias: 3702.65, furtosRoubos: 0.0, apropriacaoContratos: 10173.35, participacoesEmpregados: 0.0, depreciacao: 222.42 },
  "POSTO MUSTANG": { deducoes: 3545.86, ajusteEnergy: 0.0, ajusteTransporte: 7393.98, ajusteGestao: 0.0, despesasPessoal: 41960.63, administrativas: 129488.49, despesasTributarias: 4172.57, furtosRoubos: 0.0, apropriacaoContratos: 17717.43, participacoesEmpregados: 0.0, depreciacao: 70.64 },
  "POSTO PANAMERA": { deducoes: 2728.16, ajusteEnergy: 0.0, ajusteTransporte: 0.0, ajusteGestao: 7813.99, despesasPessoal: 55242.91, administrativas: 41316.61, despesasTributarias: 2605.74, furtosRoubos: 0.0, apropriacaoContratos: 24047.79, participacoesEmpregados: 0.0, depreciacao: 1698.8 },
  "POSTO PARQUE JARDIM": { deducoes: 389.33, ajusteEnergy: 0.0, ajusteTransporte: 3928.44, ajusteGestao: 0.0, despesasPessoal: 23549.48, administrativas: 30097.76, despesasTributarias: 427.08, furtosRoubos: 0.0, apropriacaoContratos: 7347.84, participacoesEmpregados: 0.0, depreciacao: 1125.5 },
  "POSTO POETA": { deducoes: 4395.71, ajusteEnergy: 0.0, ajusteTransporte: 8087.33, ajusteGestao: 0.0, despesasPessoal: 73595.27, administrativas: 71095.72, despesasTributarias: 5772.77, furtosRoubos: 0.0, apropriacaoContratos: 19380.1, participacoesEmpregados: 0.0, depreciacao: 158.46 },
  "POSTO ROL": { deducoes: 5812.48, ajusteEnergy: 0.0, ajusteTransporte: 15206.3, ajusteGestao: 0.0, despesasPessoal: 100916.6, administrativas: 107907.75, despesasTributarias: 6597.44, furtosRoubos: 0.0, apropriacaoContratos: 37036.75, participacoesEmpregados: 0.0, depreciacao: 954.84 },
  "POSTO SETE BELO": { deducoes: 19594.13, ajusteEnergy: 0.0, ajusteTransporte: 14787.97, ajusteGestao: 0.0, despesasPessoal: 120674.39, administrativas: 136478.36, despesasTributarias: 3709.44, furtosRoubos: 0.0, apropriacaoContratos: 38975.89, participacoesEmpregados: 0.0, depreciacao: 174.68 },
  "POSTO SIGMA": { deducoes: 3272.46, ajusteEnergy: 0.0, ajusteTransporte: 6306.32, ajusteGestao: 0.0, despesasPessoal: 53583.89, administrativas: 77740.0, despesasTributarias: 3093.04, furtosRoubos: 0.0, apropriacaoContratos: 15186.93, participacoesEmpregados: 0.0, depreciacao: 2069.02 },
  "POSTO STO AGOSTINHO": { deducoes: 34475.04, ajusteEnergy: 0.0, ajusteTransporte: 2406.44, ajusteGestao: 0.0, despesasPessoal: 42376.53, administrativas: 75465.04, despesasTributarias: 1882.03, furtosRoubos: 0.0, apropriacaoContratos: 16252.11, participacoesEmpregados: 0.0, depreciacao: 4301.3 },
  "POSTO TATIANA": { deducoes: 16144.16, ajusteEnergy: 0.0, ajusteTransporte: 13865.55, ajusteGestao: 0.0, despesasPessoal: 93957.72, administrativas: 112237.49, despesasTributarias: 8413.36, furtosRoubos: 0.0, apropriacaoContratos: 36378.49, participacoesEmpregados: 0.0, depreciacao: 1309.76 },
  "POSTO TROVÃO": { deducoes: 2122.76, ajusteEnergy: 0.0, ajusteTransporte: 11792.72, ajusteGestao: 0.0, despesasPessoal: 71163.93, administrativas: 146617.19, despesasTributarias: 4762.79, furtosRoubos: 0.0, apropriacaoContratos: 28674.62, participacoesEmpregados: 0.0, depreciacao: 636.12 },
  "POSTO VENETO": { deducoes: 2581.57, ajusteEnergy: 0.0, ajusteTransporte: 10836.84, ajusteGestao: 0.0, despesasPessoal: 71876.79, administrativas: 80700.07, despesasTributarias: 2619.85, furtosRoubos: 0.0, apropriacaoContratos: 26429.61, participacoesEmpregados: 0.0, depreciacao: 944.23 },
  "POSTO VILA CHALÉ": { deducoes: 1683.11, ajusteEnergy: 0.0, ajusteTransporte: 0.0, ajusteGestao: 7813.99, despesasPessoal: 40253.89, administrativas: 35773.96, despesasTributarias: 921.74, furtosRoubos: 0.0, apropriacaoContratos: 19883.91, participacoesEmpregados: 0.0, depreciacao: 997.27 },
  "POSTO VILA DA SERRA": { deducoes: 3548.41, ajusteEnergy: 0.0, ajusteTransporte: 6236.6, ajusteGestao: 0.0, despesasPessoal: 49271.37, administrativas: 78630.4, despesasTributarias: 2601.26, furtosRoubos: 0.0, apropriacaoContratos: 15125.99, participacoesEmpregados: 0.0, depreciacao: 236.72 },
};

/** Coluna TOTAL GERAL da planilha — usada na visão "Rede (consolidado)". */
const baseDreRede: BaseDre = {
  deducoes: 2390704.81,
  ajusteEnergy: 0.0,
  ajusteTransporte: 2655273.94,
  ajusteGestao: 281303.64,
  despesasPessoal: 22070437.44,
  administrativas: 29320108.47,
  despesasTributarias: 1152035.92,
  furtosRoubos: 0.0,
  apropriacaoContratos: 7708885.34,
  participacoesEmpregados: 0.0,
  depreciacao: 403278.19,
};

/** Palavras genéricas de razão social que não identificam o posto. */
const generico = new Set([
  "POSTO",
  "POSTOS",
  "AUTO",
  "LTDA",
  "ME",
  "MEI",
  "EPP",
  "SA",
  "EIRELI",
  "COMERCIO",
  "COMERCIAL",
  "COM",
  "DISTRIBUIDORA",
  "DISTRIBUIDOR",
  "PRODUTOS",
  "DERIVADOS",
  "PETROLEO",
  "LUBRIFICANTES",
  "AUTOMOTIVOS",
  "COMBUSTIVEIS",
  "COMBUSTIVEL",
  "EMPREENDIMENTO",
  "EMPREENDIMENTOS",
  "SERVICOS",
  "GNV",
  "FILIAL",
  "DE",
  "DA",
  "DO",
  "DAS",
  "DOS",
  "E",
]);

/** Sinônimos de tokens entre a planilha e o cadastro do painel. */
const sinonimo: Record<string, string> = { STO: "SANTO", STA: "SANTA", FORMULA: "FORMULA", BR: "" };

/** Reduz um nome ao conjunto de palavras que identificam o posto. */
function chave(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .split(/\s+/)
    .map((t) => (t in sinonimo ? sinonimo[t]! : t))
    .filter((t) => t && !generico.has(t))
    .sort()
    .join(" ");
}

const porChave = new Map<string, BaseDre>();
for (const [nome, valores] of Object.entries(baseDre)) {
  const k = chave(nome);
  if (k && !porChave.has(k)) porChave.set(k, valores);
}

/** Valores iniciais da planilha para o posto, ou undefined quando não há. */
export function baseDrePorPosto(nome: string | undefined): BaseDre | undefined {
  if (!nome) return undefined;
  return porChave.get(chave(nome));
}

/** Valores iniciais da planilha para a rede consolidada. */
export function baseDreRedeConsolidada(): BaseDre {
  return baseDreRede;
}
