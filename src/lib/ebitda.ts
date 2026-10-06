/**
 * Fonte única das rubricas, agrupamentos e fórmulas da DRE Gerencial.
 * Valores manuais são sempre informados em módulo; o sinal contábil é aplicado aqui.
 */

export const linhasEbitda = [
  { chave: "receitaVendas", label: "Receita bruta", sinal: 1, origem: "bi" },
  { chave: "custo", label: "CMV", sinal: -1, origem: "bi" },
  { chave: "deducoes", label: "Descontos", sinal: -1, origem: "manual" },
  { chave: "acrescimos", label: "Acréscimos", sinal: 1, origem: "manual" },
  { chave: "impostosFaturamentoPostos", label: "Postos", sinal: -1, origem: "manual" },
  { chave: "impostosFaturamentoDistribuidora", label: "Distribuidora", sinal: -1, origem: "manual" },
  { chave: "impostosFaturamentoSatelites", label: "Satélites", sinal: -1, origem: "manual" },
  { chave: "impostosFaturamentoPatrimonial", label: "Patrimonial", sinal: -1, origem: "manual" },
  { chave: "impostosFaturamentoLogistica", label: "Logística", sinal: -1, origem: "manual" },
  { chave: "receitaLiquidaDistribuidora", label: "Receita Líquida Distribuidora", sinal: 1, origem: "manual" },
  { chave: "bonusPerformance", label: "Bônus de Performance", sinal: 1, origem: "manual" },
  { chave: "frete", label: "Frete", sinal: -1, origem: "manual" },
  { chave: "despesasPessoal", label: "Pessoal", sinal: -1, origem: "manual" },
  { chave: "administrativas", label: "Operação / Administrativas", sinal: -1, origem: "manual" },
  { chave: "taxasCartao", label: "Taxas de Cartão", sinal: -1, origem: "manual" },
  { chave: "rateios", label: "Rateios", sinal: -1, origem: "manual" },
  { chave: "despesasTributarias", label: "Tributárias", sinal: -1, origem: "manual" },
  { chave: "aluguel", label: "Aluguel", sinal: -1, origem: "manual" },
  { chave: "despesasGestao", label: "Despesas de Gestão", sinal: -1, origem: "manual" },
  { chave: "despesaDistribuidora", label: "Despesa de Distribuidora", sinal: -1, origem: "manual" },
  { chave: "overAluguel", label: "Over Aluguel", sinal: -1, origem: "manual" },
  { chave: "receitasFinanceiras", label: "Receitas Financeiras", sinal: 1, origem: "manual" },
  { chave: "receitasDiversas", label: "Receitas Diversas", sinal: 1, origem: "manual" },
  { chave: "receitaFinanceiraDistribuidora", label: "Receita Financeira Distribuidora", sinal: 1, origem: "manual" },
  { chave: "despesasFinanceiras", label: "Despesas Financeiras", sinal: -1, origem: "manual" },
  { chave: "despesasNaoContabeis", label: "Despesas Não Operacionais", sinal: -1, origem: "manual" },
  { chave: "despesaFinanceiraDistribuidora", label: "Despesa Financeira Distribuidora", sinal: -1, origem: "manual" },
  { chave: "bonusContrato", label: "Bônus de Contrato", sinal: 1, origem: "manual" },
  { chave: "irpjCsll", label: "Provisões Postos", sinal: -1, origem: "manual" },
  { chave: "irpjCsllDistribuidora", label: "Provisões Distribuidora", sinal: -1, origem: "manual" },
  { chave: "irpjCsllGestao", label: "Provisões Gestão", sinal: -1, origem: "manual" },
  { chave: "irpjCsllPatrimonial", label: "Provisões Patrimonial", sinal: -1, origem: "manual" },
  { chave: "irpjCsllLogistica", label: "Provisões Logística", sinal: -1, origem: "manual" },
  { chave: "socios", label: "Retiradas / Pró-labore", sinal: -1, origem: "manual" },
] as const;

export type LinhaEbitdaChave = (typeof linhasEbitda)[number]["chave"];
export const linhasDespesas = linhasEbitda.filter((linha) => linha.origem === "manual");

export const linhasEbitdaLegadas = [
  "faltaSobra", "outrasOperacionais", "outrasReceitasNaoOperacionais",
  "ajusteEnergy", "ajusteTransporte", "ajusteGestao", "furtosRoubos",
  "apropriacaoContratos", "participacoesEmpregados", "depreciacao",
] as const;
export type LinhaEbitdaLegadaChave = (typeof linhasEbitdaLegadas)[number];

export type DadosBiDre = {
  vendaCombustivel: number;
  vendaMercadorias: number;
  vendaServicos: number;
  custoCombustivel: number;
  custoMercadoria: number;
  litrosVendidos: number;
  abastecimentosRealizados: number;
  margemProduto: number;
  margemCombustivel: number;
};

