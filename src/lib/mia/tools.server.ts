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
  listarLojas,
} from "../redeflex-mongo.server";
import { corteAgora, diaDoMes, diasNoMes, formatCorte, hojeSaoPaulo, primeiroDiaDoMes } from "./datas";

/** Escopo de dados do contato: IBMs autorizados (vazio = rede inteira). */
export type Escopo = { ibms: string[] };

const escopoEnum = z.enum(["hoje", "mes"]);
type EscopoPeriodo = z.infer<typeof escopoEnum>;

const r2 = (n: number) => Math.round(n * 100) / 100;
const r0 = (n: number) => Math.round(n);

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
      execute: async ({ escopo: tipo, postos }) => {
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
      },
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

    projecao_mes: tool({
      description:
        "Projeção de fechamento do mês (litros de combustível e receita de produtos) com base no acumulado até agora.",
      inputSchema: z.object({ postos: z.array(z.string()).optional() }),
      execute: async ({ postos }) => {
        const referencia = hojeSaoPaulo();
        const corte = corteAgora();
        const desde = primeiroDiaDoMes(referencia);
        const ibms = await resolverIbms(escopo, postos);
        const dados = await comCache(
          chaveDeCache("mia:ind", { referencia, corte, desde, ibms }),
          false,
          () => getIndicadores([referencia], ibms, corte, desde),
        );
        const decorridos = diaDoMes(referencia) - 1 + corte / 1440;
        const fator = decorridos > 0 ? diasNoMes(referencia) / decorridos : 0;
        return {
          acumulado: {
            litros: r0(dados.combustivel.litros),
            produtos: r0(dados.produto.receita),
          },
          projecao: {
            litros: r0(dados.combustivel.litros * fator),
            produtos: r0(dados.produto.receita * fator),
          },
          corte: formatCorte(corte),
        };
      },
    }),
  };
}
