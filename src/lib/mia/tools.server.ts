import { tool } from "ai";
import { z } from "zod";

import { chaveDeCache, comCache } from "../cache.server";
import { sameWeekdayDates } from "../redeflex-transform";
import {
  calcFuelByDates,
  calcProductByDates,
  getCategoriasCombustivel,
  getCategoriasProduto,
  getIndicadores,
  getIndicadoresPorPosto,
  getItensTotaisPorPosto,
  getRankingVendedores,
  getVolumePorPosto,
  listarLojas,
} from "../redeflex-mongo.server";
import { corteAgora, formatCorte, hojeSaoPaulo, primeiroDiaDoMes } from "./datas";

/** Escopo de dados do contato: IBMs autorizados (vazio = rede inteira). */
export type Escopo = { ibms: string[] };

const escopoEnum = z.enum(["hoje", "mes"]);
type EscopoPeriodo = z.infer<typeof escopoEnum>;

const r2 = (n: number) => Math.round(n * 100) / 100;
const r0 = (n: number) => Math.round(n);

/** Soma as chaves `IBM_data` dos postos permitidos em um total por data. */
function somarPostos(
  serie: Record<string, number>,
  datas: string[],
  ibms: string[],
): Record<string, number> {
  const total: Record<string, number> = {};
  for (const data of datas) {
    total[data] = ibms.reduce((soma, ibm) => soma + (serie[`${ibm}_${data}`] ?? 0), 0);
  }
  return total;
}

function periodo(tipo: EscopoPeriodo) {
  const referencia = hojeSaoPaulo();
  const corte = corteAgora();
  return {
    referencia,
    corte,
    corteTexto: formatCorte(corte),
    desde: tipo === "mes" ? primeiroDiaDoMes(referencia) : undefined,
  };
}

async function lojasPermitidas(escopo: Escopo) {
  const lojas = await comCache(chaveDeCache("mia:lojas", null), false, () => listarLojas());
  if (escopo.ibms.length === 0) return lojas;
  const permitidos = new Set(escopo.ibms);
  return lojas.filter((l) => permitidos.has(l.ibm));
}

/** Resolve nomes informados pelo modelo em IBMs, sempre dentro do escopo. */
async function resolverIbms(escopo: Escopo, postos?: string[]): Promise<string[] | undefined> {
  const lojas = await lojasPermitidas(escopo);
  if (!postos || postos.length === 0) return escopo.ibms.length > 0 ? escopo.ibms : undefined;

  const alvo: string[] = [];
  for (const termo of postos) {
    const t = termo.trim().toLowerCase();
    const achado =
      lojas.find((l) => l.ibm === termo) ??
      lojas.find((l) => l.nome.toLowerCase() === t) ??
      lojas.find((l) => l.nome.toLowerCase().includes(t));
    if (achado) alvo.push(achado.ibm);
  }
  if (alvo.length === 0) return escopo.ibms.length > 0 ? escopo.ibms : undefined;
  return [...new Set(alvo)];
}

/** Indicadores do dia (on-time) ou do acumulado do mês, já arredondados. */
export async function lerIndicadores(escopo: Escopo, tipo: EscopoPeriodo, postos?: string[]) {
  const { referencia, corte, corteTexto, desde } = periodo(tipo);
  const ibms = await resolverIbms(escopo, postos);
  const dados = await comCache(
    chaveDeCache("mia:ind", { referencia, corte, desde, ibms }),
    false,
    () => getIndicadores([referencia], ibms, corte, desde),
  );
  return {
    referencia,
    corte: corteTexto,
    combustivel: {
      litros: r0(dados.combustivel.litros),
      faturamento: r0(dados.combustivel.receita),
      resultadoBruto: r0(dados.combustivel.lucroBruto),
      mlt: r2(dados.combustivel.mlt),
      lbPercent: r2(dados.combustivel.lb),
      tmc: r2(dados.combustivel.tmc),
      tmv: r2(dados.combustivel.tmv),
      atendimentos: dados.combustivel.atendimentos,
    },
    produto: {
      receita: r0(dados.produto.receita),
      tmp: r2(dados.produto.tmp),
      cupons: dados.produto.cupons,
    },
  };
}