export type Ebitda = { ibm: string; mes: string } &
  Record<LinhaEbitdaChave | LinhaEbitdaLegadaChave, number> & DadosBiDre;

export type ResultadoEbitda = {
  receitaBruta: number;
  totalReceita: number;
  totalImpostos: number;
  custoTotal: number;
  resultadoBruto: number;
  resultadoOperacional: number;
  despesasTotais: number;
  ebitda: number;
  ebit: number;
  totalNaoOperacional: number;
  totalIrpjCsll: number;
  resultadoFinal: number;
  lucroLiquido: number;
  receitaLiquida: number;
};
export type DreConsolidada = Record<LinhaEbitdaChave, number> & DadosBiDre & ResultadoEbitda;

const sinais = Object.fromEntries(linhasEbitda.map((l) => [l.chave, l.sinal])) as Record<LinhaEbitdaChave, number>;
export function comSinal(chave: LinhaEbitdaChave, valor: number): number {
  return sinais[chave] * Math.abs(valor || 0);
}

const somaAbs = (v: Record<LinhaEbitdaChave, number>, chaves: LinhaEbitdaChave[]) =>
  chaves.reduce((total, chave) => total + Math.abs(v[chave] || 0), 0);

export function calcularEbitda(v: Record<LinhaEbitdaChave, number> & Partial<DadosBiDre>): ResultadoEbitda {
  const s = (chave: LinhaEbitdaChave) => comSinal(chave, v[chave]);
  const receitaBruta = (v.vendaCombustivel || 0) + (v.vendaMercadorias || 0) + (v.vendaServicos || 0) || s("receitaVendas");
  const totalReceita = receitaBruta + s("deducoes") + s("acrescimos");
  const impostos = ["impostosFaturamentoPostos", "impostosFaturamentoDistribuidora", "impostosFaturamentoSatelites", "impostosFaturamentoPatrimonial", "impostosFaturamentoLogistica"] as LinhaEbitdaChave[];
  const totalImpostos = somaAbs(v, impostos);
  const custoBi = (v.custoCombustivel || 0) + (v.custoMercadoria || 0) || Math.abs(s("custo"));
  const custoTotal = custoBi + Math.abs(s("frete")) - s("receitaLiquidaDistribuidora") - s("bonusPerformance");
  const resultadoBruto = receitaBruta - custoBi;
  const resultadoOperacional = totalReceita - totalImpostos - custoTotal;
  const despesas = ["despesasPessoal", "administrativas", "taxasCartao", "rateios", "despesasTributarias", "aluguel", "despesasGestao", "despesaDistribuidora", "overAluguel"] as LinhaEbitdaChave[];
  const despesasTotais = somaAbs(v, despesas);
  const ebitda = resultadoOperacional - despesasTotais;
  const totalNaoOperacional = s("receitasFinanceiras") + s("receitasDiversas") + s("receitaFinanceiraDistribuidora") + s("despesasFinanceiras") + s("despesasNaoContabeis") + s("despesaFinanceiraDistribuidora") + s("bonusContrato");
  const irpj = ["irpjCsll", "irpjCsllDistribuidora", "irpjCsllGestao", "irpjCsllPatrimonial", "irpjCsllLogistica"] as LinhaEbitdaChave[];
  const totalIrpjCsll = somaAbs(v, irpj);
  const resultadoFinal = ebitda + totalNaoOperacional - totalIrpjCsll - Math.abs(s("socios"));
  return { receitaBruta, totalReceita, totalImpostos, custoTotal, resultadoBruto, resultadoOperacional, despesasTotais, ebitda, ebit: ebitda, totalNaoOperacional, totalIrpjCsll, resultadoFinal, lucroLiquido: resultadoFinal, receitaLiquida: totalReceita - totalImpostos };
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
  const somas = Object.fromEntries(linhasEbitda.map((linha) => [linha.chave, filtradas.reduce((t, item) => t + (item[linha.chave] || 0), 0)])) as Record<LinhaEbitdaChave, number>;
  const bi = Object.fromEntries((["vendaCombustivel", "vendaMercadorias", "vendaServicos", "custoCombustivel", "custoMercadoria", "litrosVendidos", "abastecimentosRealizados"] as const).map((chave) => [chave, filtradas.reduce((t, item) => t + (item[chave] || 0), 0)])) as Omit<DadosBiDre, "margemProduto" | "margemCombustivel">;
  const margemProduto = bi.vendaMercadorias ? ((bi.vendaMercadorias - bi.custoMercadoria) / bi.vendaMercadorias) * 100 : 0;
  const margemCombustivel = bi.vendaCombustivel ? ((bi.vendaCombustivel - bi.custoCombustivel) / bi.vendaCombustivel) * 100 : 0;
  const dadosBi = { ...bi, margemProduto, margemCombustivel };
  return { ...somas, ...dadosBi, ...calcularEbitda({ ...somas, ...dadosBi }) };
}

