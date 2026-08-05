# Restaurar os dados do RedeFlex em produção

## Diagnóstico confirmado

- A produção ainda está executando o bundle antigo `mongo.server-HfUe-Kbj`, que falha com `MongoClient is not a constructor` nas seis funções do dashboard.
- O código-fonte atual já contém o fallback de interoperabilidade e gera o bundle novo `mongo.server-IXdeVJjk`.
- A estrutura do bundle novo foi testada diretamente: o export resolvido contém um `MongoClient` construtível. Portanto, o erro observado agora corresponde à versão antiga ainda publicada, não a uma nova falha das consultas.

## Implementação

1. Tornar a resolução do driver explícita e defensiva em `mongo.server.ts`:
   - aceitar export nomeado, `default.MongoClient` e o próprio `default` quando ele for o construtor;
   - validar que o candidato é realmente construtível antes de abrir a conexão;
   - emitir erro diagnóstico sem expor credenciais, incluindo somente a forma dos exports e uma identificação da versão da conexão.
2. Preservar o modelo atual exigido pelo runtime:
   - importação dinâmica dentro da requisição;
   - sessão isolada por requisição;
   - `maxPoolSize: 1`;
   - fechamento de todos os clientes no `finally`;
   - logs com prefixo de cada função.
3. Adicionar uma identificação segura do código da conexão aos logs para distinguir imediatamente uma publicação antiga de uma nova, sem registrar URI ou segredo.
4. Manter cache e consultas do dashboard inalterados; a mudança ficará restrita à inicialização e ao diagnóstico do driver.

## Validação

- Validar localmente o bundle de produção e instanciar o construtor exatamente pela mesma rota de importação gerada pelo empacotador.
- Publicar a nova versão e chamar uma função de dados no ambiente publicado.
- Confirmar nos logs que o novo identificador está ativo e que não há mais `MongoClient is not a constructor`.
- Abrir o dashboard publicado e verificar abas diária/mensal, filtro Rede/posto, atualização e retorno dos seis conjuntos de dados.
- Se a nova identificação não aparecer, tratar como falha de implantação/cache da publicação, não como falha do MongoDB.