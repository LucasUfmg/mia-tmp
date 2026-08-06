# Produto: custo e venda vindos de LBCBi.Produtos

Os dados de produto passam a usar `LBCBi.Produtos` (`des`, `vda`, `cus`, `ibm`) como fonte de nome, preço e custo. A quantidade e a hora da venda continuam vindo do cupom em `SalesMonitor.Vendas`, porque é o único lugar da base que registra movimento (em `LBCBi.Produtos` o `dtHr` tem só dois valores no total — é a data de sincronização do cadastro).

## Como fica o cálculo

Para cada item de mercadoria do cupom (`items.iTip = "0"`), junto com o cadastro por `ibm` + `id` do produto:

- Nome do produto: `des` do cadastro
- Venda: `Σ (vda × quantidade vendida)`
- Custo: `Σ (cus × quantidade vendida)`
- Resultado Bruto: `venda − custo`
- LB%: `resultado bruto / venda × 100`
- TMP: `venda / nº de cupons`

Quando o item vendido não existir no cadastro, uso o valor do próprio cupom para não perder faturamento.

A pizza de produtos passa a agrupar pelo grupo do cadastro (`gr` → `LBCBi.Produtos_Grupos`, casando por `ibm` + `gr`, já que a numeração de grupo muda por posto).

## Detalhes técnicos

- `src/lib/redeflex-mongo.server.ts`: `$lookup` de `SalesMonitor.Vendas` para `LBCBi.Produtos` por `ibm` + `id`, com `$convert` de `cus`/`vda` (são strings) para número, nos pipelines de indicadores e de categorias de produto. Cache por período mantido.
- `src/lib/redeflex-dashboard.ts`: sem mudança de contrato — os mesmos campos, agora com origem nova.
- Validação: rodar contra a base real e comparar Resultado Bruto e LB% antes e depois, tanto para a REDE quanto para um IBM individual.