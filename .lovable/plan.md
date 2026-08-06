# Lançamento do Flex IA — landing de mockup com conversa no WhatsApp

Página nova de apresentação (mockup) para o lançamento do **Flex IA**: o agente de IA que lê os dados do BI RedeFlex e responde qualquer pergunta sobre a operação dos postos, além de entregar insights automáticos.

Como este projeto publica em um único domínio, a página fica em uma rota nova (`/agente`) usando as cores do BI. Quando você quiser um subdomínio próprio (ex.: `ia.redeflexapp.com.br`), a página é duplicada para um projeto separado sem retrabalho.

## Estrutura da página (referência: treinador.id)

1. **Hero em duas colunas** — selo "Novo produto", título forte ("Pergunte. O Flex IA responde com os dados do seu posto."), subtítulo, dois botões (Quero conhecer / Ver conversa) e prova social discreta. À direita, o mockup de celular.
2. **Mockup de WhatsApp** — moldura de celular, cabeçalho verde com avatar "Flex IA · online", fundo de conversa, bolhas do usuário (à direita) e da IA (à esquerda) com horário e checks de leitura. A conversa "digita" em sequência ao carregar a página (animação de entrada + indicador de "digitando…"), depois fica estática.
3. **Como funciona** — 3 passos: conecta no BI → você pergunta no WhatsApp → recebe resposta e insight.
4. **O que ele responde** — grade de 6 cartões: volume vendido, margem M/LT, ticket médio (TMC/TMV), comparativo com a semana anterior, projeção do mês e ranking de postos.
5. **Insights proativos** — bloco mostrando alertas que a IA envia sem ser perguntada (queda de galonagem, margem fora do padrão, posto abaixo da meta).
6. **CTA final + rodapé** — chamada de contato/lista de espera e rodapé RedeFlex.

## Conversa simulada (mistura operacional + resultado)

- "Quanto vendi de combustível hoje?" → volume, faturamento e horário de corte.
- "Como está minha margem?" → M/LT e LB%, com comparação com a média da rede.
- "E comparado com a semana passada?" → variação percentual com seta de alta/queda.
- "Qual posto vendeu menos hoje?" → nome do posto, volume e sugestão de ação.
- "Projeção do mês?" → valor projetado de combustível e produto.
- Mensagem final da IA não solicitada: um insight proativo.

Todos os números são fictícios, coerentes com as faixas do BI, e o rodapé da página deixa claro que é uma demonstração.

## Detalhes técnicos

- `src/routes/agente.tsx`: rota nova com `head()` próprio (title, description, og:title, og:description, og:type, twitter:card).
- `src/components/flexia/`: `Hero.tsx`, `WhatsappMockup.tsx`, `ChatBubble.tsx`, `HowItWorks.tsx`, `Capabilities.tsx`, `ProactiveInsights.tsx`, `LaunchCta.tsx`.
- `src/data/flexia.ts`: roteiro da conversa (`autor`, `texto`, `hora`, `atraso`) e conteúdo das seções — nenhum dado real do Mongo é consultado; a página é 100% estática.
- Cores via tokens existentes (`brand`, `brand-soft`, `sidebar`, `surface-muted`); tokens novos apenas para o verde do WhatsApp, adicionados em `src/styles.css` em `oklch`.
- Animação de entrada das bolhas com CSS/Tailwind (delay progressivo) — sem novas dependências.
- O dashboard atual (`/`) não é alterado.
