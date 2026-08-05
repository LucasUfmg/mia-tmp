# Produção: driver do banco + cache das consultas

## Diagnóstico confirmado (produção)

Os logs do site publicado mostram, em todas as seis funções de dados, o mesmo erro:

```text
[RedeFlex:getFuelSeries] TypeError: MongoClient is not a constructor
    at conectar (_ssr/mongo.server-*.mjs:50)
```

Ou seja: o erro anterior de "global scope" foi resolvido, mas a importação dinâmica
`await import("mongodb")` dentro do handler devolve, no bundle do runtime publicado, um
módulo CommonJS interoperado — `MongoClient` fica em `default`, não como export nomeado.
Por isso a conexão nunca é criada e o dashboard mostra "falha ao carregar dados"
apenas em produção (no preview, em Node, o export nomeado existe).

## Correção da conexão

1. Em `src/lib/mongo.server.ts`, resolver o construtor com fallback de interop:
   ler o módulo importado e usar `mod.MongoClient` ou `mod.default.MongoClient`,
   falhando com mensagem clara se nenhum existir.
2. Manter tudo o mais como está: import dinâmico dentro do handler, sessão por
   requisição, `maxPoolSize: 1`, fechamento no `finally`.
3. Manter o log com prefixo por função para diagnosticar rapidamente se o
   publicado voltar a falhar.

## Cache das consultas

Objetivo: recarregar a página (ou trocar de aba e voltar) não deve disparar de novo
as agregações pesadas.

1. Chave de cache por escopo: aba (Diária/Mensal), seleção (Rede ou IBM) e o
   intervalo de datas efetivo já calculado — assim Diária e Mensal têm caches
   independentes e não se invalidam entre si.
2. Cache no cliente (TanStack Query): `staleTime` de 5 minutos e `gcTime` maior,
   com persistência em `sessionStorage`. Ao recarregar a página, os últimos dados
   válidos aparecem na hora e só são reconsultados se estiverem vencidos.
3. Cache no servidor: memória de curta duração por chave de consulta dentro do
   Worker (TTL de 5 minutos), de forma que múltiplos acessos/abas compartilhem o
   mesmo resultado sem reabrir sessões no banco. O cache guarda somente o
   resultado agregado — nunca clientes ou conexões — para não reintroduzir o
   problema de I/O fora do escopo da requisição.
4. Botão **Atualizar** passa a forçar releitura ignorando o cache (invalidação
   explícita), e a atualização automática de 60s continua, apenas servida pelo
   cache quando ainda fresca.
5. "Última atualização" continua mostrando o horário da leitura que gerou os
   dados em tela, para ficar claro quando o valor vem do cache.

## Validação

1. Build de produção e execução do bundle do Worker localmente para reproduzir o
   ambiente publicado e confirmar que as funções retornam dados (e não o
   `TypeError`).
2. No preview, medir que o segundo carregamento da mesma aba/intervalo não gera
   novas consultas ao banco (log de execução) e que o botão Atualizar gera.
3. Depois de publicar, inspecionar as respostas reais no domínio publicado e os
   logs do servidor.

## Limite da mudança

Nada de fórmulas, filtros, períodos ou layout muda. A alteração é na criação da
conexão e na camada de cache.
