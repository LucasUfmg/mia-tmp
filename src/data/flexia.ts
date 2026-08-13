export type Mensagem = {
  autor: "user" | "ia";
  texto: string;
  hora: string;
};

/** Roteiro fictício da conversa de demonstração (nenhum dado real). */
export const conversa: Mensagem[] = [
  { autor: "user", texto: "Bom dia! Quanto vendi de combustível hoje?", hora: "09:12" },
  {
    autor: "ia",
    texto:
      "Bom dia, Rodrigo! 🚀\nAté as *09:10* a rede vendeu *38.412 L*, faturando *R$ 241.680*.\nO Posto Centro lidera com 11.240 L.",
    hora: "09:12",
  },
  { autor: "user", texto: "E a minha margem?", hora: "09:13" },
  {
    autor: "ia",
    texto:
      "Margem média *R$ 0,42 / litro* (M/LT) e *LB de 11,3%*.\nEstá *R$ 0,03* acima da média dos últimos 7 dias — a alta veio do S-10.",
    hora: "09:13",
  },
  { autor: "user", texto: "Comparado com a mesma hora da semana passada?", hora: "09:14" },
  {
    autor: "ia",
    texto:
      "📈 Galonagem *+7,4%* (35.760 L → 38.412 L)\n📉 Produtos *-2,1%* (R$ 18.940 → R$ 18.542)\nComparação feita no mesmo horário de corte.",
    hora: "09:14",
  },
  { autor: "user", texto: "Qual posto vendeu menos hoje?", hora: "09:15" },
  {
    autor: "ia",
    texto:
      "*Posto Rodovia* — 3.980 L, 26% abaixo da média dele para uma quinta-feira.\nO ticket médio caiu para *R$ 96* (TMC). Vale checar bomba e turno da manhã.",
    hora: "09:15",
  },
  { autor: "user", texto: "Me dá a projeção do mês", hora: "09:16" },
  {
    autor: "ia",
    texto:
      "Projeção fechando agosto:\n⛽ Combustível *R$ 7,42 mi*\n🛒 Produtos *R$ 612 mil*\nRitmo *4,1%* acima de julho.",
    hora: "09:16",
  },
  {
    autor: "ia",
    texto:
      "🔔 Aviso automático: nas últimas 2 horas o *Posto Norte* está 18% abaixo do previsto na gasolina comum. Quer que eu monitore e te avise às 12h?",
    hora: "09:41",
  },
];

export const passos = [
  {
    titulo: "Conecta na sua base",
    texto: "A Mia lê direto do banco de dados do seu posto — galonagem, produtos, margem e postos.",
  },
  {
    titulo: "Você pergunta no WhatsApp",
    texto: "Sem login, sem relatório. Pergunta em português, do jeito que você falaria com o gerente.",
  },
  {
    titulo: "Recebe resposta e insight",
    texto: "Número exato, comparação com o período anterior e a próxima ação sugerida.",
  },
];

export const capacidades = [
  { titulo: "Volume vendido", texto: "Litros por posto, turno ou combustível, on-time." },
  { titulo: "Margem M/LT e LB", texto: "Margem por litro e lucro bruto percentual em segundos." },
  { titulo: "Ticket médio", texto: "TMC, TMV e TMP por posto ou pela rede inteira." },
  { titulo: "Comparativo semanal", texto: "Mesmo dia da semana, mesmo horário — alta ou queda." },
  { titulo: "Projeção do mês", texto: "Fechamento projetado de combustível e produtos." },
  { titulo: "Ranking de postos", texto: "Quem puxa o resultado e quem está travando." },
];

export const insights = [
  {
    titulo: "Queda de galonagem",
    texto: "Alerta quando um posto foge do padrão dele para aquele dia e horário.",
  },
  {
    titulo: "Margem fora do padrão",
    texto: "Avisa se o M/LT cai abaixo da faixa saudável do produto.",
  },
  {
    titulo: "Posto abaixo da meta",
    texto: "Acompanha o ritmo do mês e sinaliza quem não fecha no projetado.",
  },
];

/** Estimativas de economia — cenário de referência, editável. */
export const economias = [
  {
    titulo: "R$ 3.000 por mês em margem",
    texto:
      "Uma queda de R$ 0,02 no M/LT passa despercebida no fechamento. Em 150 mil litros/mês são R$ 3.000 que somem — a Mia avisa no mesmo dia.",
  },
  {
    titulo: "R$ 1.800 em desvio de bomba e turno",
    texto:
      "Turno com galonagem 20% abaixo do padrão é sinalizado na hora, antes de virar prejuízo do mês inteiro.",
  },
  {
    titulo: "20 horas/mês do gerente",
    texto:
      "Fim do vai e volta de planilha e print no grupo: a resposta chega em segundos, no WhatsApp de quem decide.",
  },
  {
    titulo: "Ruptura e ticket de loja",
    texto:
      "TMP e cupons acompanhados diariamente mostram onde a conveniência está deixando dinheiro na mesa.",
  },
];

export const beneficiosPlano = [
  "Perguntas ilimitadas no WhatsApp, 24h por dia",
  "Dados on-time da base dos seus postos — galonagem, margem, ticket e produtos",
  "Comparativo com a semana anterior e projeção do mês",
  "Ranking dos postos e alertas proativos automáticos",
  "Acesso ao painel RedeFlex no navegador",
  "Sem taxa de instalação, sem fidelidade — cancela quando quiser",
];

export const faq = [
  {
    p: "Como a Mia sabe os dados do meu posto?",
    r: "Ela lê direto do banco de dados do seu posto. Nada é digitado à mão: assim que o abastecimento e a venda são registrados, a Mia já responde com o número atualizado.",
  },
  {
    p: "Preciso instalar algo?",
    r: "Não. É só liberar o número de WhatsApp de quem vai perguntar. Em minutos a Mia está respondendo.",
  },
  {
    p: "Quantas pessoas podem usar?",
    r: "Você libera os números que quiser (dono, gerente, supervisor) e define quais postos cada um pode consultar.",
  },
  {
    p: "R$ 19,90 é por posto?",
    r: "Sim, R$ 19,90 por posto por mês. Uma rede com 10 postos paga R$ 199,00 — menos do que um único dia de margem perdida.",
  },
];
