# Corrigir definitivamente os dados em produção

## Diagnóstico confirmado

- A produção está executando a revisão atual `mongo-interop-v2`, portanto não é mais um problema de publicação antiga.
- As seis funções falham antes de consultar o banco com `construtor MongoClient não encontrado`.
- O log do bundle publicado mostra apenas exports BSON; `MongoClient` e `default` estão ausentes. O fallback atual não pode recuperar um export que o empacotador removeu.
- O pacote instalado é o driver oficial Node.js `mongodb@7.5.0`, cujo arquivo de entrada realmente exporta `MongoClient`. A perda acontece na transformação da importação dinâmica genérica para o bundle de produção.

## Implementação

1. Criar um módulo servidor dedicado ao driver, com import nomeado explícito de `MongoClient` e uma função mínima que constrói/conecta o cliente.
2. Carregar esse módulo-ponte dinamicamente somente dentro da requisição, preservando a proteção contra inicialização de I/O no escopo global.
3. Remover de `mongo.server.ts` a inspeção genérica de exports e chamar a função do módulo-ponte.
4. Manter sem alterações o isolamento por requisição, `maxPoolSize: 1`, timeout, tentativa de `authSource`, fechamento no `finally`, cache e todas as consultas/cálculos.
5. Atualizar o identificador seguro do driver nos logs para distinguir esta correção da `mongo-interop-v2`.

## Validação

1. Gerar o bundle de produção e inspecionar o chunk para confirmar que o caminho executável de `MongoClient` foi preservado.
2. Executar as funções de galonagem, produto, lojas, acumulado, indicadores e categorias na prévia e confirmar dados reais.
3. Publicar a correção e invocar uma função diretamente no ambiente publicado.
4. Confirmar nos logs o novo identificador, ausência do erro do construtor e retorno de dados nas abas Diária e Mensal.

## Alternativa de segurança

Se o runtime de produção continuar removendo ou não suportando o driver mesmo com o módulo-ponte explícito, parar de adaptar esse pacote Node.js ao runtime e mover o acesso MongoDB para uma API HTTP compatível, mantendo intactas a interface e as transformações do dashboard.