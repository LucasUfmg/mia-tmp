/**
 * Transformações dos payloads do micro-serviço RedeFlex.
 *
 * A API devolve objetos cuja chave é a data ("2025-11-28") no caso da rede,
 * ou a composição IBM + data ("00000000291901_2025-11-28") no caso por posto.
 */

export const REDE_ID = "REDE";

export type SeriePonto = {
  postoId: string;
  data: string;
  valor: number;
};

/** Converte o objeto da API no array usado pela visualização. */
export function parseKeyedSeries(payload: Record<string, unknown> | null | undefined): SeriePonto[] {
  if (!payload) return [];

  const pontos: SeriePonto[] = Object.entries(payload).map(([chave, bruto]) => {
    const separador = chave.lastIndexOf("_");
    const temPosto = separador > 0;
    const postoId = temPosto ? chave.slice(0, separador) : REDE_ID;
    const data = temPosto ? chave.slice(separador + 1) : chave;
    const valor = typeof bruto === "number" ? bruto : Number(bruto);

    return { postoId, data, valor: Number.isFinite(valor) ? valor : 0 };
  });

  return pontos.sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
}

/** Soma os valores por data, opcionalmente restringindo a um ou vários postos. */
export function groupByDate(
  pontos: SeriePonto[],
  postoId?: string | string[],
): Record<string, number> {
  const permitidos =
    postoId === undefined
      ? null
      : new Set(Array.isArray(postoId) ? postoId.filter(Boolean) : [postoId]);
  return pontos.reduce<Record<string, number>>((acc, ponto) => {
    if (permitidos && permitidos.size > 0 && !permitidos.has(ponto.postoId)) return acc;
    acc[ponto.data] = (acc[ponto.data] ?? 0) + ponto.valor;
    return acc;
  }, {});
}

/** IBMs únicos presentes nos dados recebidos (exclui o agregado da rede). */
export function extractPostoIds(pontos: SeriePonto[]): string[] {
  return [...new Set(pontos.map((p) => p.postoId))].filter((id) => id !== REDE_ID).sort();
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Datas do mesmo dia da semana: a referência e as `count - 1` semanas anteriores. */
export function sameWeekdayDates(referencia: string, count = 4): string[] {
  const base = new Date(`${referencia}T00:00:00Z`);
  return [...Array(count).keys()]
    .map((i) => {
      const d = new Date(base);
      d.setUTCDate(d.getUTCDate() - i * 7);
      return toISODate(d);
    })
    .reverse();
}

/** Todas as datas do primeiro dia do mês até a referência. */
export function monthToDateDates(referencia: string): string[] {
  const base = new Date(`${referencia}T00:00:00Z`);
  const dias = base.getUTCDate();
  return [...Array(dias).keys()].map((i) => {
    const d = new Date(base);
    d.setUTCDate(i + 1);
    return toISODate(d);
  });
}

export function daysInMonth(referencia: string): number {
  const base = new Date(`${referencia}T00:00:00Z`);
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate();
}

export type MonthRange = {
  label: string;
  diasCompletos: string[];
  diaParcial: string;
};

/**
 * Intervalos "mesmo período" do mês da referência e dos meses anteriores:
 * dia 1 até o mesmo dia (limitado ao último dia daquele mês).
 */
export function monthRanges(referencia: string, count = 4): MonthRange[] {
  const base = new Date(`${referencia}T00:00:00Z`);
  const dia = base.getUTCDate();

  return [...Array(count).keys()]
    .map((i) => {
      const ano = base.getUTCFullYear();
      const mes = base.getUTCMonth() - i;
      const primeiro = new Date(Date.UTC(ano, mes, 1));
      const ultimoDia = new Date(
        Date.UTC(primeiro.getUTCFullYear(), primeiro.getUTCMonth() + 1, 0),
      ).getUTCDate();
      const fim = Math.min(dia, ultimoDia);
      const datas = [...Array(fim).keys()].map((d) =>
        toISODate(new Date(Date.UTC(primeiro.getUTCFullYear(), primeiro.getUTCMonth(), d + 1))),
      );
      const diaParcial = datas[datas.length - 1] ?? toISODate(primeiro);
      return {
        label: `${String(primeiro.getUTCMonth() + 1).padStart(2, "0")}/${primeiro.getUTCFullYear()}`,
        diasCompletos: datas.slice(0, -1),
        diaParcial,
      };
    })
    .reverse();
}

/** Projeta o total do mês a partir do acumulado até a data de referência. */
export function projectMonth(acumulado: number, referencia: string): number {
  const base = new Date(`${referencia}T00:00:00Z`);
  const diaAtual = base.getUTCDate();
  if (diaAtual <= 0) return 0;
  return (acumulado / diaAtual) * daysInMonth(referencia);
}

/** Variação percentual entre dois valores; null quando não há base de comparação. */
export function variacao(atual: number, anterior: number | undefined): number | null {
  if (anterior === undefined || anterior === 0) return null;
  return ((atual - anterior) / anterior) * 100;
}

export function formatPostoLabel(postoId: string): string {
  return `Posto ${postoId.replace(/^0+/, "") || postoId}`;
}
