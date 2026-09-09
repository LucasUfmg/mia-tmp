/** Leitura dos lançamentos contábeis (tela /contabil) para o agente Mia. */
import { clienteContabil } from "../contabil.server";
import {
  consolidar,
  filtrarEscopo,
  mesReferencia,
  mesesDoAno,
  rotuloMes,
  type Lancamento,
} from "../contabil";
import { calcularEbitda, linhasEbitda, type LinhaEbitdaChave } from "../ebitda";

const COLUNAS =
  "id, ibm, mes, receita_liquida, lucro_liquido, ebitda, ebit, aliquota_efetiva, pl_inicial, pl_final, divida_financeira, caixa, wacc";

type Linha = Record<string, unknown>;

function paraLancamento(l: Linha): Lancamento {
  const n = (v: unknown) => Number(v) || 0;
  return {
    id: String(l["id"]),
    ibm: String(l["ibm"]),
    mes: String(l["mes"]).slice(0, 10),
    receitaLiquida: n(l["receita_liquida"]),
    lucroLiquido: n(l["lucro_liquido"]),
    ebitda: n(l["ebitda"]),
    ebit: n(l["ebit"]),
    aliquotaEfetiva: n(l["aliquota_efetiva"]),
    plInicial: n(l["pl_inicial"]),
    plFinal: n(l["pl_final"]),
    dividaFinanceira: n(l["divida_financeira"]),
    caixa: n(l["caixa"]),
    wacc: n(l["wacc"]),
  };
}

async function buscarAno(ano: string): Promise<Lancamento[]> {
  const supabase = clienteContabil();
  const { data, error } = await supabase
    .from("contabil_lancamentos")
    .select(COLUNAS)
    .gte("mes", `${ano}-01-01`)
    .lte("mes", `${ano}-12-01`)
    .order("mes", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((l) => paraLancamento(l as Linha));
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const r0 = (n: number) => Math.round(n);
const pct = (n: number | null) => (n === null ? null : r2(n));

/**
 * Indicadores contábeis consolidados de um mês ("YYYY-MM") ou do ano até o mês (YTD).
 * `ibms` vazio/indefinido = rede inteira (usa o lançamento "REDE" quando existir).
 */
export async function lerContabil(opcoes: {
  periodo: "mes" | "ano";
  mes?: string;
  ibms?: string[];
}) {
  const referencia = opcoes.mes ? `${opcoes.mes}-01` : mesReferencia();
  const ano = referencia.slice(0, 4);
  const meses =
    opcoes.periodo === "ano"
      ? mesesDoAno(ano).filter((m) => m <= referencia)
      : [referencia];

  const todos = await buscarAno(ano);
  const linhas = filtrarEscopo(todos, opcoes.ibms ?? [], meses);

  if (linhas.length === 0) {
    return {
      semLancamento: true as const,
      periodo: opcoes.periodo === "ano" ? `acumulado ${ano}` : rotuloMes(referencia),
    };
  }

  const c = consolidar(linhas);
  const mesesComDado = [...new Set(linhas.map((l) => l.mes))].sort().map(rotuloMes);

  return {
    semLancamento: false as const,
    periodo: opcoes.periodo === "ano" ? `acumulado ${ano}` : rotuloMes(referencia),
    mesesLancados: mesesComDado,
    postos: c.postos,
    receitaLiquida: r0(c.receitaLiquida),
    lucroLiquido: r0(c.lucroLiquido),
    ebitda: r0(c.ebitda),
    ebit: r0(c.ebit),
    plMedio: r0(c.plMedio),
    capitalInvestido: r0(c.capitalInvestido),
    nopat: r0(c.nopat),
    aliquotaEfetivaPercent: r2(c.aliquotaEfetiva),
    waccPercent: r2(c.wacc),
    roePercent: pct(c.roe),
    roicPercent: pct(c.roic),
    margemLiquidaPercent: pct(c.margemLiquida),
    margemEbitdaPercent: pct(c.margemEbitda),
    roicMenosWaccPP: c.roic === null ? null : r2(c.roic - c.wacc),
  };
}

/** Coluna do banco para cada linha da DRE. */
const COLUNAS_EBITDA: Record<LinhaEbitdaChave, string> = {
  receitaVendas: "receita_vendas",
  deducoes: "deducoes",
  ajusteEnergy: "ajuste_energy",
  custo: "custo",
  ajusteTransporte: "ajuste_transporte",
  ajusteGestao: "ajuste_gestao",
  despesasPessoal: "despesas_pessoal",
  administrativas: "administrativas",
  despesasTributarias: "despesas_tributarias",
  furtosRoubos: "furtos_roubos",
  apropriacaoContratos: "apropriacao_contratos",
  participacoesEmpregados: "participacoes_empregados",
  depreciacao: "depreciacao",
};

/**
 * Detalhamento do cálculo de EBITDA (linhas da DRE preenchidas na calculadora),
 * somado no escopo e no período, com os totais recalculados.
 */
export async function lerDetalheEbitda(opcoes: {
  periodo: "mes" | "ano";
  mes?: string;
  ibms?: string[];
}) {
  const referencia = opcoes.mes ? `${opcoes.mes}-01` : mesReferencia();
  const ano = referencia.slice(0, 4);
  const meses =
    opcoes.periodo === "ano" ? mesesDoAno(ano).filter((m) => m <= referencia) : [referencia];

  const supabase = clienteContabil();
  const colunas = ["ibm", "mes", ...Object.values(COLUNAS_EBITDA)].join(", ");
  const { data, error } = await supabase
    .from("contabil_ebitda")
    .select(colunas)
    .gte("mes", `${ano}-01-01`)
    .lte("mes", `${ano}-12-01`);
  if (error) throw new Error(error.message);

  const n = (v: unknown) => Number(v) || 0;
  const linhas = (data ?? []).map((l) => {
    const linha = l as unknown as Linha;
    const valores = Object.fromEntries(
      linhasEbitda.map((c) => [c.chave, n(linha[COLUNAS_EBITDA[c.chave]])]),
    ) as Record<LinhaEbitdaChave, number>;
    return {
      ibm: String(linha["ibm"]),
      mes: String(linha["mes"]).slice(0, 10),
      // `receitaLiquida` serve só como peso do filtro de escopo (não usado aqui).
      receitaLiquida: 0,
      valores,
    };
  });

  const escopo = filtrarEscopo(
    linhas as unknown as Lancamento[],
    opcoes.ibms ?? [],
    meses,
  ) as unknown as typeof linhas;

  const periodoLabel = opcoes.periodo === "ano" ? `acumulado ${ano}` : rotuloMes(referencia);
  if (escopo.length === 0) {
    return { semCalculo: true as const, periodo: periodoLabel };
  }

  const somas = Object.fromEntries(
    linhasEbitda.map((c) => [c.chave, escopo.reduce((s, l) => s + l.valores[c.chave], 0)]),
  ) as Record<LinhaEbitdaChave, number>;

  const totais = calcularEbitda(somas);
  const detalhamento = Object.fromEntries(
    linhasEbitda.map((c) => [c.label, r0(somas[c.chave])]),
  );

  return {
    semCalculo: false as const,
    periodo: periodoLabel,
    mesesCalculados: [...new Set(escopo.map((l) => l.mes))].sort().map(rotuloMes),
    postos: [...new Set(escopo.map((l) => l.ibm))],
    detalhamento,
    receitaOperacionalLiquida: r0(totais.receitaLiquida),
    resultadoOperacionalBruto: r0(totais.resultadoBruto),
    ebitda: r0(totais.ebitda),
    ebit: r0(totais.ebit),
  };
}
