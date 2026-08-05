import { MongoClient } from "mongodb";

import type { MongoClientOptions } from "mongodb";

/**
 * Ponte explícita para impedir que o bundle de produção elimine MongoClient
 * ao transformar uma importação dinâmica genérica do pacote CommonJS.
 */
export async function conectarMongo(
  connectionString: string,
  options: MongoClientOptions,
): Promise<MongoClient> {
  return await new MongoClient(connectionString, options).connect();
}