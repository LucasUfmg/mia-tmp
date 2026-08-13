# Mia de verdade: agente de IA no WhatsApp sobre os dados da rede

Hoje `/agente` é só um mockup. Este plano cria a Mia funcional: o cliente manda uma pergunta no WhatsApp, a IA consulta os dados reais (Mongo/Postgres, as mesmas funções do painel) e responde com número, comparação e sugestão.

## Ponto importante: não é "treinar" a IA

Treinar (fine-tuning) um modelo com seus dados é caro, lento e fica desatualizado a cada venda nova. O padrão correto e mais barato é **agente com ferramentas (function calling)**: o modelo não guarda seus dados, ele aprende a *chamar* suas funções (`getIndicadores`, `getIndicadoresPorPosto`, `getCategoriasCombustivel`, `getFuelMonths`…) e escreve a resposta a partir do resultado. Vantagens: dado sempre on-time, nada de vazamento de base para o modelo, custo por pergunta baixíssimo.

## Arquitetura

```text
WhatsApp -> webhook /api/public/whatsapp -> valida assinatura
   -> monta contexto (histórico curto + postos permitidos)
   -> LLM com ferramentas (Lovable AI Gateway)
        <-> ferramentas = funções que já leem Mongo/Postgres
   -> resposta em texto curto -> envia de volta pelo WhatsApp
```

Etapas:

1. **Canal WhatsApp** — Twilio (conector já disponível na Lovable) ou Meta WhatsApp Cloud API. Recomendo **Twilio** pela integração pronta; exige número verificado. Rota `src/routes/api/public/whatsapp.ts` com verificação de assinatura.
2. **Identificação do usuário** — tabela no banco ligando telefone -> postos (IBMs) que ele pode ver. Número desconhecido recebe recusa educada. Sem isso qualquer pessoa com o número leria os dados da rede.
3. **Camada de ferramentas** — `src/lib/mia/tools.ts` expondo 5–6 ferramentas com schema Zod enxuto: indicadores da rede/posto, comparativo semanal, meses, ranking de postos, distribuição por combustível/produto. Cada ferramenta reaproveita `redeflex-mongo.server.ts` e respeita os IBMs permitidos.
4. **Agente** — `src/lib/mia/agent.server.ts` com AI SDK + Lovable AI Gateway, prompt em português com as definições de M/LT, LB, TMC, TMV, TMP (as mesmas do manual), regra de sempre citar o horário de corte e nunca inventar número.
5. **Histórico** — tabela de mensagens por telefone; enviar só as últimas ~6 mensagens ao modelo (corte de custo).
6. **Insights proativos (fase 2)** — job diário que roda as mesmas ferramentas, detecta desvio (galonagem/M/LT fora da faixa) e dispara mensagem. Regra em código, IA só escreve o texto.
7. **Mockup `/agente`** — mantido como landing; ganha um aviso de que a demonstração agora tem produto real.

## Qual LLM e quanto custa

Valores aproximados por **1 milhão de tokens** (entrada/saída) via Lovable AI Gateway; use como ordem de grandeza, não como tabela de preço oficial:

| Modelo | Entrada | Saída | Quando usar |
| --- | --- | --- | --- |
| `google/gemini-3.1-flash-lite` | ~US$ 0,10 | ~US$ 0,40 | **Recomendado para começar** — mais barato, rápido, bom em português e em chamar ferramentas |
| `openai/gpt-5.4-nano` | ~US$ 0,05–0,10 | ~US$ 0,40 | Alternativa igualmente barata |
| `google/gemini-3.6-flash` | ~US$ 0,30 | ~US$ 2,50 | Se a Flash-Lite errar em perguntas mais complexas |
| `openai/gpt-5.4-mini` | ~US$ 0,25 | ~US$ 2,00 | Fallback de qualidade |

Conta realista de uma pergunta: ~1.500 tokens de entrada (prompt + histórico + resultado da ferramenta) e ~200 de saída. Na Flash-Lite isso dá cerca de **US$ 0,0002 por pergunta** — ~US$ 0,25 a cada mil perguntas. O custo dominante do projeto não é o modelo, é o WhatsApp (Twilio cobra por mensagem/conversa).

## Como deixar o mais barato possível

- Modelo padrão **Flash-Lite / nano**, com escalada para um modelo maior só quando a pergunta pede raciocínio (roteador simples por tamanho/tipo da pergunta).
- **Prompt de sistema curto** e ferramentas com descrições enxutas — é o que mais infla a entrada.
- **Resultado da ferramenta resumido**: mandar só os números necessários, nunca linhas cruas do Mongo.
- **Histórico limitado** a poucas mensagens.
- **Cache** das perguntas repetidas do dia (o `cache.server.ts` já existe) — pergunta idêntica no mesmo horário de corte não paga LLM.
- **Atalhos sem IA**: comandos como "resumo", "hoje", "margem" respondidos por template direto, custo zero de token.
- **Teto de mensagens por telefone/dia** para evitar surpresa na fatura.

## Detalhes técnicos

- `src/routes/api/public/whatsapp.ts` (webhook, verificação de assinatura, resposta rápida 200).
- `src/lib/mia/agent.server.ts`, `src/lib/mia/tools.ts`, `src/lib/mia/prompt.ts`, `src/lib/mia/whatsapp.server.ts` (envio).
- Backend de dados: reaproveita `mongo.server.ts` / `redeflex-mongo.server.ts` / `redeflex-postgres.server.ts` sem alteração de cálculo.
- Persistência (telefone autorizado, IBMs, histórico, limites) precisa do **Lovable Cloud** ativado.
- Secrets: `LOVABLE_API_KEY` (AI Gateway) e as credenciais do canal WhatsApp via conector.
