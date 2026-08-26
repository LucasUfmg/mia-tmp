/**
 * Indicadores financeiros contábeis (ROE, ROIC, Margem Líquida, Margem EBITDA).
 * Os dados não existem no banco dos postos: são lançados manualmente por posto e mês.
 */

export type Lancamento = {
  id?: string;
  ibm: string;
  /** Primeiro dia do mês, formato "YYYY-MM-01". */
  mes: string;
  receitaLiquida: number;
  lucroLiquido: number;
  ebitda: number;
  ebit: number;
  /** Alíquota efetiva de impostos em % (ex.: 34). */
  aliquotaEfetiva: number;
  plInicial: number;
  plFinal: number;
  dividaFinanceira: number;
  caixa: number;
  /** WACC em % (ex.: 12). */
  wacc: number;
};

export type Consolidado = {
  receitaLiquida: number;
  lucroLiquido: number;
  ebitda: number;
  ebit: number;
  /** Média ponderada pela receita, em %. */
  aliquotaEfetiva: number;
  plInicial: number;
  plFinal: number;
  dividaFinanceira: number;
  caixa: number;
  /** Média ponderada pela receita, em %. */
  wacc: number;
  plMedio: number;
  capitalInvestido: number;
  nopat: number;
  /** Em %; null quando o denominador é zero. */
  roe: number | null;
  roic: number | null;
  margemLiquida: number | null;
  margemEbitda: number | null;
  /** Postos com lançamento no escopo. */
  postos: string[];
};

export const campos = [
  { chave: "receitaLiquida", label: "Receita líquida", tipo: "moeda" },
  { chave: "lucroLiquido", label: "Lucro líquido", tipo: "moeda" },
  { chave: "ebitda", label: "EBITDA", tipo: "moeda" },
  { chave: "ebit", label: "EBIT", tipo: "moeda" },
  { chave: "aliquotaEfetiva", label: "Alíquota efetiva de impostos (%)", tipo: "pct" },
  { chave: "plInicial", label: "Patrimônio líquido inicial", tipo: "moeda" },
  { chave: "plFinal", label: "Patrimônio líquido final", tipo: "moeda" },
  { chave: "dividaFinanceira", label: "Dívida financeira", tipo: "moeda" },
  { chave: "caixa", label: "Caixa e equivalentes", tipo: "moeda" },
  { chave: "wacc", label: "WACC (%)", tipo: "pct" },
] as const;

export type CampoChave = (typeof campos)[number]["chave"];

/** "2026-08-01" → "2026". */
export function anoDoMes(mes: string): string {
  return mes.slice(0, 4);
}

/** Mês corrente (fuso de São Paulo) no formato "YYYY-MM-01". */
export function mesReferencia(): string {
  const [ano, mes] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  })
    .format(new Date())
    .split("-");
  return `${ano}-${mes}-01`;
}

/** "2026-08-01" → "ago/2026". */
export function rotuloMes(mes: string): string {
  const nomes = [
    "jan",
    "fev",
    "mar",
    "abr",
    "mai",
    "jun",
    "jul",
    "ago",
    "set",
    "out",
    "nov",
    "dez",
  ];
  const [ano, m] = mes.split("-");
  return `${nomes[Number(m) - 1] ?? m}/${ano}`;
}

/** Os 12 meses de um ano, do mais antigo ao mais recente. */
export function mesesDoAno(ano: string): string[] {
  return Array.from({ length: 12 }, (_, i) => `${ano}-${String(i + 1).padStart(2, "0")}-01`);
}

function ponderada(linhas: Lancamento[], campo: "aliquotaEfetiva" | "wacc"): number {
  const peso = linhas.reduce((s, l) => s + Math.abs(l.receitaLiquida), 0);
  if (peso > 0) {
    return linhas.reduce((s, l) => s + l[campo] * Math.abs(l.receitaLiquida), 0) / peso;
  }
  const validos = linhas.filter((l) => l[campo] !== 0);
  if (validos.length === 0) return 0;
  return validos.reduce((s, l) => s + l[campo], 0) / validos.length;
}

function razao(numerador: number, denominador: number): number | null {
  if (!denominador) return null;
  return (numerador / denominador) * 100;
}

/**
 * Consolida os lançamentos de um escopo (postos selecionados × meses) e calcula os índices.
 * Fluxos (receita, lucro, EBITDA, EBIT) são somados; para o PL médio usa-se o PL inicial do
 * primeiro mês e o PL final do último de cada posto (permite acumulado do ano).
 */
export function consolidar(linhas: Lancamento[]): Consolidado {
  const soma = (campo: CampoChave) => linhas.reduce((s, l) => s + (l[campo] || 0), 0);

  // Por posto: PL inicial do mês mais antigo, e saldos finais do mês mais recente.
  const porPosto = new Map<string, Lancamento[]>();
  for (const l of linhas) {
    const atual = porPosto.get(l.ibm) ?? [];
    atual.push(l);
    porPosto.set(l.ibm, atual);
  }

  let plInicial = 0;
  let plFinal = 0;
  let dividaFinanceira = 0;
  let caixa = 0;
  for (const lista of porPosto.values()) {
    const ordenada = [...lista].sort((a, b) => a.mes.localeCompare(b.mes));
    const primeiro = ordenada[0]!;
    const ultimo = ordenada[ordenada.length - 1]!;
    plInicial += primeiro.plInicial;
    plFinal += ultimo.plFinal;
    dividaFinanceira += ultimo.dividaFinanceira;
    caixa += ultimo.caixa;
  }

  const receitaLiquida = soma("receitaLiquida");
  const lucroLiquido = soma("lucroLiquido");
  const ebitda = soma("ebitda");
  const ebit = soma("ebit");
  const aliquotaEfetiva = ponderada(linhas, "aliquotaEfetiva");
  const wacc = ponderada(linhas, "wacc");

  const plMedio = (plInicial + plFinal) / 2;
  const capitalInvestido = plMedio + dividaFinanceira - caixa;
  const nopat = ebit * (1 - aliquotaEfetiva / 100);

  return {
    receitaLiquida,
    lucroLiquido,
    ebitda,
    ebit,
    aliquotaEfetiva,
    plInicial,
    plFinal,
    dividaFinanceira,
    caixa,
    wacc,
    plMedio,
    capitalInvestido,
    nopat,
    roe: razao(lucroLiquido, plMedio),
    roic: razao(nopat, capitalInvestido),
    margemLiquida: razao(lucroLiquido, receitaLiquida),
    margemEbitda: razao(ebitda, receitaLiquida),
    postos: [...porPosto.keys()].sort(),
  };
}

/** IBM reservado para o lançamento consolidado da rede inteira. */
export const IBM_REDE = "REDE";

/**
 * Filtra os lançamentos pelo escopo do painel (postos selecionados; vazio = rede).
 * O lançamento da rede só vale no escopo "rede" e, quando existe no período,
 * substitui a soma dos postos (evita dupla contagem).
 */
export function filtrarEscopo(
  linhas: Lancamento[],
  selecao: string[],
  meses: string[],
): Lancamento[] {
  const postos = new Set(selecao);
  const alvo = new Set(meses);
  const noPeriodo = linhas.filter((l) => alvo.has(l.mes));
  if (postos.size > 0) {
    return noPeriodo.filter((l) => l.ibm !== IBM_REDE && postos.has(l.ibm));
  }
  const rede = noPeriodo.filter((l) => l.ibm === IBM_REDE);
  return rede.length > 0 ? rede : noPeriodo;
}

