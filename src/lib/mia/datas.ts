/** Helpers de data no fuso de São Paulo, usados pelas ferramentas da Mia. */

export function hojeSaoPaulo(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Minutos decorridos do dia (corte on-time). */
export function corteAgora(): number {
  const [hora, minuto] = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date())
    .split(":")
    .map(Number);
  return (hora ?? 0) * 60 + (minuto ?? 0);
}

export function formatCorte(minutos: number): string {
  const h = String(Math.floor(minutos / 60)).padStart(2, "0");
  const m = String(minutos % 60).padStart(2, "0");
  return `${h}:${m}`;
}

export function primeiroDiaDoMes(referencia: string): string {
  const [ano, mes] = referencia.split("-");
  return `${ano}-${mes}-01`;
}

export function diasNoMes(referencia: string): number {
  const base = new Date(`${referencia}T00:00:00Z`);
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate();
}

export function diaDoMes(referencia: string): number {
  return new Date(`${referencia}T00:00:00Z`).getUTCDate();
}
