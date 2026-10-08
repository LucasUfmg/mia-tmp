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
import { calcularEbitda, diasDosMeses, fatorDiasDoMes, horizontesProjecao, linhasEbitda, projetarDre, proporcionalizarDespesas, type DreConsolidada, type LinhaEbitdaChave } from "../ebitda";

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
  try {
    const d = await lerDetalheEbitda({ periodo: opcoes.periodo, ...(opcoes.mes ? { mes: opcoes.mes } : {}), ...(opcoes.ibms ? { ibms: opcoes.ibms } : {}) });
    if (!d.semCalculo) {
      c.receitaLiquida = d.receitaOperacionalLiquida;
      c.ebitda = d.ebitda;
      c.ebit = d.ebit;
      c.lucroLiquido = d.resultadoLiquido;
      c.margemEbitda = c.receitaLiquida ? (c.ebitda / c.receitaLiquida) * 100 : null;
      c.margemLiquida = c.receitaLiquida ? (c.lucroLiquido / c.receitaLiquida) * 100 : null;
    }
  } catch { /* mantém lançamentos */ }
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
const COLUNAS_EBITDA = Object.fromEntries(
  linhasEbitda.map(({ chave }) => [chave, chave.replace(/[A-Z]/g, (letra) => `_${letra.toLowerCase()}`)]),
) as Record<LinhaEbitdaChave, string>;

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
     ) as Record<LinhaEbitdaChave, number> & Partial<import("../ebitda").DadosBiDre>;
    return {
      ibm: String(linha["ibm"]),
      mes: String(linha["mes"]).slice(0, 10),
      // `receitaLiquida` serve só como peso do filtro de escopo (não usado aqui).
      receitaLiquida: 0,
      valores,
    };
  });

  const { receitaCustoDoBi } = await import("../receita-custo.server");
  const mesCorrente = mesReferencia();
  let falhaBi = false;
  await Promise.all(
    linhas
      .filter((l) => meses.includes(l.mes))
      .map(async (l) => {
        try {
          const b = await receitaCustoDoBi({ mes: l.mes, ...(l.ibm !== "REDE" ? { ibm: l.ibm } : {}) });
          l.valores.receitaVendas = b.receita;
          l.valores.custo = b.custo;
           Object.assign(l.valores, {
             vendaCombustivel: b.vendaCombustivel,
             vendaMercadorias: b.vendaMercadorias,
             vendaServicos: b.vendaServicos,
             custoCombustivel: b.custoCombustivel,
             custoMercadoria: b.custoMercadoria,
             litrosVendidos: b.litrosVendidos,
             abastecimentosRealizados: b.abastecimentosRealizados,
             margemProduto: b.margemProduto,
             margemCombustivel: b.margemCombustivel,
           });
        } catch {
          // Nunca usa valores antigos salvos: sinaliza falha do BI.
          l.valores.receitaVendas = 0;
          l.valores.custo = 0;
          falhaBi = true;
        }
        // Mês corrente: despesas proporcionais aos dias (mesma regra do painel).
        if (l.mes === mesCorrente) l.valores = proporcionalizarDespesas(l.valores, fatorDiasDoMes(l.mes));
      }),
  );

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
  ) as Record<LinhaEbitdaChave, number> & import("../ebitda").DadosBiDre;
  for (const chave of ["vendaCombustivel", "vendaMercadorias", "vendaServicos", "custoCombustivel", "custoMercadoria", "litrosVendidos", "abastecimentosRealizados"] as const) {
    somas[chave] = escopo.reduce((total, linha) => total + Number(linha.valores[chave] ?? 0), 0);
  }
  somas.margemProduto = somas.vendaMercadorias ? ((somas.vendaMercadorias - somas.custoMercadoria) / somas.vendaMercadorias) * 100 : 0;
  somas.margemCombustivel = somas.vendaCombustivel ? ((somas.vendaCombustivel - somas.custoCombustivel) / somas.vendaCombustivel) * 100 : 0;

  const totais = calcularEbitda(somas);
  const detalhamento = Object.fromEntries(
    linhasEbitda.filter((c) => c.origem !== "legado").map((c) => [c.label, r0(somas[c.chave])]),
  );

  return {
    semCalculo: false as const,
    periodo: periodoLabel,
    ...(falhaBi ? { avisoBiIndisponivel: "Não foi possível buscar receita/CMV no BI; números incompletos." } : {}),
    ...(meses.includes(mesCorrente) ? { observacao: "Mês corrente: receita/CMV até agora e despesas proporcionais aos dias decorridos, igual ao painel." } : {}),
    mesesCalculados: [...new Set(escopo.map((l) => l.mes))].sort().map(rotuloMes),
    postos: [...new Set(escopo.map((l) => l.ibm))],
    detalhamento,
    vendaCombustivel: r0(somas.vendaCombustivel),
    vendaMercadorias: r0(somas.vendaMercadorias),
    vendaServicos: r0(somas.vendaServicos),
    custoCombustivel: r0(somas.custoCombustivel),
    custoMercadoria: r0(somas.custoMercadoria),
    litrosVendidos: r0(somas.litrosVendidos),
    abastecimentosRealizados: r0(somas.abastecimentosRealizados),
    margemProdutoPercent: r2(somas.margemProduto),
    margemCombustivelPercent: r2(somas.margemCombustivel),
    receitaOperacionalLiquida: r0(totais.receitaLiquida),
    resultadoOperacionalBruto: r0(totais.resultadoBruto),
    despesasTotais: r0(totais.despesasTotais),
    ebitda: r0(totais.ebitda),
    ebit: r0(totais.ebit),
    irpjCsll: r0(totais.totalIrpjCsll),
    resultadoLiquido: r0(totais.resultadoLiquido),
    resultadoFinal: r0(totais.resultadoFinal),
    lucroLiquido: r0(totais.lucroLiquido),
    _somas: somas,
  };
}

