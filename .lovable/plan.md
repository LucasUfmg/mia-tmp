# Projeção vs Meta na aba Projeções

## O que muda para o usuário
Na aba **Projeções** (Contábil), cada projeção passa a ser comparada com uma **meta**. A meta é a projeção feita com a média diária de toda a série histórica (meses fechados já carregados, até 12), nos mesmos horizontes: fim do mês, próximos 3 meses e próximos 6 meses.

Dentro de cada célula da tabela:
- valor projetado (como hoje), colorido conforme a comparação com a meta;
- abaixo, em letra pequena: `Meta: R$ X` e a diferença em % (ex.: `+4,2%`).

Regra de cor:
- Receita bruta, Result. Operacional Bruto, EBITDA, Resultado final e EBITDA por litro: acima da meta = verde, abaixo = vermelho.
- CMV e Despesas totais (invertido, pois custo maior é pior): acima da meta = vermelho, abaixo = verde.
- Igual à meta ou sem meta calculável: cor neutra.

A coluna "Realizado até hoje" não muda. A nota explicativa ganha uma frase: "Meta = média diária dos N meses fechados com dados do BI (jan/26 a set/26), projetada para o mesmo horizonte." Uma legenda curta mostra verde = melhor que a meta, vermelho = pior que a meta.

Respeita o posto escolhido. Se não houver nenhum mês fechado com dados do BI, as células mostram "Meta indisponível" e ficam neutras.

## Como a meta é calculada
1. Para o posto escolhido, pega cada mês anterior ao atual que tenha receita do BI (combustível + mercadorias > 0).
2. Soma, por rubrica, os valores desses meses (BI e despesas lançadas, mês inteiro, sem proporcionalização) e divide pelo total de dias desses meses.
3. Multiplica pela quantidade de dias do horizonte (mesmos `diasDosMeses` já usados na projeção).
4. EBITDA, IRPJ/CSLL 34%, Resultado líquido e Resultado final são recalculados pela fórmula central da DRE, igual à projeção. EBITDA por litro = EBITDA da meta ÷ litros da meta.

## Detalhes técnicos
- `src/lib/ebitda.ts`: nova função `metaHistorica(mensais: DreConsolidada[], mes, horizonteDias)` que soma as rubricas (`linhasEbitda` + campos do BI), divide pelos dias dos meses, escala ao horizonte e chama `calcularEbitda`; retorna o mesmo formato de `projetarDre` (com `custoBi`, `litros`, `ebitdaPorLitro`). Fórmulas continuam centralizadas neste arquivo.
- `src/components/redeflex/DreDashboard.tsx` (componente `Projecoes`): monta a lista de meses fechados (`mes < mesCorrente`, com BI carregado) a partir de `calculos` via `consolidarEbitda(calculos, selecao, [m])`; calcula a meta por horizonte; novo helper de cor/variação com flag de inversão (`neg`) para CMV e Despesas; renderiza meta e variação em cada célula, inclusive na linha "EBITDA por litro". Sem novas consultas ao BI: usa o que a tela já carregou.
- A Mia não é alterada nesta etapa (a meta histórica depende de vários meses do BI; posso estendê-la depois se quiser).
- Validação: `npx tsgo --noEmit` e conferência no preview (desktop e mobile) das cores, da legenda e do estado sem histórico.
