# API própria de dados: RedeFlex BI direto no MongoDB

## Como os dados são ingeridos hoje (verificado)

No `redeflexapp.com.br/home` não existe API pública consumida pelo navegador: os
números chegam via **Server Actions do Next.js** (4 POSTs para `/home` com header
`next-action`), cada uma recebendo só um timestamp ISO, e o retorno vem em formato
RSC. Sem sessão, retorna vazio. No servidor, essas actions executam as agregações do
`DataService.ts` do repo `sintese-bi/new-flex-micro-service-mongo-db`.

Verificado no `DataService.ts`:

- Galonagem: coleção `abastecimentos` no banco **GasMonitor** — filtra `ori in ['0','1']`,
  soma `vol`, agrupa por `dtHr` formatado como `%Y-%m-%d`, com correção de fuso de -3h.
- Produto: coleção `vendas` no banco **Sales** — `$unwind items`, filtra `items.iTip = '0'`,
  soma `items.tot`, agrupa por dia com a mesma correção de -3h.
- Por posto: mesmas agregações com `_id: { data, ibm }` — daí vem a chave `IBM_YYYY-MM-DD`.

## O que vamos construir

Substituir a camada mock (`src/lib/redeflex-datasource.ts`) por uma API própria dentro
do RedeFlex que lê o MongoDB direto, replicando essas agregações. A transformação
`IBM_data → array` e todo o front (filtro de posto, variação semanal, projeção mensal,
auto-refresh de 60s) continuam iguais — só a fonte muda.

### Passos

1. **Credenciais**: guardar a connection string como secret (`MONGODB_URI`). Se
   GasMonitor e Sales estiverem em clusters diferentes, guardamos duas
   (`MONGODB_URI_GASMONITOR` e `MONGODB_URI_SALES`) e os nomes dos bancos.
2. **Camada de acesso** (`src/lib/mongo.server.ts`): cliente `mongodb` (>= 6.15, que
   funciona no runtime do app) reaproveitado entre requisições, lido de `process.env`
   dentro do handler.
3. **Agregações** (`src/lib/redeflex-mongo.server.ts`): portar as 4 funções do
   `DataService.ts` — `calcFuelByDates`, `calcProductByDates`, `getVolumePorPosto`,
   `getItensTotaisPorPosto` — com o mesmo pipeline, o mesmo ajuste de -3h e retornando
   o objeto no formato `{ "IBM_2025-11-28": 8489.50 }` / `{ "2025-11-28": ... }`.
4. **Server functions** (`src/lib/redeflex.functions.ts`): `getFuelSeries` e
   `getProductSeries`, recebendo `{ datas: string[], escopo: "REDE" | ibm }` e
   devolvendo o objeto bruto de chaves.
5. **Lista de postos**: server function que devolve os IBMs distintos encontrados no
   período, alimentando o Select do topo (hoje derivado dos dados mock).
6. **Trocar a fonte**: `redeflex-dashboard.ts` passa a chamar as server functions em vez
   do mock; a transformação, o cálculo de variação e a projeção mensal ficam intactos.
7. **Validar**: rodar as agregações contra o banco real e comparar os valores de
   galonagem/produto com o que aparece em `redeflexapp.com.br/home`.

## Detalhes técnicos

- Acesso ao Mongo só no servidor (`*.server.ts` + `createServerFn`); nunca no browser.
- Datas continuam calculadas no fuso America/Sao_Paulo, mantendo o offset de -3h que o
  banco exige.
- O IP do runtime precisa estar liberado no Atlas Network Access (se houver allowlist,
  pode ser necessário liberar 0.0.0.0/0 ou usar um usuário dedicado somente-leitura).
- Recomendo um usuário Mongo **read-only** para essa connection string.

## Fora deste passo

Big numbers de M/LT, RB, LB e os gráficos de pizza continuam com os dados da planilha;
migramos depois, quando galonagem e produto estiverem validados contra o banco.
