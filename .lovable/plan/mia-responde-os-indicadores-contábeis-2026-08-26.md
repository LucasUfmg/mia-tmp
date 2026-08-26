# Mia responde os indicadores contábeis

Os dados preenchidos na tela `/contabil` já são gravados no backend (tabela `contabil_lancamentos`, um registro por posto/mês, incluindo o lançamento "Rede consolidado"). O que falta é a Mia — o agente do WhatsApp via Twilio — poder ler esses lançamentos e responder sobre eles.

## O que a Mia passa a fazer

Nova capacidade: quando o gestor perguntar sobre ROE, ROIC, margem líquida, margem EBITDA, lucro líquido, EBITDA, EBIT, receita líquida, patrimônio líquido ou WACC, a Mia consulta os lançamentos contábeis e responde com os mesmos números da tela `/contabil`.

Exemplos de perguntas atendidas:

- "Qual o ROE de julho?"
- "Como está a margem EBITDA do ano?"
- "ROIC do Posto Central em agosto"
- "O ROIC está acima do WACC?"

Comportamento:

- Período: mês específico (ex.: "julho", "mês passado", "agosto/2026") ou acumulado do ano (YTD). Sem período informado, usa o mês corrente.
- Escopo: respeita os postos autorizados do número de WhatsApp — o gestor só vê os postos liberados para ele; números com acesso à rede inteira usam o lançamento consolidado da rede quando existir, senão a soma dos postos (mesma regra do painel, sem dupla contagem).
- Consolidação idêntica à do painel: fluxos somados, alíquota e WACC ponderados pela receita, índices recalculados sobre os totais — nunca média de percentuais.
- Se não houver lançamento no período/escopo, a Mia diz claramente que os dados contábeis do período ainda não foram lançados no painel, em vez de estimar.
- Fecha com a leitura executiva quando cabe: ROIC vs WACC (criação ou destruição de valor).

## Detalhes técnicos

- Novo helper `src/lib/mia/contabil.server.ts`: lê `contabil_lancamentos` pelo cliente já existente em `src/lib/contabil.server.ts`, filtra por meses e escopo com `filtrarEscopo`/`IBM_REDE` e consolida com `consolidar` de `src/lib/contabil.ts` (reuso, sem duplicar fórmulas).
- Nova ferramenta `indicadores_contabeis` em `src/lib/mia/tools.server.ts`, com entrada `{ periodo: "mes" | "ano", mes?: "YYYY-MM", postos?: string[] }`, resolvendo nomes de postos pelo `resolverIbms` já existente e devolvendo receita líquida, lucro líquido, EBITDA, EBIT, PL médio, capital investido, NOPAT, ROE, ROIC, margens, WACC, meses com lançamento e postos cobertos (valores arredondados). Retorno inclui `semLancamento: true` quando nada foi encontrado.
- `src/lib/mia/prompt.ts`: acrescentar as definições curtas de ROE, ROIC (NOPAT ÷ capital investido médio), margem líquida e margem EBITDA, mais a regra de citar quando o dado contábil não foi lançado. Mantém o prompt enxuto.
- Nenhuma mudança de banco, de gravação ou da tela `/contabil`; a ferramenta é somente leitura, como as outras da Mia.
