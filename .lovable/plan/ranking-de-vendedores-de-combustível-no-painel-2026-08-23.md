# Ranking de vendedores de combustível no painel

## O que foi confirmado no banco

- A coleção `Usuarios` existe no cluster de cadastros (mesmo do `Lojas`), com os campos `ibm`, `id`, `cod`, `nom`, `cpf`, `dtHr`.
- Cada abastecimento traz o campo `ven` (código do frentista). Testado no posto `00000000047501`: `ven` casa com `Usuarios.id` dentro do mesmo `ibm` (não com `cod`).
- A coleção guarda um retrato por dia: 73.513 documentos só para esse posto. Precisa de deduplicação por `ibm + id`, mantendo o registro mais recente.
- Existem cadastros que não são vendedores de verdade (ex.: `GERENTE`, `CANCELAMENTO CUPONS`, `PADRAO CADASTRO NOVOS`). Só aparecem no ranking se realmente tiverem venda no período.

## O que será construído

Um novo bloco "Ranking de Vendedores" no painel, abaixo das distribuições, respeitando exatamente os mesmos filtros que já existem hoje: seleção múltipla de postos, período Diário (on-time, cortado no horário atual) ou Mensal (acumulado do mês), e atualização automática.

Cada linha do ranking mostra:

- posição, nome do vendedor e posto
- litros vendidos
- faturamento
- M/LT (margem por litro)
- TMC (ticket médio por atendimento) e nº de atendimentos

Ordenação padrão por litros, com alternância entre "Maiores" e "Menores" e limite de 10 nomes (igual à lógica já usada no ranking de postos da Mia). Estados de carregando/vazio no mesmo padrão visual dos outros cartões.

A Mia também ganha a mesma leitura por WhatsApp ("quem vendeu mais hoje?"), usando a mesma função de dados.

## Detalhes técnicos

1. `src/lib/redeflex-mongo.server.ts`
   - `getRankingVendedores(dates, ibms, cutoffMinutes, desde, limite)`: agregação em `Abastecimentos` com `ori: {$in:["0","1"]}`, o filtro de período já existente (`filtroPeriodo`) e o filtro de IBM (`filtroDeIbm`), agrupando por `{ ibm, ven }` e somando `vol`, `val`, `cus` e contagem de atendimentos. Deriva litros, receita, resultado bruto, M/LT, TMC e TMV com as mesmas fórmulas de `getIndicadores`. `$sort` + `$limit` dentro do pipeline.
   - `nomesDeVendedores(pares)`: busca em `Usuarios` por `ibm` + `id ∈ (...)`, ordena por `dtHr` desc e mantém o primeiro nome por chave `ibm|id`. Sem nome cadastrado, exibe `Vendedor <ven>`.
2. `src/lib/redeflex.functions.ts`: novo server function `carregarRankingVendedores` (dentro de `comSessao` e do cache de 5 minutos, seguindo o padrão atual das outras funções).
3. `src/lib/redeflex-dashboard.ts`: `loadRankingVendedores(selecao, periodo, ordem, limite)` + tipo `Vendedor`.
4. `src/components/redeflex/SellerRanking.tsx`: novo cartão com tabela responsiva (cards empilhados no mobile), medalha/posição, toggle maiores/menores, usando somente tokens de cor existentes.
5. `src/routes/index.tsx`: `useQuery` própria com as mesmas opções de refetch das demais e renderização do novo cartão.
6. `src/lib/mia/tools.server.ts`: ferramenta `ranking_vendedores` (escopo hoje/mês, ordem, limite, postos) reaproveitando a mesma função de dados.
