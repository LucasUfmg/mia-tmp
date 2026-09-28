/**
 * Cálculo do EBITDA por posto e mês, seguindo a DRE da planilha "BASE DRE".
 * As linhas marcadas com sinal -1 são redutoras: o valor digitado é tratado
 * pelo módulo (com ou sem sinal) e subtraído.
 *
 * Cascata dos big numbers: Receita bruta → CMV → Resultado operacional bruto
 * → Despesas totais → EBITDA (Result. Op. Bruto − Despesas totais) → Resultado final.
 */

export const linhasEbitda = [
  { chave: "receitaVendas", label: "Receita bruta", sinal: 1 },
  { chave: "deducoes", label: "Descontos e acréscimos", sinal: -1 },
  { chave: "faltaSobra", label: "Falta / sobra", sinal: 1 },
  { chave: "custo", label: "CMV", sinal: -1 },
  { chave: "despesasPessoal", label: "Pessoal", sinal: -1 },
  { chave: "administrativas", label: "Operação/Administrativas", sinal: -1 },
  { chave: "aluguel", label: "Aluguel", sinal: -1 },
  { chave: "taxasCartao", label: "Taxas de Cartão", sinal: -1 },
  { chave: "frete", label: "Frete", sinal: -1 },
  { chave: "despesasTributarias", label: "Tributárias", sinal: -1 },
  { chave: "outrasOperacionais", label: "Outras despesas operacionais", sinal: -1 },
  { chave: "despesasFinanceiras", label: "Despesas Financeiras", sinal: -1 },
  { chave: "despesasNaoContabeis", label: "Despesas Não Operacionais", sinal: -1 },
  { chave: "outrasReceitasNaoOperacionais", label: "Outras receitas não operacionais", sinal: 1 },
  { chave: "bonusPerformance", label: "Bônus de performance", sinal: 1 },
  { chave: "rateios", label: "Rateios", sinal: -1 },
  { chave: "bonusContrato", label: "Bônus de contrato", sinal: 1 },
  { chave: "irpjCsll", label: "IRPJ e CSLL", sinal: -1 },
] as const;

export type LinhaEbitdaChave = (typeof linhasEbitda)[number]["chave"];

export const linhasEbitdaLegadas = [
  "ajusteEnergy",
  "ajusteTransporte",
  "ajusteGestao",
  "furtosRoubos",
  "apropriacaoContratos",
  "participacoesEmpregados",
  "depreciacao",
] as const;

export type LinhaEbitdaLegadaChave = (typeof linhasEbitdaLegadas)[number];
export type Ebitda = { ibm: string; mes: string } & Record<LinhaEbitdaChave | LinhaEbitdaLegadaChave, number>;

export type ResultadoEbitda = {
  receitaBruta: number;
  receitaLiquida: number;
  resultadoBruto: number;
  despesasTotais: number;
  ebitda: number;
  ebit: number;
  resultadoFinal: number;
  lucroLiquido: number;
};

export type DreConsolidada = Record<LinhaEbitdaChave, number> & ResultadoEbitda;

const sinais = Object.fromEntries(linhasEbitda.map((l) => [l.chave, l.sinal])) as Record<
  LinhaEbitdaChave,
  number
>;

/** Aplica o sinal da linha ao valor digitado (ignora o sinal informado pelo usuário). */
export function comSinal(chave: LinhaEbitdaChave, valor: number): number {
  return sinais[chave] * Math.abs(valor || 0);
}

export function calcularEbitda(v: Record<LinhaEbitdaChave, number>): ResultadoEbitda {
  const s = (chave: LinhaEbitdaChave) => comSinal(chave, v[chave]);
  const receitaBruta = s("receitaVendas");
  const receitaLiquida = receitaBruta + s("deducoes") + s("faltaSobra");
  const resultadoBruto = receitaLiquida + s("custo");
  const a = (chave: LinhaEbitdaChave) => Math.abs(s(chave));
  const operacionais = a("despesasPessoal") + a("administrativas") + a("aluguel") + a("taxasCartao") +
    a("frete") + a("despesasTributarias") + a("outrasOperacionais");
  const despesasTotais = operacionais + a("despesasFinanceiras") + a("despesasNaoContabeis");
  const ebitda = resultadoBruto - despesasTotais;
  const resultadoFinal = ebitda + s("outrasReceitasNaoOperacionais") + s("bonusPerformance") +
    s("rateios") + s("bonusContrato");
  const lucroLiquido = resultadoFinal - a("irpjCsll");
  return { receitaBruta, receitaLiquida, resultadoBruto, despesasTotais, ebitda, ebit: ebitda, resultadoFinal, lucroLiquido };
}

/** Consolida linhas da DRE sem misturar o registro de rede com seus postos. */
export function consolidarEbitda(linhas: Ebitda[], selecao: string[], meses: string[]): DreConsolidada {
  const periodo = new Set(meses);
  const noPeriodo = linhas.filter((linha) => periodo.has(linha.mes));
  const filtradas = selecao.length > 0
    ? noPeriodo.filter((linha) => linha.ibm !== "REDE" && selecao.includes(linha.ibm))
    : noPeriodo.some((linha) => linha.ibm === "REDE")
      ? noPeriodo.filter((linha) => linha.ibm === "REDE")
      : noPeriodo.filter((linha) => linha.ibm !== "REDE");
  const somas = Object.fromEntries(
    linhasEbitda.map((linha) => [linha.chave, filtradas.reduce((total, item) => total + (item[linha.chave] || 0), 0)]),
  ) as Record<LinhaEbitdaChave, number>;
  return { ...somas, ...calcularEbitda(somas) };
}

/** Onde cada total aparece na sequência de linhas (após a linha indicada). */
export const totaisApos: Partial<
  Record<LinhaEbitdaChave, { label: string; campo: keyof ResultadoEbitda; destaque?: boolean }>
> = {
  faltaSobra: { label: "= Receita líquida ajustada", campo: "receitaLiquida" },
  custo: { label: "= Resultado operacional bruto", campo: "resultadoBruto" },
  outrasOperacionais: { label: "Subtotal antes de Financeiras e Não operacionais", campo: "resultadoAntesFin", destaque: true },
  despesasNaoContabeis: { label: "= EBITDA", campo: "ebitda", destaque: true },
  bonusContrato: { label: "= Resultado final", campo: "resultadoFinal", destaque: true },
  irpjCsll: { label: "= Lucro líquido", campo: "lucroLiquido", destaque: true },
};
