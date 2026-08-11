import type { Client as ClientType } from "pg";

/**
 * Acesso ao Postgres do backend RedeFlex (tabela `ibm_info`).
 *
 * O driver é carregado dinamicamente DENTRO da chamada: no runtime de produção
 * (Cloudflare Workers) nada de I/O pode acontecer no escopo global.
 */
async function novoCliente(ssl: boolean): Promise<ClientType> {
  const url = process.env["REDEFLEX_PG_URL"];
  if (!url) throw new Error("REDEFLEX_PG_URL não configurado");
  const pg = await import("pg");
  const Client = (pg as unknown as { Client?: new (c: unknown) => ClientType }).Client ??
    (pg as unknown as { default: { Client: new (c: unknown) => ClientType } }).default.Client;
  return new Client({
    connectionString: url,
    connectionTimeoutMillis: 5_000,
    query_timeout: 8_000,
    ...(ssl ? { ssl: { rejectUnauthorized: false } } : {}),
  });
}

/** Abre uma conexão, executa a query e fecha. Tenta com e sem SSL. */
export async function consultar<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  let ultimoErro: unknown;
  for (const ssl of [true, false]) {
    let cliente: ClientType | null = null;
    try {
      cliente = await novoCliente(ssl);
      await cliente.connect();
      const resultado = await cliente.query(sql, params as never[]);
      return resultado.rows as T[];
    } catch (erro) {
      ultimoErro = erro;
    } finally {
      try {
        await cliente?.end();
      } catch {
        // conexão já encerrada
      }
    }
  }
  throw ultimoErro instanceof Error ? ultimoErro : new Error(String(ultimoErro));
}
