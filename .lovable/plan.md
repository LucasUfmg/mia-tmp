# Dados de produto: usar LBCBi.Produtos como fonte de preço e custo

## O que encontrei na base (antes de mudar)

Conferi a coleção `LBCBi.Produtos` no cluster do RedeFlex:

- 74.751 documentos, 41 postos (`ibm`), chave única por `ibm` + `id` (nenhuma duplicidade).
- Campos: `_id, St, cBar, cNcm, cus, des, dtHr, eDe, eMa, eMi, eOl, ePi, eTo, gr, ibm, icm, id, vda` — tem estoque (`eTo`, `eMi`, `eMa`), grupo (`gr`), código de barras e NCM. É a tabela de cadastro/preço de produto de cada posto.
- `dtHr` tem apenas **dois valores em toda a coleção**: `2026-08-06T04:00` (74.252 docs) e `2024-08-21T04:00` (499 docs). É a data da última sincronização do cadastro, não a hora de cada venda.
- Não há quantidade vendida, cupom nem identificador de transação. Com essa coleção sozinha não é possível saber quanto foi vendido em um dia.
- `cus` e `vda` são strings: 26.564 registros com ponto decimal e 48.187 inteiros.

Ou seja: `des` = nome do produto, `vda` = preço de venda unitário, `cus` = custo unitário, `ibm` = posto — confirma sua descrição. O único ponto diferente é `dtHr`, que não marca a hora da venda; a quantidade e a hora precisam continuar vindo do cupom (`SalesMonitor.Vendas`), único lugar com movimento.

## O que vou mudar

`LBCBi.Produtos` passa a ser a fonte oficial de **nome, preço e custo**, e o cupom fica apenas como fonte de **quantidade e hora**:

1. Para cada item de mercadoria do cupom (`items.iTip = "0"`), fazer o join com `LBCBi.Produtos` por `ibm` + `id` do produto.
2. `Custo = Σ (Produtos.cus × quantidade vendida)` — hoje vem do `pC` gravado no cupom, passa a vir do `cus` do cadastro.
3. `Venda = Σ (Produtos.vda × quantidade vendida)`, usando o total do cupom como reserva quando o produto não estiver no cadastro.
4. `Resultado Bruto = venda − custo`; `LB% = resultado bruto / venda × 100`; `TMP = venda / nº de cupons`.
5. Nome do produto passa a ser o `des` do cadastro, padronizando descrições divergentes entre postos.
6. A pizza de produtos continua por grupo (`gr` → `LBCBi.Produtos_Grupos`), agora sempre pelo cadastro em vez do texto do cupom.

## Tratamento de dados inconsistentes

- Converter `cus` e `vda` de string para número dentro do próprio pipeline, com conversão segura (registro inconsistente é ignorado no custo em vez de derrubar o cálculo).
- Item vendido sem cadastro: usa o valor do cupom e entra numa contagem de "produtos sem cadastro".
- Aviso discreto no painel de produtos quando parcela relevante da receita vier de itens sem cadastro ou com `cus >= vda`, deixando claro que o número está limitado pela qualidade do cadastro e não pelo cálculo.

## Detalhes técnicos

- `src/lib/redeflex-mongo.server.ts`: adicionar `$lookup` de `SalesMonitor.Vendas` para `LBCBi.Produtos` (join `ibm` + `id`) nos pipelines de indicadores e de categorias de produto, com `$convert` em `cus`/`vda` e agregação por `qd`. Manter o cache atual por período.
- `src/lib/redeflex-dashboard.ts`: repassar os novos contadores de qualidade (`semCadastro`, `custoSuspeito`) para a UI.
- `src/components/redeflex/NetworkCard.tsx` e `DistributionCard.tsx`: exibir o aviso de qualidade quando presente.
- Validação: rodar o pipeline contra a base real e comparar Resultado Bruto e LB% antes e depois da troca da fonte de custo.