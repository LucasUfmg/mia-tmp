/**
 * Cálculo do EBITDA por posto e mês, seguindo a DRE da planilha "BASE DRE".
 * As linhas marcadas com sinal -1 são redutoras: o valor digitado é tratado
 * pelo módulo (com ou sem sinal) e subtraído.
 */

export const linhasEbitda = [
  { chave: "receitaVendas", label: "Receita bruta", sinal: 1 },
  { chave: "deducoes", label: "Descontos e acréscimos", sinal: -1 },
  { chave: "faltaSobra", label: "Falta / sobra", sinal: 1 },
  { chave: "custo", label: "CMV", sinal: -1 },
  { chave: "administrativas", label: "Despesas administrativas", sinal: -1 },
  { chave: "despesasFinanceiras", label: "Despesas financeiras", sinal: -1 },
  { chave: "despesasNaoContabeis", label: "Despesas não contábeis", sinal: -1 },
  { chave: "despesasPessoal", label: "Despesas trabalhistas", sinal: -1 },
  { chave: "despesasTributarias", label: "Despesas tributárias", sinal: -1 },
  { chave: "outrasOperacionais", label: "Outras despesas operacionais", sinal: -1 },
  { chave: "outrasReceitasNaoOperacionais", label: "Outras receitas não operacionais", sinal: 1 },
  { chave: "bonusPerformance", label: "Bônus de performance", sinal: 1 },
  { chave: "rateios", label: "Rateios", sinal: -1 },
  { chave: "bonusContrato", label: "Bônus de contrato", sinal: 1 },
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
  const despesasTotais = Math.abs(s("administrativas")) + Math.abs(s("despesasFinanceiras")) +
    Math.abs(s("despesasNaoContabeis")) + Math.abs(s("despesasPessoal")) +
    Math.abs(s("despesasTributarias")) + Math.abs(s("outrasOperacionais"));
  const ebitda = resultadoBruto - despesasTotais;
  const resultadoFinal = ebitda + s("outrasReceitasNaoOperacionais") + s("bonusPerformance") +
    s("rateios") + s("bonusContrato");
  return { receitaBruta, receitaLiquida, resultadoBruto, despesasTotais, ebitda, ebit: ebitda, resultadoFinal, lucroLiquido: resultadoFinal };
}

/** Onde cada total aparece na sequência de linhas (após a linha indicada). */
export const totaisApos: Partial<
  Record<LinhaEbitdaChave, { label: string; campo: keyof ResultadoEbitda; destaque?: boolean }>
> = {
  faltaSobra: { label: "= Receita líquida ajustada", campo: "receitaLiquida" },
  custo: { label: "= Resultado operacional bruto", campo: "resultadoBruto" },
  outrasOperacionais: { label: "= EBITDA", campo: "ebitda", destaque: true },
  bonusContrato: { label: "= Resultado final", campo: "resultadoFinal", destaque: true },
};
