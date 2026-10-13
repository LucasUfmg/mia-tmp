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
import { calcularEbitda, periodoDeComparacao, mesesDoIntervalo, metaCombinada, fatorDiasDoMes, horizontesProjecao, linhasEbitda, projetarDre, projetarDreDias, proporcionalizarDespesas, type DreConsolidada, type LinhaEbitdaChave } from "../ebitda";

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
  // Filtra o escopo ANTES de consultar o BI: Rede = 1 consulta, não uma por posto.
  const escopo = filtrarEscopo(
    linhas as unknown as Lancamento[],
    opcoes.ibms ?? [],
    meses,
  ) as unknown as typeof linhas;

  const { receitaCustoDoBi } = await import("../receita-custo.server");
  const mesCorrente = mesReferencia();
  let falhaBi = false;
  await Promise.all(
    escopo.map(async (l) => {
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
          l.valores.receitaVendas = 0;
          l.valores.custo = 0;
          falhaBi = true;
        }
        if (l.mes === mesCorrente) l.valores = proporcionalizarDespesas(l.valores, fatorDiasDoMes(l.mes));
      }),
  );

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

/**
 * Projeções contábeis. Meta = dia/semana: −7 dias; mês: mês anterior; trimestre/semestre: período anterior; ano: ano anterior;
 * sem histórico → mês anterior fechado proporcional à duração do período.
 */