/** Projeções do mês corrente (fim do mês, próximos 3 e 6 meses), iguais à aba Projeções. */
export async function lerProjecoes(opcoes: { ibms?: string[] }) {
  const mes = mesReferencia();
  const d = await lerDetalheEbitda({ periodo: "mes", mes: mes.slice(0, 7), ...(opcoes.ibms ? { ibms: opcoes.ibms } : {}) });
  if (d.semCalculo) return { semCalculo: true as const, periodo: d.periodo };
  const base = { ...d._somas, ...calcularEbitda(d._somas) } as DreConsolidada;
  const projecoes = Object.fromEntries(
    horizontesProjecao.map((h) => {
      const r = projetarDre(base, mes, diasDosMeses(mes, h.meses));
      return [h.label, {
        receitaBruta: r0(r.receitaBruta), cmv: r0(r.custoBi), resultadoOperacionalBruto: r0(r.resultadoBruto),
        despesasTotais: r0(r.despesasTotais), ebitda: r0(r.ebitda), resultadoFinal: r0(r.resultadoFinal),
        litrosVendidos: r0(r.litros), ebitdaPorLitro: Math.round(r.ebitdaPorLitro * 100) / 100,
      }];
    }),
  );
  return {
    semCalculo: false as const,
    base: `média diária de ${d.periodo} até agora`,
    realizado: { receitaBruta: r0(base.receitaBruta), resultadoOperacionalBruto: d.resultadoOperacionalBruto, despesasTotais: d.despesasTotais, ebitda: d.ebitda, resultadoFinal: d.resultadoFinal, litrosVendidos: r0(base.litrosVendidos || 0), ebitdaPorLitro: base.litrosVendidos ? Math.round((d.ebitda / base.litrosVendidos) * 100) / 100 : null },
    projecoes,
    ...(d.avisoBiIndisponivel ? { avisoBiIndisponivel: d.avisoBiIndisponivel } : {}),
  };
}
