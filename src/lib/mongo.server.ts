import { MongoClient, type Collection, type Db, type Document } from "mongodb";

type Fonte = "gasMonitor" | "sales";

const ENV_POR_FONTE: Record<Fonte, string> = {
  gasMonitor: "DATABASE_URL_GAS_MONITOR",
  sales: "DATABASE_URLSALES",
};

type Cache = {
  clientes: Partial<Record<Fonte, Promise<MongoClient>>>;
  colecoes: Record<string, Promise<string>>;
};

const globalCache = globalThis as unknown as { __redeflexMongo?: Cache };

function cache(): Cache {
  if (!globalCache.__redeflexMongo) {
    globalCache.__redeflexMongo = { clientes: {}, colecoes: {} };
  }
  return globalCache.__redeflexMongo;
}

function uri(fonte: Fonte): string {
  const nome = ENV_POR_FONTE[fonte];
  const valor = process.env[nome];
  if (!valor) throw new Error(`${nome} não configurado`);
  return valor;
}

function comAuthSource(original: string, authSource: string): string | null {
  try {
    const url = new URL(original);
    if (url.searchParams.get("authSource") === authSource) return null;
    url.searchParams.set("authSource", authSource);
    return url.toString();
  } catch {
    return null;
  }
}

async function conectar(connectionString: string): Promise<MongoClient> {
  return await new MongoClient(connectionString, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 15_000,
  }).connect();
}

async function getClient(fonte: Fonte): Promise<MongoClient> {
  const c = cache();
  if (!c.clientes[fonte]) {
    const original = uri(fonte);
    c.clientes[fonte] = conectar(original)
      .catch(async (erro: unknown) => {
        // Connection strings do Prisma às vezes omitem o authSource.
        const mensagem = erro instanceof Error ? erro.message : String(erro);
        if (!/auth/i.test(mensagem)) throw erro;
        for (const authSource of ["admin", "$external"]) {
          const alternativa = comAuthSource(original, authSource);
          if (!alternativa) continue;
          try {
            return await conectar(alternativa);
          } catch {
            // tenta a próxima
          }
        }
        throw erro;
      })
      .catch((erro) => {
        delete c.clientes[fonte];
        throw erro;
      });
  }
  return c.clientes[fonte]!;
}

async function getDb(fonte: Fonte): Promise<Db> {
  const client = await getClient(fonte);
  // O nome do banco vem do path da connection string.
  return client.db();
}

/**
 * Resolve o nome real da coleção (o Prisma cria com a inicial maiúscula,
 * mas dumps antigos podem estar em minúsculo).
 */
async function resolveColecao(fonte: Fonte, candidatos: string[]): Promise<string> {
  const chave = `${fonte}:${candidatos.join("|")}`;
  const c = cache();
  if (!c.colecoes[chave]) {
    c.colecoes[chave] = (async () => {
      const db = await getDb(fonte);
      const existentes = (await db.listCollections({}, { nameOnly: true }).toArray()).map(
        (col) => col.name,
      );
      for (const candidato of candidatos) {
        const achado = existentes.find((nome) => nome.toLowerCase() === candidato.toLowerCase());
        if (achado) return achado;
      }
      return candidatos[0]!;
    })().catch((erro) => {
      delete c.colecoes[chave];
      throw erro;
    });
  }
  return c.colecoes[chave]!;
}

export async function colecao<T extends Document = Document>(
  fonte: Fonte,
  candidatos: string[],
): Promise<Collection<T>> {
  const db = await getDb(fonte);
  const nome = await resolveColecao(fonte, candidatos);
  return db.collection<T>(nome);
}