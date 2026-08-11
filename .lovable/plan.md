# Mapa da rede com a localização dos postos

## O que foi verificado

- `LBCBi.Lojas` (MongoDB) tem 41 postos com `ibm`, `nomeFantasia`, `razaoSocial`, `cnpj`, `rede` — **sem coordenadas**.
- No backend `rede-flex-back-end-main`, a tabela **`ibm_info` (Postgres)** guarda `lat`, `long`, `cep`, `endereco`, `nomefantasia`, `ibm` e `regional` (visto em `prisma/schema.prisma` e na migration `newcolumnendereco`).

Logo, o mapa é possível: coordenadas vêm do Postgres, métricas continuam vindo do Mongo, cruzando pelo **IBM**.

## Pré-requisito

Preciso da connection string do Postgres do backend (de preferência um usuário **somente-leitura**). Ela será guardada como secret (`REDEFLEX_PG_URL`) e usada apenas no servidor.

## O que será construído

1. **Acesso ao Postgres** (`src/lib/postgres.server.ts`): cliente lido de `process.env` dentro do handler, no mesmo padrão já usado para o Mongo (import dinâmico, sem I/O em escopo global do Worker).
2. **Consulta de localizações** (`src/lib/redeflex-postgres.server.ts`): `listarLocalizacoes()` → `SELECT ibm, nomefantasia, endereco, cep, lat, long FROM ibm_info WHERE lat IS NOT NULL AND long IS NOT NULL`, normalizando o IBM para o mesmo formato do Mongo (zeros à esquerda) e descartando registros sem coordenada.
3. **Server function** (`src/lib/redeflex.functions.ts`): `getLocalizacoes`, com cache de servidor (mesma camada `cache.server.ts`) — cadastro muda pouco.
4. **Indicadores por posto para o mapa** (`src/lib/redeflex-mongo.server.ts` / `redeflex-dashboard.ts`): uma agregação que devolve, no período selecionado (diário on-time ou mensal), por IBM: litros, faturamento, resultado bruto, M/LT, TMC. Hoje os indicadores são calculados só para o escopo selecionado; o mapa precisa de todos os postos de uma vez.
5. **Bloco "Mapa da rede"** (`src/components/redeflex/NetworkMap.tsx`): novo card **no início do painel**, antes do comparativo, no mesmo estilo dos outros cards.
   - Google Maps (conector Google Maps Platform, chave de browser) carregado apenas no cliente.
   - Um marcador por posto, **colorido por desempenho de M/LT** no período (verde / amarelo / vermelho por faixas relativas à rede) e com tamanho proporcional ao volume vendido.
   - Balão ao clicar: nome do posto, endereço, volume vendido, Resultado Bruto, M/LT e TMC — nos mesmos formatos do painel (L, R$, %).
   - Clicar em "Ver detalhes" no balão aplica o filtro do topo para aquele posto, atualizando todo o painel.
   - Enquadramento automático nos postos com coordenada; legenda de cores no pé do card.
   - Se o Postgres não responder, o card mostra aviso discreto e o resto do painel continua funcionando.

## Detalhes técnicos

- Conexão Postgres apenas em arquivos `*.server.ts` chamados por `createServerFn`; nada de credencial no browser.
- O IBM do Postgres pode estar sem os zeros à esquerda; a junção usa o IBM normalizado com 14 caracteres, e postos sem match aparecem no mapa apenas com nome/endereço (sem métricas).
- O mapa fica atrás de `<ClientOnly>` com import dinâmico, respeitando as regras de SSR do projeto.
- Preciso conectar o conector do Google Maps Platform (chave gerenciada pela Lovable) para renderizar o mapa.

## Fora deste passo

Não vou alterar o cálculo dos índices atuais nem os demais cards; o mapa apenas consome os mesmos números por posto.