export type LinhaDre =
  | { tipo: "grupo" | "total"; label: string; campo: keyof ResultadoEbitda }
  | { tipo: "bi"; label: string; campo: keyof DadosBiDre; sinal?: -1 }
  | { tipo: "manual"; label: string; chave: LinhaEbitdaChave }
  | { tipo: "metrica"; label: string; campo: keyof DadosBiDre };

/** Ordem visual idêntica ao modelo de DRE fornecido. */
export const linhasDre: LinhaDre[] = [
  { tipo: "grupo", label: "Total Receita", campo: "totalReceita" },
  { tipo: "bi", label: "Venda de Combustível", campo: "vendaCombustivel" },
  { tipo: "bi", label: "Venda de Mercadorias (Produtos)", campo: "vendaMercadorias" },
  { tipo: "bi", label: "Venda de Serviços", campo: "vendaServicos" },
  { tipo: "manual", label: "Descontos", chave: "deducoes" },
  { tipo: "manual", label: "Acréscimos", chave: "acrescimos" },
  { tipo: "grupo", label: "Impostos sobre Faturamento", campo: "totalImpostos" },
  { tipo: "manual", label: "Postos", chave: "impostosFaturamentoPostos" },
  { tipo: "manual", label: "Distribuidora", chave: "impostosFaturamentoDistribuidora" },
  { tipo: "manual", label: "Satélites", chave: "impostosFaturamentoSatelites" },
  { tipo: "manual", label: "Patrimonial", chave: "impostosFaturamentoPatrimonial" },
  { tipo: "manual", label: "Logística", chave: "impostosFaturamentoLogistica" },
  { tipo: "grupo", label: "Custo", campo: "custoTotal" },
  { tipo: "bi", label: "Custo Combustível", campo: "custoCombustivel", sinal: -1 },
  { tipo: "bi", label: "Custo Mercadoria", campo: "custoMercadoria", sinal: -1 },
  { tipo: "manual", label: "Receita Líquida Distribuidora", chave: "receitaLiquidaDistribuidora" },
  { tipo: "manual", label: "Bônus de Performance", chave: "bonusPerformance" },
  { tipo: "manual", label: "Frete", chave: "frete" },
  { tipo: "total", label: "Resultado Operacional Bruto", campo: "resultadoOperacional" },
  { tipo: "grupo", label: "Total Despesas", campo: "despesasTotais" },
  ...(["despesasPessoal", "administrativas", "taxasCartao", "rateios", "despesasTributarias", "aluguel", "despesasGestao", "despesaDistribuidora", "overAluguel"] as LinhaEbitdaChave[]).map((chave) => ({ tipo: "manual" as const, label: linhasEbitda.find((l) => l.chave === chave)?.label ?? chave, chave })),
  { tipo: "total", label: "EBITDA", campo: "ebitda" },
  { tipo: "grupo", label: "Receitas e Despesas Não Operacionais", campo: "totalNaoOperacional" },
  ...(["receitasFinanceiras", "receitasDiversas", "receitaFinanceiraDistribuidora", "despesasFinanceiras", "despesasNaoContabeis", "despesaFinanceiraDistribuidora", "bonusContrato"] as LinhaEbitdaChave[]).map((chave) => ({ tipo: "manual" as const, label: linhasEbitda.find((l) => l.chave === chave)?.label ?? chave, chave })),
  { tipo: "grupo", label: "IRPJ e CSLL", campo: "totalIrpjCsll" },
  ...(["irpjCsll", "irpjCsllDistribuidora", "irpjCsllGestao", "irpjCsllPatrimonial", "irpjCsllLogistica"] as LinhaEbitdaChave[]).map((chave) => ({ tipo: "manual" as const, label: linhasEbitda.find((l) => l.chave === chave)?.label ?? chave, chave })),
  { tipo: "grupo", label: "Sócios", campo: "resultadoFinal" },
  { tipo: "manual", label: "Retiradas / Pró-labore", chave: "socios" },
  { tipo: "total", label: "Resultado Empresa", campo: "resultadoFinal" },
  { tipo: "metrica", label: "Litros Vendidos", campo: "litrosVendidos" },
  { tipo: "metrica", label: "Abastecimentos Realizados", campo: "abastecimentosRealizados" },
  { tipo: "metrica", label: "Margem Produto", campo: "margemProduto" },
  { tipo: "metrica", label: "Margem Combustível", campo: "margemCombustivel" },
];

export const totaisApos = {};