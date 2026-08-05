import { AsyncLocalStorage } from "node:async_hooks";

import type { Collection, Db, Document, MongoClient as MongoClientType } from "mongodb";

type Fonte = "gasMonitor" | "sales" | "lbc";

const ENV_POR_FONTE: Record<Fonte, string> = {
  gasMonitor: "DATABASE_URL_GAS_MONITOR",
  sales: "DATABASE_URLSALES",
  // Cadastros (lojas, combustíveis, grupos de produto) vivem no mesmo cluster.
  lbc: "DATABASE_URL_GAS_MONITOR",
};

/**
 * Sessão por requisição. No runtime de produção (Cloudflare Workers) não é
 * permitido reaproveitar I/O entre requisições — conexões guardadas em
 * `globalThis` disparam "Disallowed operation called within global scope".
 */
type Sessao = {
  clientes: Map<Fonte, Promise<MongoClientType>>;
  colecoes: Map<string, Promise<string>>;
};

const sessaoAtual = new AsyncLocalStorage<Sessao>();

function cache(): Sessao {
  const sessao = sessaoAtual.getStore();
  if (!sessao) {
    throw new Error("Sessão Mongo não iniciada — envolva a chamada em comSessao()");
  }
  return sessao;
}

/** Abre uma sessão de banco para a requisição atual e fecha tudo no final. */
export async function comSessao<T>(fn: () => Promise<T>): Promise<T> {
  const sessao: Sessao = { clientes: new Map(), colecoes: new Map() };
  try {
    return await sessaoAtual.run(sessao, fn);
  } finally {
    await Promise.allSettled(
      [...sessao.clientes.values()].map(async (promessa) => {
        try {
          await (await promessa).close();
        } catch {
          // conexão já encerrada
        }
      }),
    );
  }
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

async function conectar(connectionString: string): Promise<MongoClientType> {
  // A importação runtime precisa acontecer dentro da requisição. Importar o
  // driver no topo do módulo inicializa I/O durante o bootstrap do Worker.
  const mod = (await import("mongodb")) as unknown as {
    MongoClient?: typeof MongoClientType;
    default?: { MongoClient?: typeof MongoClientType };
  };
  // No bundle do runtime publicado o driver chega como CommonJS interoperado,
  // então o construtor pode vir em `default` em vez do export nomeado.
  const MongoClient = mod.MongoClient ?? mod.default?.MongoClient;
  if (typeof MongoClient !== "function") {
    throw new Error("Driver do MongoDB indisponível: construtor MongoClient não encontrado");
  }
  return await new MongoClient(connectionString, {
    maxPoolSize: 1,
    serverSelectionTimeoutMS: 8_000,
  }).connect();
}

async function getClient(fonte: Fonte): Promise<MongoClientType> {
  const c = cache();
  if (!c.clientes.has(fonte)) {
    const original = uri(fonte);
    const promessa = conectar(original)
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
        c.clientes.delete(fonte);
        throw erro;
      });
    c.clientes.set(fonte, promessa);
  }
  const cliente = c.clientes.get(fonte);
  if (!cliente) throw new Error(`Cliente Mongo não inicializado para ${fonte}`);
  return await cliente;
}

const DB_FALLBACK: Record<Fonte, string> = {
  gasMonitor: "GasMonitor",
  sales: "SalesMonitor",
  lbc: "LBCBi",
};

function nomeDoBanco(fonte: Fonte): string | undefined {
  const ENV_DB: Record<Fonte, string> = {
    gasMonitor: "MONGODB_DB_GAS_MONITOR",
    sales: "MONGODB_DB_SALES",
    lbc: "MONGODB_DB_LBC",
  };
  const explicito = process.env[ENV_DB[fonte]];
  if (explicito) return explicito;
  // O cadastro sempre mora no banco LBCBi, independente do path da URI.
  if (fonte === "lbc") return DB_FALLBACK.lbc;
  try {
    const path = new URL(uri(fonte)).pathname.replace(/^\//, "");
    if (path) return decodeURIComponent(path);
  } catch {
    // segue para o fallback
  }
  return DB_FALLBACK[fonte];
}

async function getDb(fonte: Fonte): Promise<Db> {
  const client = await getClient(fonte);
  // O nome do banco vem do path da connection string (ou do env explícito).
  return client.db(nomeDoBanco(fonte));
}

/**
 * Resolve o nome real da coleção (o Prisma cria com a inicial maiúscula,
 * mas dumps antigos podem estar em minúsculo).
 */
async function resolveColecao(fonte: Fonte, candidatos: string[]): Promise<string> {
  const chave = `${fonte}:${candidatos.join("|")}`;
  const c = cache();
  if (!c.colecoes.has(chave)) {
    const promessa = (async () => {
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
      c.colecoes.delete(chave);
      throw erro;
    });
    c.colecoes.set(chave, promessa);
  }
  return await c.colecoes.get(chave)!;
}

export async function colecao<T extends Document = Document>(
  fonte: Fonte,
  candidatos: string[],
): Promise<Collection<T>> {
  const db = await getDb(fonte);
  const nome = await resolveColecao(fonte, candidatos);
  return db.collection<T>(nome);
}