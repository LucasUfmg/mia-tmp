export type Mensagem = {
  autor: "user" | "ia";
  texto: string;
  hora: string;
};

/** Roteiro fictício da conversa de demonstração (nenhum dado real do BI). */
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
    titulo: "Conecta no seu BI",
    texto: "O Flex IA lê os mesmos dados do painel RedeFlex — galonagem, produtos, margem e postos.",
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
