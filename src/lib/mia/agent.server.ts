import { stepCountIs, streamText } from "ai";

import { createLovableAiGatewayProvider } from "../ai-gateway.server";
import { comSessao } from "../mongo.server";
import { corteAgora, formatCorte, hojeSaoPaulo } from "./datas";
import { promptSistema } from "./prompt";
import { criarFerramentas, lerIndicadores, type Escopo } from "./tools.server";
import { historico as carregarHistorico, registrar, type Contato } from "./store.server";

/** Modelo barato por padrão; sobe para o Flash só em perguntas longas/analíticas. */
const MODELO_PADRAO = "google/gemini-3.1-flash-lite";
const MODELO_COMPLEXO = "google/gemini-3.6-flash";

const PALAVRAS_COMPLEXAS = /(por que|porqu|explica|an[aá]lise|tend[eê]ncia|estrat[eé]gia|compare|sugest)/i;

function escolherModelo(pergunta: string): string {
  if (pergunta.length > 180 || PALAVRAS_COMPLEXAS.test(pergunta)) return MODELO_COMPLEXO;
  return MODELO_PADRAO;
}

/** Atalhos sem IA: comandos frequentes respondidos por template (custo zero). */
export function atalho(pergunta: string): "resumo" | "ajuda" | null {
  const t = pergunta.trim().toLowerCase();
  if (["ajuda", "menu", "oi", "olá", "ola", "bom dia", "boa tarde", "boa noite"].includes(t))
    return "ajuda";
  if (["resumo", "hoje", "status"].includes(t)) return "resumo";
  return null;
}

export const TEXTO_AJUDA = [
  "Oi! Eu sou a *Mia*, sua analista de dados da RedeFlex. 🤖",
  "",
  "Pode perguntar do jeito que você falaria com o gerente. Por exemplo:",
  "• Quanto vendi de combustível hoje?",
  "• Como está minha margem?",
  "• E comparado com a semana passada?",
  "• Qual posto vendeu menos hoje?",
  "• Projeção do mês",
  "",
  "Digite *resumo* para o panorama do dia.",
].join("\n");

/** Panorama do dia direto das ferramentas, sem passar pelo modelo. */
export async function resumoDoDia(escopo: Escopo): Promise<string> {
  return await comSessao(async () => {
    const dados = await lerIndicadores(escopo, "hoje");
    const brl = (n: number) =>
      n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
    const litros = (n: number) => `${n.toLocaleString("pt-BR")} L`;
    return [
      `📊 *Resumo até ${dados.corte}*`,
      `⛽ Galonagem: *${litros(dados.combustivel.litros)}*`,
      `💰 Faturamento: *${brl(dados.combustivel.faturamento)}*`,
      `📈 M/LT: *R$ ${dados.combustivel.mlt.toFixed(2)}* · LB *${dados.combustivel.lbPercent.toFixed(1)}%*`,
      `🛒 Produtos: *${brl(dados.produto.receita)}* · TMP R$ ${dados.produto.tmp.toFixed(2)}`,
    ].join("\n");
  });
}

/** Responde uma pergunta consultando os dados reais da rede. */
export async function responderPergunta(contato: Contato, pergunta: string): Promise<string> {
  const chave = process.env["LOVABLE_API_KEY"];
  if (!chave) throw new Error("LOVABLE_API_KEY não configurada");

  const escopo: Escopo = { ibms: contato.ibms ?? [] };
  const anteriores = await carregarHistorico(contato.telefone);

  const gateway = createLovableAiGatewayProvider(chave);
  const modelo = gateway(escolherModelo(pergunta));

  const texto = await comSessao(async () => {
    const resultado = streamText({
      model: modelo,
      system: promptSistema({
        nome: contato.nome,
        escopo:
          escopo.ibms.length === 0
            ? "rede inteira"
            : `${escopo.ibms.length} posto(s) autorizado(s) — use listar_postos para os nomes`,
        agora: `${hojeSaoPaulo()} ${formatCorte(corteAgora())}`,
      }),
      messages: [
        ...anteriores.map((m) => ({
          role: m.papel === "user" ? ("user" as const) : ("assistant" as const),
          content: m.texto,
        })),
        { role: "user" as const, content: pergunta },
      ],
      tools: criarFerramentas(escopo),
      stopWhen: stepCountIs(50),
    });

    return await resultado.text;
  });

  const resposta = texto.trim() || "Não consegui apurar esse número agora. Pode repetir a pergunta?";
  await registrar(contato.telefone, "assistant", resposta);
  return resposta;
}
