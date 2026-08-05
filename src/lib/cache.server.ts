/**
 * Cache de curta duração das consultas agregadas, por chave de escopo
 * (função + aba + seleção + intervalo de datas). Guarda somente o resultado
 * serializável — nunca clientes ou conexões de banco.
 */
type Entrada = { expiraEm: number; valor: unknown };

const TTL_MS = 5 * 60_000;
const LIMITE = 200;
const memoria = new Map<string, Entrada>();

export async function comCache<T>(
  chave: string,
  fresh: boolean,
  fn: () => Promise<T>,
): Promise<T> {
  const agora = Date.now();

  if (!fresh) {
    const atual = memoria.get(chave);
    if (atual && atual.expiraEm > agora) return atual.valor as T;
  }

  const valor = await fn();
  memoria.set(chave, { expiraEm: agora + TTL_MS, valor });

  if (memoria.size > LIMITE) {
    for (const [k, v] of memoria) {
      if (v.expiraEm <= agora) memoria.delete(k);
    }
  }

  return valor;
}

export function chaveDeCache(prefixo: string, dados: unknown): string {
  return `${prefixo}:${JSON.stringify(dados)}`;
}
