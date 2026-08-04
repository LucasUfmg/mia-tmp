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

async function getClient(fonte: Fonte): Promise<MongoClient> {
  const c = cache();
  if (!c.clientes[fonte]) {
    c.clientes[fonte] = new MongoClient(uri(fonte), {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 15_000,
    })
      .connect()
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