/** Ferramentas do agente: leitura dos mesmos dados do painel, nada de escrita. */
export function criarFerramentas(escopo: Escopo) {
  return {
    listar_postos: tool({
      description: "Lista os postos que este usuário pode consultar.",
      inputSchema: z.object({}),
      execute: async () => {
        const lojas = await lojasPermitidas(escopo);
        return { postos: lojas.map((l) => l.nome), rede: escopo.ibms.length === 0 };
      },
    }),

    indicadores: tool({
      description:
        "Números do dia (on-time) ou do acumulado do mês: litros, faturamento, resultado bruto, M/LT, LB%, TMC, TMV e produtos (receita e TMP).",
      inputSchema: z.object({
        escopo: escopoEnum,
        postos: z.array(z.string()).optional().describe("Nomes dos postos; vazio = todos os permitidos"),
      }),
      execute: async ({ escopo: tipo, postos }) => lerIndicadores(escopo, tipo, postos),
    }),

    comparativo_semanal: tool({
      description:
        "Compara o mesmo dia da semana nas últimas 4 semanas, todos cortados no mesmo horário: litros e receita de produtos.",
      inputSchema: z.object({
        postos: z.array(z.string()).optional(),
      }),
      execute: async ({ postos }) => {
        const referencia = hojeSaoPaulo();
        const corte = corteAgora();
        const datas = sameWeekdayDates(referencia, 4);
        const ibms = await resolverIbms(escopo, postos);
        const chave = { datas, corte, ibms };
        const { litrosPorData, produtoPorData } = await comCache(
          chaveDeCache("mia:semana", chave),
          false,
          async () => {
            if (!ibms) {
              const [litros, produtos] = await Promise.all([
                calcFuelByDates(datas, true, corte),
                calcProductByDates(datas, true, corte),
              ]);
              return { litrosPorData: litros, produtoPorData: produtos };
            }
            const [litros, produtos] = await Promise.all([
              getVolumePorPosto(datas, true, corte),
              getItensTotaisPorPosto(datas, true, corte),
            ]);
            return {
              litrosPorData: somarPostos(litros, datas, ibms),
              produtoPorData: somarPostos(produtos, datas, ibms),
            };
          },
        );
        return {
          corte: formatCorte(corte),
          dias: datas.map((d) => ({
            data: d,
            litros: r0(litrosPorData[d] ?? 0),
            produtos: r0(produtoPorData[d] ?? 0),
          })),
        };
      },
    }),

    ranking_postos: tool({
      description:
        "Ranking dos postos no dia ou no mês: litros, faturamento e M/LT de cada um. Use para 'qual posto vendeu mais/menos'.",
      inputSchema: z.object({
        escopo: escopoEnum,
        ordem: z.enum(["maiores", "menores"]),
        limite: z.number().int().min(1).max(10),
      }),
      execute: async ({ escopo: tipo, ordem, limite }) => {
        const { referencia, corte, corteTexto, desde } = periodo(tipo);
        const [linhas, lojas] = await Promise.all([
          comCache(chaveDeCache("mia:postos", { referencia, corte, desde }), false, () =>
            getIndicadoresPorPosto([referencia], corte, desde),
          ),
          lojasPermitidas(escopo),
        ]);
        const nomes = new Map(lojas.map((l) => [l.ibm, l.nome]));
        const filtradas = linhas.filter((l) => nomes.has(l.ibm));
        const ordenadas = [...filtradas].sort((a, b) =>
          ordem === "maiores" ? b.litros - a.litros : a.litros - b.litros,
        );
        return {
          corte: corteTexto,
          postos: ordenadas.slice(0, limite).map((l) => ({
            posto: nomes.get(l.ibm) ?? l.ibm,
            litros: r0(l.litros),
            faturamento: r0(l.receita),
            mlt: r2(l.mlt),
            tmc: r2(l.tmc),
          })),
        };
      },
    }),

    distribuicao: tool({
      description:
        "Distribuição por tipo de combustível ou por grupo de produto no dia ou no mês (receita, resultado bruto e índice).",
      inputSchema: z.object({
        tipo: z.enum(["combustivel", "produto"]),
        escopo: escopoEnum,
        postos: z.array(z.string()).optional(),
      }),
      execute: async ({ tipo, escopo: quando, postos }) => {
        const { referencia, corte, corteTexto, desde } = periodo(quando);
        const ibms = await resolverIbms(escopo, postos);
        const itens = await comCache(
          chaveDeCache("mia:dist", { tipo, referencia, corte, desde, ibms }),
          false,
          () =>
            tipo === "combustivel"
              ? getCategoriasCombustivel([referencia], ibms, corte, desde)
              : getCategoriasProduto([referencia], ibms, corte, desde),
        );
        return {
          corte: corteTexto,
          categorias: itens.map((c) => ({
            nome: c.nome,
            receita: r0(c.receita),
            resultadoBruto: r0(c.lucroBruto),
            lbPercent: r2(c.lb),
            indice: r2(c.indice),
          })),
        };
      },
    }),

    ranking_vendedores: tool({
      description:
        "Ranking de vendas de combustível por funcionário (frentista) no dia ou no mês: litros, faturamento, M/LT e TMC. Use para 'quem vendeu mais/menos'.",
      inputSchema: z.object({
        escopo: escopoEnum,
        ordem: z.enum(["maiores", "menores"]),
        limite: z.number().int().min(1).max(10),
        postos: z.array(z.string()).optional(),
      }),
      execute: async ({ escopo: tipo, ordem, limite, postos }) => {
        const { referencia, corte, corteTexto, desde } = periodo(tipo);
        const ibms = await resolverIbms(escopo, postos);
        const [linhas, lojas] = await Promise.all([
          comCache(
            chaveDeCache("mia:vendedores", { referencia, corte, desde, ibms, ordem, limite }),
            false,
            () => getRankingVendedores([referencia], ibms, corte, desde, limite, ordem),
          ),
          lojasPermitidas(escopo),
        ]);
        const nomes = new Map(lojas.map((l) => [l.ibm, l.nome]));
        return {
          corte: corteTexto,
          vendedores: linhas
            .filter((l) => nomes.has(l.ibm))
            .map((l) => ({
              vendedor: l.nome,
              posto: nomes.get(l.ibm) ?? l.ibm,
              litros: r0(l.litros),
              faturamento: r0(l.receita),
              mlt: r2(l.mlt),
              tmc: r2(l.tmc),
              atendimentos: l.atendimentos,
            })),
        };
      },
    }),

    projecao_mes: tool({
      description:
        "Projeção da Visão Geral (galonagem, produto, M/LT, LB, TMV, TMC, TMP, cupons) com meta e diferença %. periodo 'dia' = fim do dia; 'mes' = fim do mês. Para QUALQUER outro período informe horas, dias, ate (YYYY-MM-DD) e/ou de (início de período futuro). Meta (origemMeta): dia = mesmo dia da semana anterior; semana = semana anterior; mês = mês anterior; trimestre/semestre = período anterior de mesma duração; ano = ano anterior; sem dados, mês anterior fechado proporcional.",
      inputSchema: z.object({
        periodo: z.enum(["dia", "mes"]).default("mes"),
        horas: z.number().positive().optional().describe("Próximas N horas"),
        dias: z.number().positive().optional().describe("Próximos N dias"),
        de: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Início de um período futuro"),
        ate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Projetar até o fim desta data"),
        postos: z.array(z.string()).optional(),
      }),
      execute: async ({ periodo, horas, dias, de, ate, postos }) => {
        const { montarProjecao, escopoMeta, fatorDia, fatorMes, MINUTOS_DIA_FECHADO } = await import(
          "../projecao-visao"
        );
        const { periodoDeComparacao } = await import("../ebitda");
        const referencia = hojeSaoPaulo();
        const corte = corteAgora();
        const somarDias = (data: string, n: number) => new Date(new Date(`${data}T00:00:00Z`).getTime() + n * 86_400_000).toISOString().slice(0, 10);
        const diffDias = (a: string, b: string) => (new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / 86_400_000 + 1;
        // Converte o período livre em minutos futuros.
        let minutos: number | undefined;
        if (de) minutos = diffDias(de, ate ?? somarDias(de, Math.max(Math.ceil(dias ?? 1) - 1, 0))) * 1440;
        else if (horas) minutos = horas * 60;
        else if (dias) minutos = dias * 1440;
        else if (ate) minutos = Math.max((new Date(`${ate}T23:59:59-03:00`).getTime() - Date.now()) / 60000, 0);
        const livre = minutos !== undefined;
        // Intervalo de datas do período projetado (para buscar o período de comparação).
        let pIni = referencia, pFim = referencia, fatorHist = 1;
        if (livre) {
          const m = minutos as number;
          pIni = de ?? referencia;
          pFim = de ? somarDias(de, Math.round(m / 1440) - 1) : ate ?? somarDias(referencia, Math.max(Math.ceil(m / 1440) - 1, 0));
          if (!de && m <= 1440) fatorHist = m / 1440;
        } else if (periodo === "mes") {
          pIni = primeiroDiaDoMes(referencia);
          const [a, mm] = referencia.split("-").map(Number) as [number, number];
          pFim = new Date(Date.UTC(a, mm, 0)).toISOString().slice(0, 10);
        }

        const mensal = livre ? (minutos as number) > 1440 : periodo === "mes";
        const desde = mensal ? primeiroDiaDoMes(referencia) : undefined;
        const ibms = await resolverIbms(escopo, postos);
        // Fallback: mês anterior fechado, proporcional à duração do período.
        const em = escopoMeta(referencia, true);
        // Meta: dia/semana −7 dias; mês → mês anterior; trimestre/semestre → período anterior; ano → ano anterior.
        const comp = periodoDeComparacao(pIni, pFim);
        const historicoAnos = Promise.all(
          [1].map(() => {
            const hFim = comp.fim;
            const hIni = pIni === pFim ? undefined : comp.ini;
            const consulta = comCache(chaveDeCache("mia:metaAnt", { hIni, hFim, ibms }), false, () =>
              getIndicadores([hFim], ibms, MINUTOS_DIA_FECHADO, hIni),
            )
              .then((x) => (x && x.combustivel.litros > 0 ? { x, rotulo: hIni ? `${hIni} a ${hFim}` : hFim } : null))
              .catch(() => null);
            // Banco lento: desiste em 4 s e usa o mês anterior como meta.
            return Promise.race([consulta, new Promise<null>((r) => setTimeout(() => r(null), 2000))]);
          }),
        );
        const [dados, anos] = await Promise.all([
          comCache(chaveDeCache("mia:ind", { referencia, corte, desde, ibms }), false, () =>
            getIndicadores([referencia], ibms, corte, desde),
          ),
          historicoAnos,
        ]);
        // Fallback só quando a comparação principal falhar, e com limite de 2 s.
        const fallback = anos.some((a) => !!a)
          ? null
          : await Promise.race([
              comCache(chaveDeCache("mia:meta", { em, ibms }), false, () =>
                getIndicadores([em.data], ibms, MINUTOS_DIA_FECHADO, em.desde),
              ).catch(() => null),
              new Promise<null>((r) => setTimeout(() => r(null), 2000)),
            ]);
        let fator: number;
        let rotulo: string;
        if (livre) {
          const m = minutos as number;
          if (mensal) {
            const dec = Number(referencia.slice(8, 10)) - 1 + corte / 1440;
            fator = dec > 0 ? m / 1440 / dec : 0;
          } else {
            fator = corte > 0 ? m / corte : 0;
          }
          rotulo = `${Math.round((m / 60) * 10) / 10} horas (${pIni} a ${pFim})`;
        } else {
          fator = mensal ? fatorMes(referencia, corte) : fatorDia(corte);
          rotulo = mensal ? "fim do mês" : "fim do dia";
        }
        const base = montarProjecao(dados, fator, null);
        const comHist = anos.filter((a): a is NonNullable<typeof a> => !!a);
        let metas: (number | null)[];
        let origemMeta: string;
        if (comHist.length) {
          const porAno = comHist.map((a) => montarProjecao(a.x, fatorHist, null));
          metas = base.map((_, i) => porAno.reduce((s, p) => s + p[i]!.projecao, 0) / porAno.length);
          origemMeta = `${comp.regra} (${comHist.map((a) => a.rotulo).join("; ")})`;
        } else if (fallback) {
          const diasPeriodo = livre ? (minutos as number) / 1440 : mensal ? diffDias(pIni, pFim) : 1;
          const fm = diasPeriodo / Number(em.data.slice(8, 10));
          metas = montarProjecao(fallback, fm, null).map((p) => p.projecao);
          origemMeta = `sem histórico do mesmo período: ${em.label}, proporcional a ${Math.round(diasPeriodo * 10) / 10} dias`;
        } else {
          metas = base.map(() => null);
          origemMeta = "sem histórico para meta";
        }
        return {
          corte: formatCorte(corte),
          periodoProjetado: rotulo,
          origemMeta,
          indicadores: base.map((i, k) => {
            const mv = metas[k] ?? null;
            return {
              indicador: i.label,
              realizado: r2(i.realizado),
              projecao: r2(i.projecao),
              meta: mv === null ? null : r2(mv),
              variacaoPct: mv ? r2(((i.projecao - mv) / Math.abs(mv)) * 100) : null,
            };
          }),
        };
      },
    }),
    indicadores_contabeis: tool({
      description:
        "Indicadores financeiros contábeis lançados no painel (/contabil): ROE, ROIC, margem líquida, margem EBITDA, receita líquida, lucro líquido, EBITDA, EBIT, PL médio, capital investido, NOPAT e WACC. Use para perguntas contábeis/financeiras, não operacionais.",
      inputSchema: z.object({
        periodo: z
          .enum(["mes", "ano"])
          .describe("'mes' = um mês; 'ano' = acumulado do ano até o mês informado"),
        mes: z
          .string()
          .regex(/^\d{4}-\d{2}$/)
          .optional()
          .describe("Mês de referência 'YYYY-MM'; vazio = mês corrente"),
        postos: z.array(z.string()).optional(),
      }),
      execute: async ({ periodo, mes, postos }) => {
        const { lerContabil } = await import("./contabil.server");
        const ibms = await resolverIbms(escopo, postos);
        return lerContabil({ periodo, ...(mes ? { mes } : {}), ...(ibms ? { ibms } : {}) });
      },
    }),

    detalhe_ebitda: tool({
      description:
        "Detalhamento do cálculo de EBITDA feito no painel (/contabil): receita de vendas, deduções, ajuste, custo, ajustes de transporte e gestão, pessoal, administrativas, tributárias, furtos e roubos, apropriação de contratos, participações de empregados, depreciação e os totais (receita operacional líquida, resultado operacional bruto, EBITDA, EBIT). Use quando a pergunta é sobre a composição/linhas do EBITDA.",
      inputSchema: z.object({
        periodo: z
          .enum(["mes", "ano"])
          .describe("'mes' = um mês; 'ano' = acumulado do ano até o mês informado"),
        mes: z
          .string()
          .regex(/^\d{4}-\d{2}$/)
          .optional()
          .describe("Mês de referência 'YYYY-MM'; vazio = mês corrente"),
        postos: z.array(z.string()).optional(),
      }),
      execute: async ({ periodo, mes, postos }) => {
        const { lerDetalheEbitda } = await import("./contabil.server");
        const ibms = await resolverIbms(escopo, postos);
        const { _somas: _, ...r } = (await lerDetalheEbitda({ periodo, ...(mes ? { mes } : {}), ...(ibms ? { ibms } : {}) })) as Record<string, unknown>;
        return r;
      },
    }),

    projecoes_contabeis: tool({
      description:
        "Projeções contábeis de receita bruta, CMV, resultado operacional bruto, despesas totais, EBITDA, EBITDA por litro e resultado final pela média diária do mês corrente. Sem parâmetros: fim do mês, próximos 3 e 6 meses. Para QUALQUER outro período informe dias, ate (YYYY-MM-DD) e/ou de (início, para períodos futuros como 'dezembro' = de 2026-12-01 ate 2026-12-31). Meta (origemMeta): dia = mesmo dia da semana anterior; semana = semana anterior; mês = mês anterior; trimestre/semestre = período anterior de mesma duração; ano = ano anterior; sem dados, mês anterior proporcional.",
      inputSchema: z.object({
        postos: z.array(z.string()).optional(),
        dias: z.number().positive().optional(),
        de: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Início de um período futuro (ex.: 2026-12-01 para dezembro)"),
        ate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      }),
      execute: async ({ postos, dias, ate, de }) => {
        const { lerProjecoes } = await import("./contabil.server");
        const ibms = await resolverIbms(escopo, postos);
        return lerProjecoes({ ...(ibms ? { ibms } : {}), ...(dias ? { dias } : {}), ...(ate ? { ate } : {}), ...(de ? { de } : {}) });
      },
    }),
  };
}

