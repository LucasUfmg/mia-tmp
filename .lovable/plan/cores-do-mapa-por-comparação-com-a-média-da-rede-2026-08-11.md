# Cores do mapa por comparação com a média da rede

Hoje a cor de cada posto no mapa vem de um corte por terços (percentis 33% e 66%), o que sempre pinta ~1/3 dos postos de cada cor. Passa a ser uma comparação com a **média de M/LT da rede** no período.

## Novo critério

A média usada é a média ponderada da rede no período (soma do resultado bruto dividida pela soma dos litros de todos os postos com movimento), que é o mesmo M/LT que o painel já mostra para a REDE.

- **Verde (alto)**: M/LT do posto ≥ 105% da média da rede
- **Amarelo (médio)**: entre 95% e 105% da média (na média)
- **Vermelho (baixo)**: abaixo de 95% da média
- **Cinza**: sem movimento no período (inalterado)

## Reflexo na tela

- A legenda do rodapé passa a dizer o que cada cor significa: "acima da média da rede", "na média", "abaixo da média", "sem movimento".
- O rodapé mostra a média da rede do período em R$/L, para o investidor ver a referência.
- O balão do posto ganha uma linha comparando o M/LT do posto com a média (ex.: "+8% vs. rede").

## Detalhes técnicos

- Em `src/components/redeflex/NetworkMap.tsx`, substituir a função `faixas` (percentis) por um cálculo de média ponderada sobre os postos com `comDados`, com margem de ±5%; `classificar` passa a comparar contra essa média.
- Guardar os limites em constantes (`MARGEM = 0.05`) para ajuste fácil.
- Sem mudanças em consultas, dados ou no restante do painel.
