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