export async function lerProjecoes(opcoes: { ibms?: string[]; dias?: number; ate?: string; de?: string }) {
  const mes = mesReferencia();
  const filtro = opcoes.ibms ? { ibms: opcoes.ibms } : {};
  const d = await lerDetalheEbitda({ periodo: "mes", mes: mes.slice(0, 7), ...filtro });
  if (d.semCalculo) return { semCalculo: true as const, periodo: d.periodo };
  const base = { ...d._somas, ...calcularEbitda(d._somas) } as DreConsolidada;

  // Consulta ao banco que demora demais vira "sem dados" e cai no fallback (mês anterior).
  const comLimite = <T,>(p: Promise<T | null>, ms: number) =>
    Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), ms))]);
  // Cache de meses fechados (null = sem dados).
  const cache = new Map<string, Promise<DreConsolidada | null>>();
  const buscarMes = (mm: string) => {
    if (!cache.has(mm)) {
      cache.set(mm, (async () => {
        try {
          const h = await lerDetalheEbitda({ periodo: "mes", mes: mm.slice(0, 7), ...filtro });
          if (h.semCalculo || h.avisoBiIndisponivel) return null;
          const dados = { ...h._somas, ...calcularEbitda(h._somas) } as DreConsolidada;
          return dados.vendaCombustivel + dados.vendaMercadorias > 0 ? dados : null;
        } catch { return null; }
      })());
    }
    return cache.get(mm)!;
  };

  const [ano, m] = mes.split("-").map(Number) as [number, number];
  const mesAnterior = new Date(Date.UTC(ano, m - 2, 1)).toISOString().slice(0, 10);
  const diasMesAnterior = new Date(Date.UTC(ano, m - 1, 0)).getUTCDate();

  /** Meta do intervalo [inicio, fim]: período de comparação conforme a duração (dia/semana/mês/período/ano). */
  async function metaDoPeriodo(inicio: string, fim: string) {
    const comp = periodoDeComparacao(inicio, fim);
    const hIni = comp.ini, hFim = comp.fim;
    const meses = mesesDoIntervalo(hIni, hFim);
    const partes: { dados: DreConsolidada; fator: number }[] = [];
    let completo = true;
    const decorridos = (Date.now() - 3 * 3_600_000 - new Date(`${mes}T00:00:00Z`).getTime()) / 86_400_000;
    // Busca todos os meses de comparação em paralelo (com limite de tempo por consulta).
    const fechados = await Promise.all(
      meses.map((x) => (x.mes === mes ? Promise.resolve(null) : comLimite(buscarMes(x.mes), 2000))),
    );
    for (const [i, x] of meses.entries()) {
      if (x.mes === mes) {
        // Mês corrente (parcial): usa a média diária realizada.
        const diasNoMes = x.fracao * new Date(Date.UTC(ano, m, 0)).getUTCDate();
        partes.push({ dados: base, fator: decorridos > 0 ? diasNoMes / decorridos : 0 });
        continue;
      }
      const dados = fechados[i];
      if (!dados) { completo = false; break; }
      partes.push({ dados, fator: x.fracao });
    }
    if (completo && partes.length) {
      return { meta: metaCombinada(partes, 1), origem: `${comp.regra} (${hIni} a ${hFim})` };
    }
    const ant = await buscarMes(mesAnterior);
    if (!ant) return { meta: null, origem: "sem histórico para meta" };
    const dias = (new Date(`${fim}T00:00:00Z`).getTime() - new Date(`${inicio}T00:00:00Z`).getTime()) / 86_400_000 + 1;
    return { meta: metaCombinada([{ dados: ant, fator: dias / diasMesAnterior }], 1), origem: `sem histórico do mesmo período: mês anterior (${mesAnterior.slice(0, 7)}) proporcional a ${Math.round(dias)} dias` };
  }

  const fmt = (r: ReturnType<typeof projetarDre>) => ({
    receitaBruta: r0(r.receitaBruta), cmv: r0(r.custoBi), resultadoOperacionalBruto: r0(r.resultadoBruto),
    despesasTotais: r0(r.despesasTotais), ebitda: r0(r.ebitda), resultadoFinal: r0(r.resultadoFinal),
    litrosVendidos: r0(r.litros), ebitdaPorLitro: Math.round(r.ebitdaPorLitro * 100) / 100,
  });
  const comMeta = (p: ReturnType<typeof fmt>, mt: { meta: ReturnType<typeof projetarDre> | null; origem: string }, periodo: string) => {
    if (!mt.meta) return { periodo, projecao: p, meta: null, origemMeta: mt.origem };
    const meta = fmt(mt.meta);
    const variacaoPct = Object.fromEntries(Object.entries(p).map(([k, v]) => {
      const alvo = (meta as Record<string, number>)[k] ?? 0;
      return [k, alvo ? Math.round(((v - alvo) / Math.abs(alvo)) * 1000) / 10 : null];
    }));
    return { periodo, projecao: p, meta, variacaoPct, origemMeta: mt.origem };
  };

  const hoje = new Date(Date.now() - 3 * 3_600_000).toISOString().slice(0, 10);
  const somarDias = (data: string, n: number) => new Date(new Date(`${data}T00:00:00Z`).getTime() + n * 86_400_000).toISOString().slice(0, 10);
  let projecoes: Record<string, unknown>;
  if (opcoes.dias !== undefined || opcoes.ate || opcoes.de) {
    const inicio = opcoes.de ?? hoje;
    let diasLivre: number;
    let fim: string;
    if (opcoes.de) {
      fim = opcoes.ate ?? somarDias(opcoes.de, Math.max(Math.ceil(opcoes.dias ?? 1) - 1, 0));
      diasLivre = (new Date(`${fim}T00:00:00Z`).getTime() - new Date(`${inicio}T00:00:00Z`).getTime()) / 86_400_000 + 1;
    } else if (opcoes.ate) {
      fim = opcoes.ate;
      diasLivre = Math.max((new Date(`${opcoes.ate}T23:59:59-03:00`).getTime() - Date.now()) / 86_400_000, 0);
    } else {
      diasLivre = opcoes.dias as number;
      fim = somarDias(hoje, Math.max(Math.ceil(diasLivre) - 1, 0));
    }
    projecoes = {
      [`${Math.round(diasLivre * 10) / 10} dias (${inicio} a ${fim})`]: comMeta(fmt(projetarDreDias(base, mes, diasLivre)), await metaDoPeriodo(inicio, fim), `${inicio} a ${fim}`),
    };
  } else {
    projecoes = {};
    for (const h of horizontesProjecao) {
      const fim = new Date(Date.UTC(ano, m - 1 + h.meses, 0)).toISOString().slice(0, 10);
      projecoes[h.label] = comMeta(fmt(projetarDre(base, mes, h.meses)), await metaDoPeriodo(mes, fim), `${mes} a ${fim}`);
    }
  }
  return {
    semCalculo: false as const,
    base: `média diária de ${d.periodo} até agora × duração do período. Meta: dia = mesmo dia da semana anterior; semana = semana anterior; mês = mês anterior; trimestre/semestre = período anterior de mesma duração; ano = ano anterior; sem dados, mês anterior proporcional. CMV e despesas acima da meta = pior.`,
    realizado: { receitaBruta: r0(base.receitaBruta), resultadoOperacionalBruto: d.resultadoOperacionalBruto, despesasTotais: d.despesasTotais, ebitda: d.ebitda, resultadoFinal: d.resultadoFinal, litrosVendidos: r0(base.litrosVendidos || 0), ebitdaPorLitro: base.litrosVendidos ? Math.round((d.ebitda / base.litrosVendidos) * 100) / 100 : null },
    projecoes,
    ...(d.avisoBiIndisponivel ? { avisoBiIndisponivel: d.avisoBiIndisponivel } : {}),
  };
}
