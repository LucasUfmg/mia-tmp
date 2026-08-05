# Corrigir "falha ao carregar dados" no site publicado

## O que está acontecendo

No site publicado (`redeflexapp.lovable.app`) todas as consultas ao banco retornam o
mesmo erro do runtime de produção:

```text
Disallowed operation called within global scope. Asynchronous I/O (ex: fetch() or
connect()), setting a timeout, and generating random values are not allowed within
global scope.
```

Confirmado abrindo o site publicado e lendo as respostas do servidor: os cards ficam
todos em "—" e a distribuição fica em "Carregando dados…". No preview funciona porque
o ambiente de desenvolvimento roda em Node e não aplica essa restrição.

Causa: a conexão com o MongoDB (e o cache de nomes de coleção) é guardada em
`globalThis` (`src/lib/mongo.server.ts`). Em produção, a conexão/promise criada em uma
requisição é reaproveitada por outra requisição, e o runtime trata essa I/O como
"global scope" e bloqueia — por isso o erro em toda chamada.

## Correção

1. Remover o cache em `globalThis` de `src/lib/mongo.server.ts`:
   - conexão e resolução de nome de coleção passam a ser criadas dentro da chamada
     (por requisição), sem promises compartilhadas entre requisições;
   - cache de nome de coleção fica em memória apenas dentro da mesma requisição.
2. Introduzir um helper de sessão por requisição: cada função de servidor abre os
   clientes de que precisa, executa as agregações em paralelo e fecha os clientes ao
   final (`client.close()`), evitando conexões penduradas.
3. Reduzir o número de conexões por requisição: `maxPoolSize: 1` e
   `serverSelectionTimeoutMS` menor (~8s) para falhar rápido em vez de estourar o
   tempo do runtime.
4. Consolidar as consultas de cada função de servidor para reutilizar a mesma sessão
   (ex.: `getCategorias` e `getIndicators` abrem uma sessão só e rodam as agregações
   de combustível e produto dentro dela).
5. Mensagem de erro amigável mantida na tela, mas com o motivo real logado no servidor
   para diagnóstico futuro.

## Detalhes técnicos

- `src/lib/mongo.server.ts`: substituir `globalCache`/`cache()` por
  `abrirSessao()` que devolve `{ colecao(fonte, candidatos), fechar() }`, com um `Map`
  local de clientes por fonte e de nomes de coleção resolvidos. `uri()`,
  `nomeDoBanco()` e o fallback de `authSource` permanecem como estão.
- `src/lib/redeflex-mongo.server.ts`: cada função exportada
  (`calcFuelByDates`, `calcProductByDates`, `getVolumePorPosto`,
  `getItensTotaisPorPosto`, `calcFuelMonthToDate`, `calcProductMonthToDate`,
  `getIndicadores`, `getCategoriasCombustivel`, `getCategoriasProduto`,
  `listarLojas`, `listarPostos`) recebe a sessão como parâmetro interno; wrappers
  públicos abrem/fecham a sessão com `try/finally`. Pipelines de agregação não mudam.
- Nenhuma mudança de secrets, de schema ou de UI/cálculos.

## Verificação

- Rodar o build de produção.
- Após publicar, abrir o site publicado e confirmar que as respostas das funções de
  servidor voltam com números (sem o erro de "global scope") e que os cards e as
  pizzas preenchem, nas abas Diária e Mensal.
