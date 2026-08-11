# Deixar o "vs. rede" mais claro no balão do posto

O rótulo "vs. rede" não explica com o que o posto está sendo comparado. Ele passa a dizer explicitamente que a comparação é com a média de M/LT da rede no período.

## O que muda

- No balão de cada posto, a linha "vs. rede" vira **"vs. média da rede"**, mantendo o mesmo valor percentual e as mesmas cores (verde acima de +5%, cinza na média, vermelho abaixo de -5%).
- Logo abaixo, uma linha discreta com a média da rede do período em R$/L, para o leitor saber a referência sem precisar olhar o rodapé.

## Detalhes técnicos

Ajuste apenas de texto no gerador de HTML do popup em `src/components/redeflex/NetworkMap.tsx` (função `balao`). Nenhuma mudança de cálculo, dados ou consultas.
