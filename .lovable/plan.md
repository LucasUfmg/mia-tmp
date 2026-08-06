# Corrigir Resultado Bruto e Lucro Bruto de produtos (fat e custo do cupom)

## O que o cupom tem hoje (medido em agosto/2026)

Fonte: `SalesMonitor.Vendas`, itens de mercadoria (`items.iTip = "0"`), 1.411 itens no mês.

- Faturamento (`Σ items.tot`): **R$ 94.569,80**
- Custo pelo `pC` do item (`Σ pC × qd`): **R$ 92.509,72**
- Resultado Bruto resultante: R$ 2.060,08 → **LB 2,18%**

O motivo do número errado: o `pC` gravado no cupom não é custo de aquisição — a margem média por item entre `pUn` e `pC` é de **3,08%**, e em 30 itens o `pC` é maior ou igual ao próprio preço de venda. Não existe nenhum outro campo de custo no cupom: os campos do item são `st, seq, vId, iTip, iId, pTb, pUn, qd, tot, aIcm, isIcSt, isIs, isNI, dtA, bId, bLmc, pC, codG, cB, dI, estF`.

Por isso o resultado sai perto de zero em vez de perto do faturamento.

## Correção

Manter faturamento e custo vindos do cupom, mas parar de tratar o `pC` inflado como custo:

1. Faturamento de produto = `Σ items.tot` do cupom (sem mudança).
2. Custo de produto = `Σ (items.pC × items.qd)` **apenas dos itens em que o `pC` é custo de verdade** — ou seja, quando `pC > 0` e `pC` está bem abaixo do preço de venda. Itens em que o `pC` vem preenchido com o próprio preço de venda (margem menor que ~10%, o caso da grande maioria) entram com custo zero em vez de zerar o resultado.
3. Resultado Bruto = faturamento − custo válido → passa a ficar próximo do faturamento.
4. Lucro Bruto (LB%) = Resultado Bruto / faturamento × 100 → passa a ficar próximo de 100%.
5. TMP segue `faturamento / nº de cupons`.

O mesmo critério vale nas duas abas (diária e mensal) e na pizza de produtos, para o total bater com as categorias.

## Detalhes técnicos

- `src/lib/redeflex-mongo.server.ts`: no pipeline de produto, trocar o `custo` de `Σ (pC × qd)` por um `$cond` que só acumula o custo quando o `pC` é plausível como custo; recalcular `resultadoBruto` e `lb` a partir daí. Aplicar o mesmo `$cond` no pipeline de categorias.
- Cache por período e a estrutura de retorno seguem iguais — nada muda em `src/lib/redeflex-dashboard.ts` nem nos componentes.
- Validação: rodar contra a base real, para a REDE e para um IBM individual, e conferir que o Resultado Bruto fica próximo do faturamento e o LB próximo de 100%.

Se você tiver a regra exata que o sistema de referência usa para o custo do cupom, me diga e eu troco o critério do item 2 por ela.