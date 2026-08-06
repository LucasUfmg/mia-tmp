# Resultado Bruto de Produtos: fórmula confirmada + aviso de custo suspeito

## Diagnóstico (verificado na base)
- A fórmula está correta: por item de mercadoria (`items.iTip = "0"`), `receita = Σ items.tot` e `custo = Σ (items.pC × items.qd)`; `Resultado Bruto = receita − custo` e `LB% = RB / receita × 100`.
- `items.pC` é custo **unitário**: em toda a amostra `tot = pUn × qd` e `pC` fica logo abaixo de `pUn`. Multiplicar por `qd` está certo.
- O problema está no dado: em agosto/2026 (mercadoria) receita R$ 93.410 contra custo R$ 91.387 → LB 2,17%, porque o `pC` cadastrado está quase igual ao preço de venda. 28 itens no mês têm custo maior que o valor vendido (margem negativa).

## O que fazer
Nenhuma mudança na fórmula. Acrescentar transparência de qualidade de dado, para que o número baixo não pareça erro do BI:

1. Na agregação de produtos, contar também:
   - `itensProduto`: total de itens de mercadoria no período;
   - `itensCustoSuspeito`: itens em que `pC × qd >= tot` (custo igual ou acima da venda).
2. Expor esses dois números pelo server function de indicadores até o dashboard.
3. No card "Rede Produtos", quando houver itens suspeitos, exibir uma linha discreta no rodapé do card (mesmo estilo do `note` atual), por exemplo: "28 de 1.396 itens com custo cadastrado ≥ preço de venda — LB pode estar subestimado."

## Detalhes técnicos
- `src/lib/redeflex-mongo.server.ts`: no segundo `$group` de produtos em `getIndicadores`, somar os contadores com `$cond`; incluir `itens` e `itensSuspeitos` no tipo `Indicadores.produto`.
- `src/lib/redeflex.functions.ts`: repassar os campos novos (sem mudança no schema de entrada).
- `src/lib/redeflex-dashboard.ts`: levar os campos até o objeto do card de produtos.
- `src/routes/index.tsx` + `NetworkCard.tsx`: usar o `note` do card de produtos para o aviso condicional; sem componente novo.
- Escopo fechado: nada de alteração em combustível, cache ou consultas mensais.