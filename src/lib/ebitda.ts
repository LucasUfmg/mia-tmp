/**
 * Cálculo do EBITDA por posto e mês, seguindo a DRE da planilha "BASE DRE".
 * As linhas marcadas com sinal -1 são redutoras: o valor digitado é tratado
 * pelo módulo (com ou sem sinal) e subtraído.
 */

export const linhasEbitda = [
  { chave: "receitaVendas", label: "(+) Receita de vendas", sinal: 1 },
  { chave: "deducoes", label: "(-) Deduções da receita bruta", sinal: -1 },
  { chave: "ajusteEnergy", label: "Ajuste Energy", sinal: 1 },
  { chave: "custo", label: "(-) Custo", sinal: -1 },
  { chave: "ajusteTransporte", label: "Ajuste transporte", sinal: 1 },
  { chave: "ajusteGestao", label: "Ajuste gestão", sinal: 1 },
  { chave: "despesasPessoal", label: "(-) Despesas com pessoal", sinal: -1 },
  { chave: "administrativas", label: "(-) Administrativas", sinal: -1 },
  { chave: "despesasTributarias", label: "(-) Despesas tributárias", sinal: -1 },
  { chave: "furtosRoubos", label: "(-) Furtos e roubos", sinal: -1 },
  { chave: "apropriacaoContratos", label: "(+) Apropriação de contratos", sinal: 1 },
  { chave: "participacoesEmpregados", label: "(-) Participações de empregados", sinal: -1 },
  { chave: "depreciacao", label: "(-) Depreciação/amortização", sinal: -1 },
] as const;

export type LinhaEbitdaChave = (typeof linhasEbitda)[number]["chave"];

export type Ebitda = { ibm: string; mes: string } & Record<LinhaEbitdaChave, number>;

export type ResultadoEbitda = {
  receitaLiquida: number;
  resultadoBruto: number;
  ebitda: number;
  ebit: number;
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

  const receitaLiquida = s("receitaVendas") + s("deducoes") + s("ajusteEnergy");
  const resultadoBruto = receitaLiquida + s("custo");
  const ebitda =
    resultadoBruto +
    s("ajusteTransporte") +
    s("ajusteGestao") +
    s("despesasPessoal") +
    s("administrativas") +
    s("despesasTributarias") +
    s("furtosRoubos") +
    s("apropriacaoContratos") +
    s("participacoesEmpregados");
  const ebit = ebitda + s("depreciacao");

  return { receitaLiquida, resultadoBruto, ebitda, ebit };
}

/** Onde cada total aparece na sequência de linhas (após a linha indicada). */
export const totaisApos: Partial<
  Record<LinhaEbitdaChave, { label: string; campo: keyof ResultadoEbitda; destaque?: boolean }>
> = {
  ajusteEnergy: { label: "= Receita operacional líquida", campo: "receitaLiquida" },
  custo: { label: "= Resultado operacional bruto", campo: "resultadoBruto" },
  participacoesEmpregados: { label: "= EBITDA", campo: "ebitda", destaque: true },
  depreciacao: { label: "= EBIT", campo: "ebit" },
};
