/** Projeção e meta da Visão Geral — compartilhado entre painel e Mia. */
import type { Indicadores } from "./redeflex-dashboard";

export type ItemProjecao = {
  chave: string;
  label: string;
  formato: "litros" | "reais" | "reais2" | "pct" | "num" | "num2";
  realizado: number;
  projecao: number;
  meta: number | null;
  variacaoPct: number | null;
};

type Volumes = {
  litros: number;
  receitaComb: number;
  lucroComb: number;
  atendimentos: number;
  receitaProd: number;
  cupons: number;
};

const volumesDe = (i: Indicadores): Volumes => ({
  litros: i.combustivel.litros,
  receitaComb: i.combustivel.receita,
  lucroComb: i.combustivel.lucroBruto,
  atendimentos: i.combustivel.atendimentos,
  receitaProd: i.produto.receita,
  cupons: i.produto.cupons,
});

const div = (a: number, b: number) => (b ? a / b : 0);

function itensDe(v: Volumes) {
  return {
    galonagem: v.litros,
    produto: v.receitaProd,
    mlt: div(v.lucroComb, v.litros),
    lb: div(v.lucroComb, v.receitaComb) * 100,
    tmv: div(v.litros, v.atendimentos),
    tmc: div(v.receitaComb, v.atendimentos),
    tmp: div(v.receitaProd, v.cupons),
    cupons: v.cupons,
  };
}

const rotulos: { chave: keyof ReturnType<typeof itensDe>; label: string; formato: ItemProjecao["formato"] }[] = [
  { chave: "galonagem", label: "Galonagem (L)", formato: "litros" },
  { chave: "produto", label: "Produto (R$)", formato: "reais" },
  { chave: "mlt", label: "M/LT", formato: "reais2" },
  { chave: "lb", label: "LB", formato: "pct" },
  { chave: "tmv", label: "TMV (L)", formato: "num2" },
  { chave: "tmc", label: "TMC", formato: "reais2" },
  { chave: "tmp", label: "TMP", formato: "reais2" },
  { chave: "cupons", label: "Cupons", formato: "num" },
];

/** Diário: horas do dia ÷ horas decorridas (realizado + média × horas restantes). */
export function fatorDia(minutosDecorridos: number): number {
  return minutosDecorridos > 0 ? 1440 / minutosDecorridos : 0;
}

/** Mensal: dias do mês ÷ dias decorridos (contando a hora atual). */
export function fatorMes(referencia: string, minutosDecorridos: number): number {
  const base = new Date(`${referencia}T00:00:00Z`);
  const dias = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate();
  const decorridos = base.getUTCDate() - 1 + minutosDecorridos / 1440;
  return decorridos > 0 ? dias / decorridos : 0;
}

export function montarProjecao(
  atual: Indicadores,
  fator: number,
  meta: Indicadores | null,
): ItemProjecao[] {
  const v = volumesDe(atual);
  const proj = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, x * fator])) as Volumes;
  const r = itensDe(v);
  const p = itensDe(proj);
  const m = meta ? itensDe(volumesDe(meta)) : null;
  return rotulos.map(({ chave, label, formato }) => {
    const mv = m ? m[chave] : null;
    return {
      chave,
      label,
      formato,
      realizado: r[chave],
      projecao: p[chave],
      meta: mv,
      variacaoPct: mv ? ((p[chave] - mv) / Math.abs(mv)) * 100 : null,
    };
  });
}

/** Datas para buscar a meta (sempre fechada, corte 23:59). */
export function escopoMeta(referencia: string, mensal: boolean): { data: string; desde?: string; label: string } {
  const d = new Date(`${referencia}T00:00:00Z`);
  if (mensal) {
    const ultimo = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 0));
    const data = ultimo.toISOString().slice(0, 10);
    const [a, mm] = data.split("-");
    return { data, desde: `${a}-${mm}-01`, label: `mês ${mm}/${a} fechado` };
  }
  d.setUTCDate(d.getUTCDate() - 7);
  const data = d.toISOString().slice(0, 10);
  const [, mm, dd] = data.split("-");
  return { data, label: `${dd}/${mm} (mesmo dia da semana anterior) fechado` };
}

export const MINUTOS_DIA_FECHADO = 1439;
