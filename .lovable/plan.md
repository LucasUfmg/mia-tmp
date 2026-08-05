# Corrigir atualização do dashboard publicado

## Diagnóstico confirmado

No site publicado, a página abre, mas todas as seis funções de dados retornam dentro da resposta RPC:

`Disallowed operation called within global scope`

O fluxo já abre e fecha cada conexão dentro de uma sessão por requisição, porém `src/lib/mongo.server.ts` ainda importa `MongoClient` estaticamente no topo do módulo. Isso inicializa código do driver antes da execução do handler no ambiente publicado, fazendo todas as consultas falharem juntas.

## Implementação

1. Remover a importação runtime estática de `mongodb` do módulo de conexão, preservando somente imports de tipos no escopo do arquivo.
2. Carregar `MongoClient` dinamicamente dentro da função de conexão, que só é chamada durante a execução da função de servidor.
3. Manter o isolamento atual por requisição e o fechamento garantido das conexões, sem alterar cálculos, filtros, períodos ou apresentação do dashboard.
4. Acrescentar contexto de erro seguro às funções de dados para identificar qual consulta falhou, sem expor credenciais ou detalhes internos na interface.

## Validação

1. Verificar localmente as consultas de lojas, séries, acumulado mensal, indicadores e categorias.
2. Confirmar no navegador que a atualização manual e automática deixam de exibir “Falha ao atualizar”.
3. Depois de publicada a nova versão, inspecionar as respostas reais das funções no domínio publicado e confirmar que retornam dados, não erros serializados com HTTP 200.

## Limite da mudança

Esta correção atua apenas no carregamento runtime do driver e na observabilidade dos erros. Os dados, fórmulas e layout permanecem inalterados.